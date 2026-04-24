import { LegacyLPOAApp } from './legacy/LegacyLPOAApp';
import { PrivacyAuthorizationApp } from './v2/PrivacyAuthorizationApp';
import './index.css';

function readIsV2(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return new URLSearchParams(window.location.search).get('v') === '2';
}

export default function App() {
  const isV2 = readIsV2();

  if (isV2) {
    return (
      <div style={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', padding: '20px' }}>
        <PrivacyAuthorizationApp />
      </div>
    );
  }

  return <LegacyLPOAApp />;
}
