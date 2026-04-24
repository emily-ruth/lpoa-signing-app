/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API origin (no trailing slash). Enables POST /api/lpoa/sign and related calls in v2. */
  readonly VITE_LPOA_API_BASE_URL?: string;
  /** Fallback HelloSign client ID if the sign response omits `client_id`. */
  readonly VITE_HELLOSIGN_CLIENT_ID?: string;
  /** Set to `true` for local dev: passes `skipDomainVerification` (requires test_mode requests). */
  readonly VITE_DROPBOX_SIGN_SKIP_DOMAIN_VERIFICATION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
