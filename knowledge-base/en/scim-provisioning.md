# SCIM user provisioning in Gatewise

SCIM 2.0 provisioning is available on the **Pro and Enterprise** plans. It lets your
identity provider automatically create, update, and deactivate Gatewise users so you
do not have to manage accounts by hand. When someone joins, changes teams, or leaves,
the change flows from your IdP into Gatewise automatically.

## What SCIM does in Gatewise
- **Provisioning:** new users in the IdP are created in Gatewise automatically.
- **Updates:** attribute changes (name, email, group membership) sync to Gatewise.
- **Deprovisioning:** when a user is deactivated or removed in the IdP, their Gatewise access is revoked. This is the key security benefit — offboarded employees lose access immediately.

## Setup steps
1. In the Gatewise Admin console, go to **Settings → Provisioning → SCIM** and enable it.
2. Copy the **SCIM base URL** and generate a **SCIM bearer token**. The token is shown only once.
3. In your identity provider's provisioning settings, paste the base URL and token.
4. Choose which attributes to sync. On Enterprise you can define custom attribute mappings and group-to-role rules.
5. Run a test sync with a small group before enabling for the whole directory.

## Supported attributes
- userName (maps to email), givenName, familyName, active status, and groups.
- Enterprise plans support custom mappings beyond these defaults.

## Sync behavior
- Changes sync in near-real-time when the IdP pushes them.
- A full reconciliation runs every 4 hours to catch any missed updates.

## Troubleshooting
- **Users not appearing in Gatewise:** confirm the user is assigned to the Gatewise app in the IdP and that the user is marked active. Check the SCIM logs under Settings → Provisioning → Logs.
- **"401 Unauthorized" in SCIM logs:** the bearer token expired or was rotated. Generate a new token and update it in the IdP.
- **Deprovisioning not working:** confirm the IdP is sending an `active: false` update rather than deleting the user; Gatewise deactivates on `active: false`.
- SCIM provisioning and SAML SSO are independent features. SSO can work while SCIM is misconfigured, and vice versa.
