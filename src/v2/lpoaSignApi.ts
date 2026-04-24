/**
 * Client helpers for LPOA embedded signing (Dropbox Sign / HelloSign API).
 * Paths follow the internal API names from the PM implementation guide.
 */

export interface LpoaEmbeddedSignResponse {
  sign_url: string;
  client_id: string;
}

export interface LpoaMemberStatusResponse {
  status: 'LPOA_NOT_SIGNED' | 'LPOA_ACTIVE' | 'LPOA_REVOKED';
  signed_at?: string;
  revoked_at?: string;
}

function getApiBase(): string | undefined {
  const raw = import.meta.env.VITE_LPOA_API_BASE_URL?.trim();
  if (!raw) {
    return undefined;
  }
  return raw.replace(/\/$/, '');
}

export function isLpoaApiConfigured(): boolean {
  return Boolean(getApiBase());
}

/**
 * POST /api/lpoa/sign — creates embedded signature request and returns `sign_url` + `client_id`.
 */
export async function postLpoaEmbeddedSignSession(): Promise<LpoaEmbeddedSignResponse> {
  const base = getApiBase();
  if (!base) {
    throw new Error('VITE_LPOA_API_BASE_URL is not set');
  }
  const res = await fetch(`${base}/api/lpoa/sign`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`lpoa/sign failed: ${res.status} ${text}`.trim());
  }
  const data = (await res.json()) as Partial<LpoaEmbeddedSignResponse>;
  if (!data.sign_url || !(data.client_id || import.meta.env.VITE_HELLOSIGN_CLIENT_ID)) {
    throw new Error('lpoa/sign response missing sign_url or client_id');
  }
  return {
    sign_url: data.sign_url,
    client_id: data.client_id ?? import.meta.env.VITE_HELLOSIGN_CLIENT_ID!,
  };
}

/**
 * POST /api/lpoa/revoke — internal revocation (no Dropbox Sign API call).
 */
export async function postLpoaRevoke(): Promise<void> {
  const base = getApiBase();
  if (!base) {
    throw new Error('VITE_LPOA_API_BASE_URL is not set');
  }
  const res = await fetch(`${base}/api/lpoa/revoke`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`lpoa/revoke failed: ${res.status} ${text}`.trim());
  }
}

/**
 * GET /api/lpoa/status — member-scoped status for "Refresh status" (optional backend; guide suggests refresh + reconciliation).
 */
export async function getLpoaMemberStatus(): Promise<LpoaMemberStatusResponse> {
  const base = getApiBase();
  if (!base) {
    throw new Error('VITE_LPOA_API_BASE_URL is not set');
  }
  const res = await fetch(`${base}/api/lpoa/status`, { method: 'GET', credentials: 'include' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`lpoa/status failed: ${res.status} ${text}`.trim());
  }
  return (await res.json()) as LpoaMemberStatusResponse;
}
