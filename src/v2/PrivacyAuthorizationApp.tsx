import { useCallback, useMemo, useState } from 'react';
import { PhoneShell } from '../components/PhoneShell';
import { EmbeddedSigningFlow } from './EmbeddedSigningFlow';
import type { LpoaStatus } from './lpoa-status';
import { getLpoaMemberStatus, isLpoaApiConfigured, postLpoaRevoke } from './lpoaSignApi';

const GOLD = '#c4a882';
const MUTED = '#8e8e93';
const BORDER = '#3a3a3c';
const GREEN = '#34c759';
const RED = '#ff453a';

/** Demo merge fields; production comes from member profile + Dropbox Sign template. */
const DEMO_NAME = 'Alex Member';
const DEMO_CITY_STATE = 'Denver, CO';

function formatDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function RevokeAuthorizationConfirm({
  onConfirm,
  onCancel,
  isSubmitting,
  errorMessage,
}: {
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}) {
  return (
    <div style={{ backgroundColor: '#1c1c1e', color: '#fff' }} className="flex flex-col h-full w-full">
      <div className="flex items-center px-6 pt-6 pb-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{ color: GOLD, fontSize: '14px', fontWeight: '500', background: 'none', border: 'none', cursor: isSubmitting ? 'default' : 'pointer', padding: 0, opacity: isSubmitting ? 0.5 : 1 }}
        >
          ← Cancel
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5">
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'rgba(255,69,58,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 10v7M16 21v1" stroke={RED} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M13.3 5.5L3.1 22.5A3.1 3.1 0 005.8 27h20.4a3.1 3.1 0 002.7-4.5L18.7 5.5a3.1 3.1 0 00-5.4 0z" stroke={RED} strokeWidth="2" />
          </svg>
        </div>

        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '10px' }}>Revoke Authorization?</h2>
          <p style={{ color: MUTED, fontSize: '14px', lineHeight: 1.6 }}>
            Identity-matched broker removals will pause until you sign again. Operations views will suppress your real email and phone for these tasks.
          </p>
          <p style={{ color: MUTED, fontSize: '13px', lineHeight: 1.55, marginTop: '12px' }}>
            Revocation is recorded in BlackCloak only (POST <code style={{ color: GOLD }}>/api/lpoa/revoke</code>)—there is no Dropbox Sign API call. The signed PDF remains a legal artifact; you are withdrawing ongoing consent (implementation guide §2D).
          </p>
          {errorMessage ? (
            <p style={{ color: '#ff9f0a', fontSize: '12px', marginTop: '12px', textAlign: 'center' }}>{errorMessage}</p>
          ) : null}
        </div>
      </div>

      <div className="px-6 pb-10 pt-3 flex flex-col gap-3" style={{ flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => void onConfirm()}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '16px',
            border: 'none',
            cursor: isSubmitting ? 'wait' : 'pointer',
            backgroundColor: RED,
            color: '#fff',
            opacity: isSubmitting ? 0.85 : 1,
          }}
        >
          {isSubmitting ? 'Revoking…' : 'Revoke Authorization'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '16px',
            border: 'none',
            cursor: isSubmitting ? 'default' : 'pointer',
            backgroundColor: '#2c2c2e',
            color: '#fff',
            opacity: isSubmitting ? 0.5 : 1,
          }}
        >
          Keep Authorization
        </button>
      </div>
    </div>
  );
}

