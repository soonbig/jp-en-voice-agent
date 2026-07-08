// saas-agent-tools — Vapi tool backend + custom-llm proxy + console read API
//
// POST /                 -> Vapi tool calls (search_knowledge[_JP], create_ticket[_JP], lookup_ticket[_JP])
// POST /chat/completions -> Vapi custom-llm endpoint (strips metadata, forwards via /openai BYOK)
// POST /chat             -> text chat for the console
// GET  /tickets          -> recent tickets for the console CRM panel
// OPTIONS *              -> CORS preflight

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors() });
    }

    // Read endpoint for the console UI
    if (request.method === "GET" && url.pathname === "/tickets") {
      try {
        const { results } = await env.DB.prepare(
          "SELECT id, subject, description, priority, team, customer, summary, status, created_at FROM tickets ORDER BY id DESC LIMIT 20"
        ).all();
        return json({ tickets: results || [] });
      } catch (e) {
        return json({ tickets: [], error: String(e) });
      }
    }

    // Text chat — same RAG, tools, model, and gateway as voice
    if (request.method === "POST" && url.pathname === "/chat") {
      try {
        const body = await request.json();
        const out = await handleChat(env, body.messages || []);
        return json(out);
      } catch (e) {
        return json({ reply: "Sorry, something went wrong on my end.", toolsUsed: [], sources: [], error: String(e) });
      }
    }

    // Vapi custom-llm endpoint. Vapi adds fields OpenAI rejects (integer
    // metadata.numAssistantTurns, call, timestamp) — especially on interrupted
    // turns — causing a 400. Strip everything but valid OpenAI chat fields,
    // forward via the gateway's BYOK /openai endpoint, and stream the SSE back.
    if (request.method === "POST" && url.pathname === "/chat/completions") {
      return llmProxy(request, env);
    }

    if (request.method !== "POST") {
      return new Response("saas-agent-tools: ok", { status: 200, headers: cors() });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ results: [] });
    }

    const toolCalls =
      body?.message?.toolCallList || body?.message?.toolCalls || [];

    const results = [];
    for (const call of toolCalls) {
      const id = call.id;
      // Normalize so JP tool names (search_knowledge_JP, …) hit the same logic.
      const name = (call.function?.name || "").replace(/_JP$/, "");

      let args = call.function?.arguments;
      if (typeof args === "string") {
        try {
          args = JSON.parse(args);
        } catch {
          args = {};
        }
      }
      args = args || {};

      let result;
      switch (name) {
        case "search_knowledge":
          result = await searchKnowledge(env, args.query);
          break;
        case "create_ticket":
          result = await createTicket(env, args);
          break;
        case "lookup_ticket":
          result = await lookupTicket(env, args.ticket_id);
          break;
        default:
          result = `Unknown tool: ${name}`;
      }

      results.push({ toolCallId: id, result: String(result) });
    }

    return json({ results });
  },
};

// ── Japanese helpers ──

// Detects Japanese (hiragana, katakana, kanji, half-width kana).
const HAS_JP = /[぀-ヿ㐀-䶿一-龯ｦ-ﾟ]/;

const KANJI_DIGIT = { "〇":0,"零":0,"一":1,"二":2,"三":3,"四":4,"五":5,"六":6,"七":7,"八":8,"九":9 };
const KANJI_UNIT  = { "十":10,"百":100,"千":1000 };

// "一二六" -> 126 (digit-by-digit), "百二十六" -> 126 (positional).
function kanjiToNumber(str) {
  if (!/[〇零一二三四五六七八九十百千万]/.test(str)) return null;
  if (/[十百千万]/.test(str)) {
    let total = 0, section = 0, current = 0;
    for (const ch of str) {
      if (ch in KANJI_DIGIT) current = KANJI_DIGIT[ch];
      else if (ch in KANJI_UNIT) { section += (current || 1) * KANJI_UNIT[ch]; current = 0; }
      else if (ch === "万") { total += (section + current) * 10000; section = 0; current = 0; }
    }
    return total + section + current;
  }
  let out = "";
  for (const ch of str) if (ch in KANJI_DIGIT) out += KANJI_DIGIT[ch];
  return out ? parseInt(out, 10) : null;
}

