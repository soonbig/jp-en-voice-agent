# Gatewise support and escalation policy

This policy defines how support requests are prioritized, who handles them, and the
response targets by plan. The support agent uses it to set ticket priority and to
decide when to escalate to a specialist team.

## Support channels and hours
- Starter: community forum only.
- Pro: email and chat, business hours (Monday–Friday, local business hours).
- Enterprise: 24/7 priority support, plus a named customer success manager.

## Severity levels
Every ticket is assigned a severity that drives its priority and response target.

- **P1 — Critical / High.** A production outage or security issue. Examples: authentication is failing for **all users** (an SSO/SAML outage), suspected data exposure, or total loss of access. Target first response: 1 hour (Enterprise), 4 hours (Pro). P1 auth incidents are routed to the **Identity Engineering** on-call team.
- **P2 — High.** Major functionality degraded for **some** users or one group. Target first response: 4 hours (Enterprise), 1 business day (Pro).
- **P3 — Normal.** A single user is affected, or a how-to / configuration question. Target first response: 1 business day.
- **P4 — Low.** Feature requests and general feedback. No response target.

## Escalation routing
- **Identity Engineering team:** SSO/SAML, SCIM, and authentication failures affecting multiple users, or any auth outage. This is the team that handles broken SAML configurations and signature-validation failures.
- **Security team:** suspected breach, account compromise, or data exposure (always P1).
- **Billing team:** invoicing, plan changes, and entitlement questions.
- **Product team:** confirmed bugs and feature requests (P3–P4).

## Ticketing
- Every support request creates a ticket with a unique ID (for example, #4127) that the customer can use to track status.
- Customer-facing fields: ticket ID, subject, status, and any public replies.
- Internal-only fields: assigned team, severity/priority, internal notes, and any AI-generated summary attached for the handling agent. These are never shared with the customer.

## When the agent should escalate
- The issue is a P1 (auth outage affecting all users, or suspected security incident).
- The customer explicitly asks for a human.
- The request is outside documented knowledge, so a confident answer cannot be grounded.
In these cases the agent opens a ticket with the correct severity, routes it to the
right team, and attaches a summary for the human who picks it up.
