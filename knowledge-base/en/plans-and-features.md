# Gatewise plans and features

Gatewise is a Zero Trust access and identity platform. It provides single sign-on,
automated user provisioning, device posture checks, and granular access policies for
the workforce. Gatewise is offered in three plans: Starter, Pro, and Enterprise.

## Starter (free)
- Up to 50 users.
- Email/password and Google sign-in.
- Basic access policies (allow/block by group).
- Multi-factor authentication (TOTP).
- 7-day audit log retention.
- Community support only.

## Pro
- Billed per user, per month. Up to 2,000 users.
- Everything in Starter, plus:
  - **SAML 2.0 single sign-on (SSO)** with any standards-compliant identity provider (Okta, Microsoft Entra ID, Ping, Google Workspace).
  - **SCIM 2.0 user provisioning and deprovisioning.**
  - Device posture checks (OS version, disk encryption, screen lock).
  - 90-day audit log retention.
  - Standard support (email and chat, business hours).

## Enterprise
- Custom pricing. Unlimited users.
- Everything in Pro, plus:
  - SCIM with custom attribute mappings and group-to-role rules.
  - Advanced, conditional access policies (location, network, risk signals).
  - SSO enforcement (require SAML for all members, with break-glass admin).
  - SIEM log export and 1-year audit retention.
  - Data residency options (US or EU).
  - 99.9% uptime SLA, 24/7 priority support, and a named customer success manager.

## Feature availability summary
- SAML 2.0 SSO: available on **Pro and Enterprise** (not on Starter).
- SCIM provisioning: available on **Pro and Enterprise** (not on Starter).
- Device posture: Pro and Enterprise.
- Multi-factor authentication: all plans.
- Audit log retention: 7 days (Starter), 90 days (Pro), 1 year with export (Enterprise).
- Data residency selection: Enterprise only.

## Common limits
- API rate limit: 100 requests/minute (Pro), 600 requests/minute (Enterprise).
- SCIM sync interval: near-real-time on user changes; full reconciliation every 4 hours.
- Maximum SAML assertion clock skew tolerance: 120 seconds.