// Resolves a number spoken/transcribed as ASCII, full-width, or kanji.
function resolveJaNumber(raw) {
  let s = String(raw ?? "").trim();
  s = s.replace(/[０-９]/g, (d) => "０１２３４５６７８９".indexOf(d)); // full-width → ASCII
  const ascii = s.replace(/\D/g, "");
  if (ascii) return parseInt(ascii, 10);
  return kanjiToNumber(s) || 0;
}

// ── Tools ──

async function searchKnowledge(env, query) {
  if (!query || typeof query !== "string") {
    return "No search query was provided.";
  }

  // The KB is mostly English — a raw Japanese query scores ~0.41 and gets
  // filtered by match_threshold. Translate JA→EN first so it scores ~1.0.
  let q = query;
  if (HAS_JP.test(query)) {
    try {
      const t = await env.AI.run("@cf/meta/m2m100-1.2b", {
        text: query,
        source_lang: "ja",
        target_lang: "en",
      });
      if (t?.translated_text) q = t.translated_text;
    } catch {
      /* fall back to the original query */
    }
  }

  const res = await env.SAAS_KB.search({
    query: q,
    ai_search_options: {
      retrieval: { max_num_results: 3, match_threshold: 0.4 },
    },
  });

  const chunks = res?.chunks || [];
  if (chunks.length === 0) {
    return "NO_MATCH: nothing relevant was found in the Gatewise knowledge base. Do not answer from memory. Tell the customer this is not documented and offer to escalate.";
  }

  const passages = chunks.map((c) => {
    const source = c.item?.key || "unknown";
    const text = (c.text || "").replace(/\s+/g, " ").trim();
    return `[source: ${source}] ${text}`;
  });

  return passages.join("\n\n");
}

async function createTicket(env, args) {
  const subject = args.subject || "Support request";
  const description = args.description || "";
  const priority = args.priority || "P3";
  const team = args.team || "Support";
  const customer = args.customer || "";
  const summary = args.summary || "";
  const createdAt = Date.now();

  const res = await env.DB.prepare(
    "INSERT INTO tickets (subject, description, priority, team, customer, summary, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'Open', ?)"
  )
    .bind(subject, description, priority, team, customer, summary, createdAt)
    .run();

  const id = res?.meta?.last_row_id;
  return `Created ticket #${id} — priority ${priority}, routed to ${team}, status Open. Give the customer their reference number ${id}. Do not read internal priority/routing notes aloud.`;
}

async function lookupTicket(env, ticketId) {
  // Handles ASCII (126), full-width (１２６), and kanji (一二六 / 百二十六).
  const id = resolveJaNumber(ticketId);
  if (!id) {
    return "No valid ticket ID was provided.";
  }

  const row = await env.DB.prepare("SELECT * FROM tickets WHERE id = ?")
    .bind(id)
    .first();

  if (!row) {
    return `No ticket found with ID ${id}.`;
  }

  return `Ticket #${row.id}: "${row.subject}". Status: ${row.status}. Priority: ${row.priority}. Assigned team: ${row.team}.`;
}

// ── Vapi custom-llm proxy: sanitize → gateway (BYOK /openai) → stream back ──

const OPENAI_CHAT_FIELDS = [
  "messages", "tools", "tool_choice", "parallel_tool_calls",
  "temperature", "top_p", "max_tokens", "max_completion_tokens",
  "stream", "stream_options", "stop", "n", "seed",
  "presence_penalty", "frequency_penalty", "response_format", "logprobs",
];

async function llmProxy(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const clean = {};
  for (const k of OPENAI_CHAT_FIELDS) {
    if (body[k] !== undefined) clean[k] = body[k];
  }
  // The /openai BYOK endpoint expects a bare model id (no "openai/" prefix).
  clean.model = (body.model || "gpt-4o-mini").replace(/^openai\//, "");

  const upstream = await fetch(GATEWAY_OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(clean),
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "content-type": upstream.headers.get("content-type") || "application/json",
      ...cors(),
    },
  });
}

// ── Gateway endpoints ──
// Replace YOUR_ACCOUNT_ID and YOUR_GATEWAY with your own AI Gateway values.

// /compat (unified) — used by the text-chat loop below.
const GATEWAY_CHAT_URL =
  "https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_ID/saas-agent/compat/chat/completions";

// /openai (BYOK) — used by the voice proxy; forwards your key straight to OpenAI.
const GATEWAY_OPENAI_URL =
  "https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_ID/saas-agent/openai/chat/completions";

