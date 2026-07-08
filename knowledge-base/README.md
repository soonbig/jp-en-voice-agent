# Gatewise knowledge base — demo RAG corpus

Fictional product documentation for a B2B SaaS support-agent demo. **Gatewise** is an
invented Zero Trust access & identity platform (SSO, SCIM, device posture, access policies).
All content here is fictional and exists only to populate the demo's Vectorize index.

## Files
1. `gatewise_plans_and_features.md` — pricing tiers and which features (SSO, SCIM, etc.) are in each.
2. `gatewise_sso_saml_setup.md` — SAML SSO setup **and** the troubleshooting section for "logins broke after a SAML change." This is the scenario-critical doc.
3. `gatewise_scim_provisioning.md` — SCIM provisioning setup and sync troubleshooting.
4. `gatewise_security_compliance.md` — Zero Trust posture, certifications, data residency.
5. `gatewise_support_escalation_policy.md` — severity levels, SLAs, and when to escalate to the Identity Engineering team.

## How these map to the three demo intents
- **Intent 1 — product/plan question** ("does Pro include SSO?"): grounded by `gatewise_plans_and_features.md`. SSO (SAML 2.0) and SCIM are stated as Pro + Enterprise.
- **Intent 2 — technical problem** ("changed SAML config, everyone is locked out"): grounded by the troubleshooting section in `gatewise_sso_saml_setup.md`, which names the likely causes and resolution steps.
- **Intent 3 — escalation + ticket**: `gatewise_support_escalation_policy.md` defines P1 = auth outage affecting all users → route to Identity Engineering, target response 1 hour. This is what justifies the agent opening a High-priority ticket.

## Ingestion tips
- These are plain Markdown with clear `##` headings; chunk on headings (or ~500–800 tokens) so each retrievable chunk stays self-contained.
- Keep the source filename/title in each chunk's metadata so the agent can surface a citation ("from: SSO setup guide").
- Deliberate gap for the friction beat: nothing here covers IdP-side licensing errors, so a question about that should make the agent refuse-and-escalate rather than hallucinate — a clean moment to show grounding discipline.
