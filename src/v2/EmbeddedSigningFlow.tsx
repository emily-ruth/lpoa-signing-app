import { useCallback, useEffect, useRef, useState } from 'react';
import HelloSign from 'hellosign-embedded';
import { DropboxSignImplementationReference } from './DropboxSignImplementationReference';
import { LPOA_TEMPLATE_MERGE_FIELDS } from './dropboxSignGuide';
import { LPOA_DOCUMENT_VERSION_LABEL } from './lpoa-document-content';
import { isLpoaApiConfigured, postLpoaEmbeddedSignSession } from './lpoaSignApi';

const GOLD = '#c4a882';
const MUTED = '#8e8e93';
const BORDER = '#3a3a3c';

interface EmbeddedSigningFlowProps {
  memberDisplayName: string;
  cityState: string;
  effectiveDateLabel: string;
  onComplete: () => void;
  onCancel: () => void;
  /** After embedded `close`, refresh authoritative status from backend (guide §2B). */
  onRefreshStatusRequest: () => void;
}

/**
 * Dropbox Sign embedded signing: live `hellosign-embedded` when API is configured, otherwise local simulation (PM implementation guide).
 */
export function EmbeddedSigningFlow({
  memberDisplayName,
  cityState,
  effectiveDateLabel,
  onComplete,
  onCancel,
  onRefreshStatusRequest,
}: EmbeddedSigningFlowProps) {
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const clientRef = useRef<HelloSign | null>(null);

  const skipDomainVerification = import.meta.env.VITE_DROPBOX_SIGN_SKIP_DOMAIN_VERIFICATION === 'true';
  const hasApi = isLpoaApiConfigured();

  const tearDownClient = useCallback(() => {
    const c = clientRef.current;
    if (!c) {
      return;
    }
    try {
      c.off('sign');
      c.off('cancel');
      c.off('close');
      c.off('error');
      c.close();
    } catch {
      /* ignore */
    }
    clientRef.current = null;
  }, []);

  useEffect(() => () => tearDownClient(), [tearDownClient]);

  const launchDropboxSignEmbedded = useCallback(async () => {
    setLiveError(null);
    setLiveLoading(true);
    tearDownClient();
    try {
      const session = await postLpoaEmbeddedSignSession();
      const client = new HelloSign({ clientId: session.client_id });
      clientRef.current = client;
      client.on('sign', () => {
        onComplete();
      });
      client.on('cancel', () => {
        onCancel();
      });
      client.on('close', () => {
        onRefreshStatusRequest();
      });
      client.on('error', (data: unknown) => {
        const code = typeof data === 'object' && data !== null && 'code' in data ? String((data as { code?: string }).code) : 'unknown';
        setLiveError(`Dropbox Sign error: ${code}`);
      });
      client.open(session.sign_url, {
        allowCancel: true,
        skipDomainVerification,
        allowViewportOverride: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      setLiveError(message);
    } finally {
      setLiveLoading(false);
    }
  }, [onCancel, onComplete, onRefreshStatusRequest, skipDomainVerification, tearDownClient]);

  return (
    <div style={{ backgroundColor: '#1c1c1e', color: '#fff' }} className="flex flex-col h-full w-full">
      <div className="flex items-center px-6 pt-6 pb-3">
        <button
          type="button"
          onClick={() => {
            tearDownClient();
            onCancel();
          }}
          style={{ color: GOLD, fontSize: '14px', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          ← Back
        </button>
      </div>

      <div className="px-6 pb-2">
        <p style={{ color: GOLD, letterSpacing: '0.08em', fontSize: '10px' }} className="uppercase font-semibold mb-1">
          Dropbox Sign · Embedded
        </p>
        <h2 style={{ fontSize: '20px', fontWeight: '700', lineHeight: 1.25 }}>Sign your Privacy Authorization</h2>
        <p style={{ color: MUTED, fontSize: '12px', lineHeight: 1.5, marginTop: '6px' }}>
          Document: Limited Revocable Power of Attorney — {LPOA_DOCUMENT_VERSION_LABEL}
        </p>
        <p style={{ color: MUTED, fontSize: '13px', lineHeight: 1.55, marginTop: '10px' }}>
          The backend creates a request with <code style={{ color: GOLD }}>create_embedded_with_template</code>, then returns a fresh <code style={{ color: GOLD }}>sign_url</code> (valid ~60 minutes; do not pre-cache).
        </p>
      </div>

      <div className="flex-1 mx-6 mb-2 min-h-0 flex flex-col rounded-xl overflow-y-auto border" style={{ borderColor: BORDER, backgroundColor: '#0d0d0e' }}>
        <div className="p-4" style={{ fontSize: '12px', lineHeight: 1.55, color: '#d1d1d6' }}>
          <p className="mb-2 text-center" style={{ color: '#fff', fontWeight: '600', fontSize: '13px' }}>
            Limited Revocable Power of Attorney — merge fields (pre-filled)
          </p>
          <p className="mb-3">
            {LPOA_TEMPLATE_MERGE_FIELDS.map((key) => (
              <span key={key} className="block" style={{ marginBottom: '6px' }}>
                <code style={{ color: GOLD }}>{key}</code>
                {' → '}
                <strong style={{ color: '#fff' }}>
                  {key === 'member_name' ? memberDisplayName : key === 'member_city_state' ? cityState : effectiveDateLabel}
                </strong>
              </span>
            ))}
          </p>
          <p className="mb-2" style={{ color: MUTED, fontSize: '11px' }}>
            Install <code style={{ color: GOLD }}>hellosign-embedded</code>; host page should use HTTPS in production. Listen for <code style={{ color: GOLD }}>sign</code> for optimistic UI; webhook confirms persistence.
          </p>
        </div>
        <div className="px-4 pb-4">
          <DropboxSignImplementationReference />
        </div>
      </div>

      {liveError && (
        <p className="px-6" style={{ color: '#ff9f0a', fontSize: '12px', marginBottom: '8px' }}>
          {liveError}
        </p>
      )}

      <div className="px-6 pb-10 pt-2 flex flex-col gap-3" style={{ flexShrink: 0 }}>
        {hasApi ? (
          <button
            type="button"
            onClick={() => void launchDropboxSignEmbedded()}
            disabled={liveLoading}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '16px',
              border: 'none',
              cursor: liveLoading ? 'wait' : 'pointer',
              backgroundColor: liveLoading ? '#3a3a3c' : GOLD,
              color: '#1c1c1e',
            }}
          >
            {liveLoading ? 'Opening…' : 'Open Dropbox Sign (embedded)'}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onComplete}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '16px',
            border: hasApi ? `1px solid ${GOLD}` : 'none',
            cursor: 'pointer',
            backgroundColor: hasApi ? 'transparent' : GOLD,
            color: hasApi ? GOLD : '#1c1c1e',
          }}
        >
          {hasApi ? 'Simulate signature completed (demo)' : 'Simulate signature completed'}
        </button>

        {!hasApi ? (
          <p style={{ color: MUTED, fontSize: '11px', textAlign: 'center', margin: 0, lineHeight: 1.45 }}>
            Set <code style={{ color: GOLD }}>VITE_LPOA_API_BASE_URL</code> in <code style={{ color: GOLD }}>.env</code> to call your <code style={{ color: GOLD }}>POST /api/lpoa/sign</code> and open the real embedded client.
          </p>
        ) : null}
      </div>
    </div>
  );
}