// ── Text chat: runs the same tools through AI Gateway (OpenAI-compatible) ──

const CHAT_SYSTEM_PROMPT = `You are the Gatewise support assistant, helping over text chat. Gatewise is a Zero Trust access and identity platform (SSO, SCIM, device posture, access policies). You are chatting with an authenticated Gatewise customer on the Enterprise plan.

Keep replies concise and clear.

Grounding (important): for ANY question about Gatewise features, plans, setup, or troubleshooting, you MUST call search_knowledge first and answer ONLY from what it returns. If it returns "NO_MATCH" or nothing relevant, do not guess — say it isn't documented and offer to open a ticket.

Tickets: open a ticket with create_ticket when the issue needs human follow-up, when it is a P1 (auth failing for all users, or a security issue), or when the customer asks for a human. Set priority and team from policy: P1 / Identity Engineering for auth outages affecting all users or SSO/SAML/SCIM failures affecting many users; P1 / Security for suspected breach or data exposure; P3 / Support for single-user or how-to. Always include a summary: a 1-2 sentence brief for the human who picks it up — what was reported, what you found, and the recommended next step. Give the customer their ticket number.

Checking a ticket: if the customer gives a ticket number, use lookup_ticket. Only handle Gatewise support; never invent features, prices, or steps.`;

const CHAT_TOOLS = [
  {
    type: "function",
    function: {
      name: "search_knowledge",
      description: "Search the Gatewise knowledge base for answers about features, plans, setup, and troubleshooting. Call this before answering any question about how Gatewise works.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "The question as a concise search query." } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_ticket",
      description: "Open a support ticket when the issue needs human follow-up, is a P1, or the customer asks for a human.",
      parameters: {
        type: "object",
        properties: {
          subject: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["P1", "P2", "P3", "P4"] },
          team: { type: "string", enum: ["Identity Engineering", "Security", "Support", "Billing", "Product"] },
          customer: { type: "string" },
          summary: { type: "string", description: "1-2 sentence handoff brief for the human agent." },
        },
        required: ["subject", "description", "priority", "team"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "lookup_ticket",
      description: "Look up the status of an existing ticket by its number.",
      parameters: {
        type: "object",
        properties: { ticket_id: { type: "string" } },
        required: ["ticket_id"],
      },
    },
  },
];

async function handleChat(env, userMessages) {
  const messages = [{ role: "system", content: CHAT_SYSTEM_PROMPT }, ...userMessages];
  const toolsUsed = [];
  const sources = new Set();

  for (let round = 0; round < 5; round++) {
    const res = await fetch(GATEWAY_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages,
        tools: CHAT_TOOLS,
        temperature: 0,
      }),
    });

    const data = await res.json();
    const msg = data?.choices?.[0]?.message;
    if (!msg) {
      return { reply: "Sorry, something went wrong on my end.", toolsUsed, sources: [...sources] };
    }
    messages.push(msg);

    if (msg.tool_calls && msg.tool_calls.length) {
      for (const tc of msg.tool_calls) {
        const name = (tc.function?.name || "").replace(/_JP$/, "");
        let args = {};
        try { args = JSON.parse(tc.function?.arguments || "{}"); } catch {}
        toolsUsed.push({ name, args });

        let result;
        if (name === "search_knowledge") {
          result = await searchKnowledge(env, args.query);
          [...result.matchAll(/\[source:\s*([^\]]+)\]/g)].forEach((m) =>
            sources.add(m[1].replace(/^files-saas\//, "").trim())
          );
        } else if (name === "create_ticket") {
          result = await createTicket(env, args);
        } else if (name === "lookup_ticket") {
          result = await lookupTicket(env, args.ticket_id);
        } else {
          result = `Unknown tool: ${name}`;
        }

        messages.push({ role: "tool", tool_call_id: tc.id, content: String(result) });
      }
      continue; // send tool results back to the model
    }

    return { reply: msg.content || "", toolsUsed, sources: [...sources] };
  }

  return { reply: "Sorry, I couldn't complete that — please try rephrasing.", toolsUsed, sources: [...sources] };
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(obj) {
  return new Response(JSON.stringify(obj), {
    status: 200,
    headers: { "content-type": "application/json", ...cors() },
  });
}
