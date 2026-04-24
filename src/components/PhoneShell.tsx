import type { ReactNode } from 'react';

const SURFACE = '#1c1c1e';

/**
 * Decorative device frame for mobile-first demos.
 */
export function PhoneShell({ children }: { children: ReactNode }) {
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

      <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', width: '126px', height: '37px', backgroundColor: '#000', borderRadius: '20px', zIndex: 10 }} />

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>

      <div style={{ height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: SURFACE, flexShrink: 0 }}>
        <div style={{ width: '134px', height: '5px', backgroundColor: '#fff', borderRadius: '3px', opacity: 0.3 }} />
      </div>
    </div>
  );
}
