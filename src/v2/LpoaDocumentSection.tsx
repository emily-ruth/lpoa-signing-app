import { LPOA_DOCUMENT_BLOCKS, LPOA_DOCUMENT_VERSION_LABEL } from './lpoa-document-content';

const GOLD = '#c4a882';
const MUTED = '#8e8e93';
const BORDER = '#3a3a3c';

/**
 * Renders the Legal LPOA body (same substance as the Dropbox Sign template).
 */
export function LpoaDocumentSection() {
  return (
    <section>
      <p style={{ color: GOLD, letterSpacing: '0.06em', fontSize: '10px' }} className="uppercase font-semibold mb-2">
        {LPOA_DOCUMENT_VERSION_LABEL}
      </p>
      <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#fff', marginBottom: '14px', lineHeight: 1.25 }}>
        Limited Revocable Power of Attorney
      </h2>

      <div style={{ fontSize: '13.5px', lineHeight: 1.7, color: '#e5e5e7' }}>
        {LPOA_DOCUMENT_BLOCKS.map((block, index) => {
          if (block.kind === 'paragraph') {
            return (
              <p key={index} className="mb-4">
                {block.text}
              </p>
            );
          }
          return (
            <p key={index} className="mb-4">
              <span style={{ color: '#fff', fontWeight: '600' }}>{block.label}</span>
              {' '}
              {block.text}
            </p>
          );
        })}
      </div>

      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '16px', marginTop: '8px' }}>
        <p style={{ color: MUTED, fontSize: '11px', lineHeight: 1.55, marginBottom: '8px' }}>
          Signature, printed name, current city and state, and effective date are completed when you sign electronically (Dropbox Sign template merge fields:{' '}
          <code style={{ color: GOLD }}>member_name</code>, <code style={{ color: GOLD }}>member_city_state</code>, <code style={{ color: GOLD }}>effective_date</code>).
        </p>
      </div>
    </section>
  );
}