function InformedConsentSection() {
  return (
    <section style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '16px', marginTop: '4px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>What you are authorizing</h2>
      <ul style={{ margin: '0 0 14px 0', paddingLeft: '18px', color: '#e5e5e7', fontSize: '13px', lineHeight: 1.65 }}>
        <li className="mb-2">
          BlackCloak may act as your agent to exercise data rights and request removal of your personal information from third-party data brokers, including use of email addresses and phone numbers you provide so brokers can match your record.
        </li>
        <li className="mb-2">
          Some broker networks only accept requests when you prove control of a contact already in their database; this authorization unlocks those removals.
        </li>
      </ul>

      <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>What this does not include</h2>
      <p style={{ color: '#e5e5e7', fontSize: '13px', lineHeight: 1.65, marginBottom: '14px' }}>
        It does not grant authority over your property, finances, medical or healthcare decisions, or general business affairs—only the limited data-broker removal powers in the LPOA text maintained by Legal.
      </p>

      <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>Brokers that require this authorization</h2>
      <p style={{ color: '#e5e5e7', fontSize: '13px', lineHeight: 1.65, marginBottom: '14px' }}>
        PeopleConnect / Intelius network, RocketReach, and Apollo (identity-matched sites that reject facade-email opt-outs per PRD).
      </p>

      <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '10px' }}>Duration and revocation</h2>
      <p style={{ color: '#e5e5e7', fontSize: '13px', lineHeight: 1.65, marginBottom: '8px' }}>
        The authorization stays in effect until your membership contract ends or you revoke it. You may revoke at any time, for any reason, from this page.
      </p>
      <p style={{ color: MUTED, fontSize: '11px', lineHeight: 1.5, marginBottom: '8px' }}>
        Dropbox Sign retains an audit trail (timestamp, IP, signature hash) in the signed document per policy (implementation guide §1E / EULA).
      </p>
      <p style={{ color: MUTED, fontSize: '11px', lineHeight: 1.5 }}>
        Final copy requires Legal sign-off (PRD).
      </p>
    </section>
  );
}

type InnerScreen = 'privacy' | 'signing' | 'revoke-confirm';

/**
 * PRD Privacy Authorization + Dropbox Sign embedded flow (PM implementation guide).
 */
