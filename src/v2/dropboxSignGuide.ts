/** Dropbox Sign template merge fields (case-sensitive) per implementation guide. */
export const LPOA_TEMPLATE_MERGE_FIELDS = ['member_name', 'member_city_state', 'effective_date'] as const;

/** Signer role name on the LPOA template. */
export const LPOA_SIGNER_ROLE = 'Member';

/** Suggested request metadata ( echoed in webhooks ). */
export const LPOA_METADATA_PURPOSE = 'lpoa';

export const DROPBOX_SIGN_API_BASE = 'https://api.hellosign.com/v3';

export const WEBHOOK_RESPONSE_BODY = 'Hello API Event Received';
