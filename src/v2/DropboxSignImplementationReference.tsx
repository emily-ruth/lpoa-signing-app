import { useState } from 'react';
import {
  DROPBOX_SIGN_API_BASE,
  LPOA_METADATA_PURPOSE,
  LPOA_SIGNER_ROLE,
  LPOA_TEMPLATE_MERGE_FIELDS,
  WEBHOOK_RESPONSE_BODY,
} from './dropboxSignGuide';

const GOLD = '#c4a882';
const MUTED = '#8e8e93';
const BORDER = '#3a3a3c';

const WEBHOOK_ROWS: ReadonlyArray<{ event: string; action: string }> = [
  { event: 'signature_request_signed', action: 'Set LPOA_ACTIVE; record time; unblock LPOA_REQUIRED tasks.' },
  { event: 'signature_request_all_signed', action: 'Final PDF ready; GET …/files/{id}?file_type=pdf; store + audit trail.' },
  { event: 'signature_request_declined', action: 'Keep LPOA_NOT_SIGNED; log.' },
  { event: 'signature_request_canceled', action: 'Cancellation completed.' },
  { event: 'signature_request_invalid', action: 'Log; alert ops.' },
  { event: 'signature_request_email_bounce', action: 'Log.' },
  { event: 'sign_url_invalid', action: 'Embedded URL expired or invalid.' },
];

/**
 * Collapsible engineering reference from the Dropbox Sign API implementation guide.
 */
export function DropboxSignImplementationReference() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: '12px', overflow: 'hidden', marginTop: '12px' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          padding: '12px 14px',
          background: '#2c2c2e',
          border: 'none',
          color: GOLD,
          fontSize: '12px',
          fontWeight: '600',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Implementation reference (Dropbox Sign)</span>
        <span style={{ color: MUTED }}>{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div style={{ padding: '12px 14px 14px', fontSize: '11px', lineHeight: 1.55, color: '#d1d1d6' }}>
          <p style={{ margin: '0 0 8px', color: MUTED }}>
            Standard plan (~$250/mo) minimum for <code style={{ color: GOLD }}>signature_request/create_embedded_with_template</code>. Webhook must return HTTP 200 with body{' '}
            <code style={{ color: GOLD }}>{WEBHOOK_RESPONSE_BODY}</code>.
          </p>

          <p style={{ margin: '0 0 6px', fontWeight: '600', color: '#fff' }}>Template (web UI)</p>
          <ul style={{ margin: '0 0 10px', paddingLeft: '16px' }}>
            <li>Signer role: <code style={{ color: GOLD }}>{LPOA_SIGNER_ROLE}</code></li>
            <li>
              Sender textboxes (exact labels):{' '}
              {LPOA_TEMPLATE_MERGE_FIELDS.map((f, i) => (
                <span key={f}>
                  {i > 0 ? ', ' : ''}
                  <code style={{ color: GOLD }}>{f}</code>
                </span>
              ))}
            </li>
          </ul>

          <p style={{ margin: '0 0 6px', fontWeight: '600', color: '#fff' }}>Backend flow</p>
          <ol style={{ margin: '0 0 10px', paddingLeft: '16px' }}>
            <li>
              <code style={{ color: GOLD }}>POST {DROPBOX_SIGN_API_BASE}/signature_request/create_embedded_with_template</code> — include <code style={{ color: GOLD }}>test_mode: true</code> in non-prod; metadata e.g.{' '}
              <code style={{ color: GOLD }}>{`{"member_id":"…","purpose":"${LPOA_METADATA_PURPOSE}"}`}</code>
            </li>
            <li>
              <code style={{ color: GOLD }}>GET {DROPBOX_SIGN_API_BASE}/embedded/sign_url/&#123;signature_id&#125;</code> — generate just-in-time; valid ~60 minutes; expires when loaded.
            </li>
            <li>Return <code style={{ color: GOLD }}>sign_url</code> + <code style={{ color: GOLD }}>client_id</code> to the app; persist <code style={{ color: GOLD }}>PENDING_SIGNATURE</code> + ids.</li>
          </ol>

          <p style={{ margin: '0 0 6px', fontWeight: '600', color: '#fff' }}>Webhook events</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ color: MUTED, textAlign: 'left' }}>
                  <th style={{ padding: '4px 6px 4px 0', borderBottom: `1px solid ${BORDER}` }}>Event</th>
                  <th style={{ padding: '4px 0', borderBottom: `1px solid ${BORDER}` }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {WEBHOOK_ROWS.map((row) => (
                  <tr key={row.event}>
                    <td style={{ padding: '6px 6px 6px 0', verticalAlign: 'top', color: GOLD, fontFamily: 'monospace' }}>{row.event}</td>
                    <td style={{ padding: '6px 0', verticalAlign: 'top' }}>{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ margin: '10px 0 0', color: MUTED }}>
            Verify webhooks: HMAC event hash, <code style={{ color: GOLD }}>Content-Sha256</code> header, optional IP allowlist. Mobile: open <code style={{ color: GOLD }}>sign_url</code> in WebView.
          </p>
        </div>
      )}
    </div>
  );
}
