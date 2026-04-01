import { useState } from 'react';
import { LPOAScreen } from './components/LPOAScreen';
import { SignatureCanvas } from './components/SignatureCanvas';
import type { SignatureData } from './components/SignatureCanvas';
import './index.css';

type Screen = 'document' | 'signature' | 'rescind-confirm' | 'rescinded';

const GOLD = '#c4a882';
const MUTED = '#8e8e93';
const SURFACE = '#1c1c1e';

function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: '390px',
        height: '844px',
        backgroundColor: SURFACE,
        borderRadius: '55px',
        boxShadow: '0 0 0 12px #2c2c2e, 0 0 0 13px #3a3a3c, 0 30px 80px rgba(0,0,0,0.8)',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Status bar */}
      <div style={{ height: '50px', backgroundColor: SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', flexShrink: 0 }}>
        <span style={{ color: '#fff', fontSize: '15px', fontWeight: '600' }}>9:41</span>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <svg width="17" height="12" viewBox="0 0 17 12" fill="white">
            <rect x="0" y="6" width="3" height="6" rx="1" />
            <rect x="4.5" y="4" width="3" height="8" rx="1" />
            <rect x="9" y="2" width="3" height="10" rx="1" />
            <rect x="13.5" y="0" width="3" height="12" rx="1" opacity="0.3" />
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
            <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />
            <path d="M8 5.5C10.2 5.5 12.2 6.4 13.6 7.9L15 6.5C13.2 4.6 10.7 3.5 8 3.5S2.8 4.6 1 6.5l1.4 1.4C3.8 6.4 5.8 5.5 8 5.5z" opacity="0.7" />
          </svg>
          <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
            <rect x="0.5" y="1.5" width="20" height="9" rx="2.5" stroke="white" strokeOpacity="0.35" />
            <rect x="21" y="4" width="2" height="4" rx="1" fill="white" fillOpacity="0.4" />
            <rect x="2" y="3" width="16" height="6" rx="1.5" fill="white" />
          </svg>
        </div>
      </div>

      {/* Dynamic Island */}
      <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', width: '126px', height: '37px', backgroundColor: '#000', borderRadius: '20px', zIndex: 10 }} />

      {/* Screen */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>

      {/* Home indicator */}
      <div style={{ height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE, flexShrink: 0 }}>
        <div style={{ width: '134px', height: '5px', backgroundColor: '#fff', borderRadius: '3px', opacity: 0.3 }} />
      </div>
    </div>
  );
}

function RescindConfirmScreen({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ backgroundColor: SURFACE, color: '#fff' }} className="flex flex-col h-full w-full">
      <div className="flex items-center px-6 pt-6 pb-3">
        <button onClick={onCancel} style={{ color: GOLD, fontSize: '14px', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
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
          onClick={onConfirm}
          style={{ width: '100%', padding: '16px', borderRadius: '12px', fontWeight: '600', fontSize: '16px', border: 'none', cursor: 'pointer', backgroundColor: '#ff453a', color: '#fff' }}
        >
          Yes, Rescind
        </button>
        <button
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
        onClick={onRestart}
        style={{ width: '100%', padding: '16px', borderRadius: '12px', fontWeight: '600', fontSize: '16px', border: 'none', cursor: 'pointer', backgroundColor: '#2c2c2e', color: '#fff' }}
      >
        Done
      </button>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('document');
  const [sigData, setSigData] = useState<SignatureData | null>(null);

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', padding: '20px' }}>
      <PhoneShell>
        {(screen === 'document') && (
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
    </div>
  );
}