export function PrivacyAuthorizationApp() {
  const [status, setStatus] = useState<LpoaStatus>('LPOA_NOT_SIGNED');
  const [signedAtIso, setSignedAtIso] = useState<string | undefined>(undefined);
  const [revokedAtIso, setRevokedAtIso] = useState<string | undefined>(undefined);
  const [inner, setInner] = useState<InnerScreen>('privacy');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const effectiveDateLabel = useMemo(() => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), []);

  const refreshFromBackend = useCallback(async (): Promise<void> => {
    if (!isLpoaApiConfigured()) {
      return;
    }
    setIsRefreshing(true);
    setActionError(null);
    try {
      const s = await getLpoaMemberStatus();
      setStatus(s.status);
      if (s.signed_at) {
        setSignedAtIso(s.signed_at);
      }
      if (s.revoked_at) {
        setRevokedAtIso(s.revoked_at);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Refresh failed';
      setActionError(message);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  if (inner === 'signing') {
    return (
      <PhoneShell>
        <EmbeddedSigningFlow
          memberDisplayName={DEMO_NAME}
          cityState={DEMO_CITY_STATE}
          effectiveDateLabel={effectiveDateLabel}
          onCancel={() => setInner('privacy')}
          onComplete={() => {
            const now = new Date().toISOString();
            setSignedAtIso(now);
            setStatus('LPOA_ACTIVE');
            setInner('privacy');
            void refreshFromBackend();
          }}
          onRefreshStatusRequest={() => {
            void refreshFromBackend();
          }}
        />
      </PhoneShell>
    );
  }

  if (inner === 'revoke-confirm') {
    return (
      <PhoneShell>
        <RevokeAuthorizationConfirm
          errorMessage={revokeError}
          isSubmitting={isRevoking}
          onCancel={() => { setInner('privacy'); setActionError(null); setRevokeError(null); }}
          onConfirm={async () => {
            setIsRevoking(true);
            setRevokeError(null);
            try {
              if (isLpoaApiConfigured()) {
                await postLpoaRevoke();
              }
              setRevokedAtIso(new Date().toISOString());
              setStatus('LPOA_REVOKED');
              setInner('privacy');
            } catch (err) {
              const message = err instanceof Error ? err.message : 'Revoke failed';
              setRevokeError(message);
            } finally {
              setIsRevoking(false);
            }
          }}
        />
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <div style={{ backgroundColor: '#1c1c1e', color: '#fff' }} className="flex flex-col h-full w-full">
        <div className="px-6 pt-8 pb-4">
          {status === 'LPOA_ACTIVE' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: GREEN }} />
              <span style={{ color: GREEN, fontSize: '12px', fontWeight: '600' }}>Active</span>
            </div>
          )}
          {status === 'LPOA_NOT_SIGNED' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: MUTED }} />
              <span style={{ color: MUTED, fontSize: '12px', fontWeight: '600' }}>Not Signed</span>
            </div>
          )}
          {status === 'LPOA_REVOKED' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: RED }} />
              <span style={{ color: RED, fontSize: '12px', fontWeight: '600' }}>Revoked</span>
            </div>
          )}

          <p style={{ color: GOLD, letterSpacing: '0.1em', fontSize: '11px' }} className="uppercase font-semibold mb-2">
            Privacy
          </p>
          <h1 style={{ fontSize: '24px', lineHeight: 1.2, fontWeight: '700' }}>Privacy Authorization</h1>
          <p style={{ color: MUTED, fontSize: '13px', lineHeight: 1.55, marginTop: '10px' }}>
            Limited Power of Attorney for data broker removal. Review the summary below, then sign with Dropbox Sign embedded in the app (implementation guide §2A–2B).
          </p>
          {status === 'LPOA_ACTIVE' && signedAtIso && (
            <p style={{ color: '#e5e5e7', fontSize: '13px', marginTop: '12px' }}>
              Signed on <strong style={{ color: '#fff' }}>{formatDisplayDate(signedAtIso)}</strong>
            </p>
          )}
          {status === 'LPOA_REVOKED' && revokedAtIso && (
            <p style={{ color: MUTED, fontSize: '12px', marginTop: '10px' }}>
              Revoked {formatDisplayDate(revokedAtIso)} — revocation timestamp logged.
            </p>
          )}
          {actionError && (
            <p style={{ color: '#ff9f0a', fontSize: '12px', marginTop: '10px' }}>{actionError}</p>
          )}
        </div>

        <div style={{ backgroundColor: BORDER, height: '1px' }} className="mx-6" />

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <InformedConsentSection />
        </div>

        <div className="px-6 pb-10 pt-3 flex flex-col gap-3" style={{ flexShrink: 0 }}>
          {status === 'LPOA_NOT_SIGNED' || status === 'LPOA_REVOKED' ? (
            <button
              type="button"
              onClick={() => { setActionError(null); setInner('signing'); }}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: GOLD,
                color: '#1c1c1e',
              }}
            >
              {status === 'LPOA_REVOKED' ? 'Re-Sign Authorization' : 'Sign Authorization'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setActionError(null); setRevokeError(null); setInner('revoke-confirm'); }}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '15px',
                border: `1.5px solid ${RED}`,
                cursor: 'pointer',
                backgroundColor: 'transparent',
                color: RED,
              }}
            >
              Revoke Authorization
            </button>
          )}

          <button
            type="button"
            onClick={() => void refreshFromBackend()}
            disabled={!isLpoaApiConfigured() || isRefreshing}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '14px',
              border: `1px solid ${BORDER}`,
              cursor: !isLpoaApiConfigured() || isRefreshing ? 'default' : 'pointer',
              backgroundColor: 'transparent',
              color: !isLpoaApiConfigured() ? '#48484a' : MUTED,
            }}
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh status'}
          </button>
          {!isLpoaApiConfigured() ? (
            <p style={{ color: '#48484a', fontSize: '11px', textAlign: 'center', margin: 0 }}>
              Refresh calls GET /api/lpoa/status when VITE_LPOA_API_BASE_URL is set (implementation guide).
            </p>
          ) : null}

          <a
            href="?v=1"
            style={{ color: MUTED, fontSize: '12px', textAlign: 'center', textDecoration: 'none' }}
          >
            Open legacy canvas demo (v1)
          </a>
        </div>
      </div>
    </PhoneShell>
  );
}
