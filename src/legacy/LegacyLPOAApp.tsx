import { useState } from 'react';
import { PhoneShell } from '../components/PhoneShell';
import { LPOAScreen } from '../components/LPOAScreen';
import { SignatureCanvas } from '../components/SignatureCanvas';
import type { SignatureData } from '../components/SignatureCanvas';

type Screen = 'document' | 'signature' | 'rescind-confirm' | 'rescinded';

const GOLD = '#c4a882';
const MUTED = '#8e8e93';
const SURFACE = '#1c1c1e';

function RescindConfirmScreen({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ backgroundColor: SURFACE, color: '#fff' }} className="flex flex-col h-full w-full">
      <div className="flex items-center px-6 pt-6 pb-3">
        <button type="button" onClick={onCancel} style={{ color: GOLD, fontSize: '14px', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          ← Cancel
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5">
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: 'rgba(255,69,58,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 10v7M16 21v1" stroke="#ff453a" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M13.3 5.5L3.1 22.5A3.1 3.1 0 005.8 27h20.4a3.1 3.1 0 002.7-4.5L18.7 5.5a3.1 3.1 0 00-5.4 0z" stroke="#ff453a" strokeWidth="2" />
          </svg>
        </div>

        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '10px' }}>Rescind Authorization?</h2>
          <p style={{ color: MUTED, fontSize: '14px', lineHeight: '1.6' }}>
            This will immediately revoke BlackCloak's power of attorney to act on your behalf. This action cannot be undone without re-signing.
          </p>
        </div>
      </div>

      <div className="px-6 pb-10 pt-3 flex flex-col gap-3" style={{ flexShrink: 0 }}>
        <button
          type="button"
          onClick={onConfirm}
          style={{ width: '100%', padding: '16px', borderRadius: '12px', fontWeight: '600', fontSize: '16px', border: 'none', cursor: 'pointer', backgroundColor: '#ff453a', color: '#fff' }}
        >
          Yes, Rescind
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ width: '100%', padding: '16px', borderRadius: '12px', fontWeight: '600', fontSize: '16px', border: 'none', cursor: 'pointer', backgroundColor: '#2c2c2e', color: '#fff' }}
        >
          Keep Authorization
        </button>
      </div>
    </div>
  );
}

function RescindedScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div style={{ backgroundColor: SURFACE, color: '#fff' }} className="flex flex-col h-full w-full items-center justify-center px-8 text-center gap-6">
      <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(255,69,58,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M11 11L25 25M25 11L11 25" stroke="#ff453a" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      <div>
        <p style={{ color: '#ff453a', fontSize: '11px', letterSpacing: '0.1em' }} className="uppercase font-semibold mb-2">
          Authorization Rescinded
        </p>
        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '10px' }}>Power of Attorney Revoked</h2>
        <p style={{ color: MUTED, fontSize: '14px', lineHeight: '1.6' }}>
          Your Limited Revocable Power of Attorney has been rescinded. BlackCloak, Inc. no longer has authority to act on your behalf.
        </p>
      </div>

      <button
        type="button"
        onClick={onRestart}
        style={{ width: '100%', padding: '16px', borderRadius: '12px', fontWeight: '600', fontSize: '16px', border: 'none', cursor: 'pointer', backgroundColor: '#2c2c2e', color: '#fff' }}
      >
        Done
      </button>
    </div>
  );
}

/** Original in-app canvas + PDF prototype (pre–Dropbox Sign PRD). */
export function LegacyLPOAApp() {
  const [screen, setScreen] = useState<Screen>('document');
  const [sigData, setSigData] = useState<SignatureData | null>(null);

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', padding: '20px', gap: '14px' }}>
      <PhoneShell>
        {screen === 'document' && (
          <LPOAScreen
            sigData={sigData ?? undefined}
            onSign={() => setScreen('signature')}
            onRescind={() => setScreen('rescind-confirm')}
          />
        )}
        {screen === 'signature' && (
          <SignatureCanvas
            onBack={() => setScreen('document')}
            onSubmit={(data) => { setSigData(data); setScreen('document'); }}
          />
        )}
        {screen === 'rescind-confirm' && (
          <RescindConfirmScreen
            onConfirm={() => setScreen('rescinded')}
            onCancel={() => setScreen('document')}
          />
        )}
        {screen === 'rescinded' && (
          <RescindedScreen onRestart={() => { setSigData(null); setScreen('document'); }} />
        )}
      </PhoneShell>
      <a href="?v=2" style={{ color: '#8e8e93', fontSize: '12px', textDecoration: 'none' }}>
        Open Privacy Authorization demo (PRD v2)
      </a>
    </div>
  );
}
