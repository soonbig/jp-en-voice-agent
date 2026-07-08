// Copy to `config.js` and fill in your own values.
// `config.js` is gitignored — only this .example file is committed.
//
// These are all PUBLIC-safe identifiers (the Vapi *public* key is meant to be
// exposed client-side). Never put the Vapi *private* key or the OpenAI key here
// — those stay server-side in the Worker.
//
// Wire it up in index.html, e.g.:
//   <script src="config.js"></script>   (before the module script)
// then read from window.GATEWISE_CONFIG.

window.GATEWISE_CONFIG = {
  // Vapi public key (Dashboard → API Keys → Public).
  VAPI_PUBLIC_KEY: "YOUR_VAPI_PUBLIC_KEY",

  // Assistant IDs (Dashboard → Assistants).
  ASSISTANT_ID_EN: "YOUR_EN_ASSISTANT_ID",
  ASSISTANT_ID_JA: "YOUR_JA_ASSISTANT_ID",

  // Deployed Worker base URL (no trailing slash).
  WORKER_URL: "https://saas-agent-tools.YOUR-SUBDOMAIN.workers.dev",

  // Demo identity shown in the console header (not sensitive — sample data).
  USER: {
    name: "Demo User",
    email: "demo@example.com",
    company: "Example Corp",
    plan: "Enterprise",
  },
};
