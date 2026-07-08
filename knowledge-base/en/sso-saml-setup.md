# Configuring SAML single sign-on (SSO) in Gatewise

This guide is for IT administrators. SAML 2.0 SSO is available on the **Pro and
Enterprise** plans. It lets your users sign in to Gatewise through your existing
identity provider (IdP) such as Okta, Microsoft Entra ID, Ping Identity, or Google
Workspace.

## Prerequisites
- A Gatewise Pro or Enterprise plan.
- The Gatewise Administrator role.
- Admin access to your identity provider.

## Setup steps
1. In the Gatewise Admin console, go to **Settings → Authentication → Single sign-on** and enable SAML.
2. Copy the Gatewise service-provider (SP) details shown on that page:
   - **ACS (Assertion Consumer Service) URL**
   - **SP Entity ID**
3. In your identity provider, create a new SAML application and paste in the ACS URL and SP Entity ID.
4. Provide the IdP details back to Gatewise, either by uploading the **IdP metadata XML** or by entering the **IdP SSO URL** and the **IdP signing certificate (X.509)** manually.
5. Map the **NameID** to the user's email address, and map attributes for first name, last name, and groups.
6. Test the connection with a single administrator account **before** enabling SSO for the whole organization.
7. Optionally turn on **Enforce SSO** to require SAML sign-in for all members.

## Key configuration fields
- **ACS URL** and **SP Entity ID** — must match exactly between Gatewise and the IdP, including trailing slashes.
- **IdP signing certificate (X.509)** — Gatewise uses this to validate the signature on every SAML assertion. If the certificate in Gatewise does not match the one the IdP is currently signing with, validation fails.
- **NameID format** — emailAddress is recommended.
- **Clock skew tolerance** — assertions older than 120 seconds are rejected.

## Troubleshooting

### Symptom: all users are locked out after changing SAML settings
This is the most common serious SSO issue. It typically appears right after an admin
edits the SAML configuration — for example after rotating the IdP signing certificate,
changing the Entity ID or ACS URL, or re-uploading metadata. Users see an error such as
"SAML assertion could not be validated" or "invalid signature," and no one can sign in.

Common causes:
- **Signing certificate mismatch.** The IdP's signing certificate was rotated, but the new certificate was not uploaded to Gatewise, so signature validation fails for every assertion.
- **Entity ID or ACS URL mismatch.** A small edit (such as an added or removed trailing slash) makes the IdP and Gatewise disagree.
- **Expired assertion / clock skew.** The IdP and Gatewise clocks differ by more than the 120-second tolerance.
- **SSO enforced while the config is broken.** With Enforce SSO on and no working SAML path, there is no fallback login.

Resolution steps:
1. Sign in with the **break-glass administrator** at `/admin/recovery`. This is a local admin account that bypasses SSO. Every organization should keep at least one break-glass admin for exactly this situation.
2. Compare the IdP signing certificate fingerprint with the one stored in Gatewise. If they differ, re-upload the current IdP metadata or paste the new certificate.
3. Verify that the ACS URL and SP Entity ID match the IdP exactly.
4. Check for clock skew between the IdP and Gatewise.
5. Re-test sign-in with one administrator before re-enabling Enforce SSO.

**When to escalate:** if no break-glass admin is available, or the certificate and
metadata appear correct but assertions still fail validation, open a P1 ticket to the
Identity Engineering team. An authentication outage affecting all users is treated as
a P1 incident (see the support and escalation policy).

### Other common SAML errors
- **"AuthnRequest rejected by IdP"** — the Gatewise application is not assigned to that user in the IdP.
- **"NameID missing in assertion"** — the NameID attribute mapping is misconfigured in the IdP.
- **"Multiple users matched"** — two Gatewise accounts share the same email; resolve the duplicate.
