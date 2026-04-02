import { jsPDF } from 'jspdf';
import type { SignatureData } from './SignatureCanvas';

interface LPOAScreenProps {
  sigData?: SignatureData;
  onSign?: () => void;
  onRescind?: () => void;
}

const GOLD = '#c4a882';
const MUTED = '#8e8e93';
const BORDER = '#3a3a3c';

function downloadSignedCopy(sig: SignatureData) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const margin = 72;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - margin * 2;
  let y = margin;

  const ensureRoom = (needed: number) => {
    if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
  };

  const hRule = (shade = 170) => {
    doc.setDrawColor(shade, shade, shade);
    doc.line(margin, y, margin + contentW, y);
  };

  // ── Title (centered, bold) ───────────────────────────────────────────────
  doc.setFontSize(13);
  doc.setFont('times', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Limited Revocable Power of Attorney', pageW / 2, y, { align: 'center' });
  y += 28;

  // ── Body paragraphs ──────────────────────────────────────────────────────
  const bodySize = 11;
  const lineH = bodySize * 1.45;

  const addParagraph = (text: string, boldPrefix?: string) => {
    const lines = doc.splitTextToSize(text, contentW);
    ensureRoom(lines.length * lineH + 10);

    doc.setFontSize(bodySize);
    doc.setTextColor(0, 0, 0);

    if (boldPrefix) {
      doc.setFont('times', 'bold');
      const bw = doc.getTextWidth(boldPrefix);
      doc.text(boldPrefix, margin, y);
      doc.setFont('times', 'normal');
      const rest = doc.splitTextToSize(text.slice(boldPrefix.length), contentW - bw);
      doc.text(rest[0], margin + bw, y);
      y += lineH;
      if (rest.length > 1) {
        const wrap = doc.splitTextToSize(rest.slice(1).join(' '), contentW);
        doc.text(wrap, margin, y);
        y += wrap.length * lineH;
      }
    } else {
      doc.setFont('times', 'normal');
      doc.text(lines, margin, y);
      y += lines.length * lineH;
    }
    y += 10; // paragraph gap
  };

  addParagraph('I, the undersigned principal (the "Principal"), do hereby grant to BlackCloak, Inc., a Delaware corporation, and its employees and representatives (the "Agent"), as my agent to have the full power and authority to exercise the following powers:');
  addParagraph('To exercise data rights on my behalf and to remove my personally identifiable information from third party websites and databases and to otherwise prevent third parties from sharing my personally identifiable information with others.');
  addParagraph('This grant of authority includes all incidental acts as are reasonably necessary to carry out such powers.');
  addParagraph('Reliance.  Any third party may rely upon the existence of this instrument and may deal in good faith with the Agent as if the Agent\'s authority were in full force and effect, unless such third party has actual knowledge of its revocation, termination, or invalidity.', 'Reliance.');
  addParagraph('Limitation.  This grant of authority is limited to the powers described above, and does not include any other powers not expressly granted herein. Principal does not grant the Agent any authority over the Principal\'s property, finances, medical or healthcare decisions, or business affairs.', 'Limitation.');
  addParagraph('Revocation.  The Principal shall have the unlimited right, at any time and for any reason, with or without cause, to revoke this power of attorney and the powers granted herein. This power of attorney shall automatically be revoked upon termination of the agreement between Principal and Agent.', 'Revocation.');
  addParagraph('Acceptance:  The Agent accepts this appointment as power of attorney subject to the terms of this power of attorney and the agreement between Principal and Agent.', 'Acceptance:');

  // ── Signature section ────────────────────────────────────────────────────
  // Keep the whole block together — estimate height and page-break if needed
  const sigBlockH = sig.mode === 'draw' ? 290 : 260;
  ensureRoom(sigBlockH);
  y += 14;

  // "Signature: [value]" row — then underline BELOW the content
  doc.setFontSize(bodySize);
  doc.setFont('times', 'normal');
  doc.setTextColor(0, 0, 0);
  const sigLabel = 'Signature: ';
  const sigLabelW = doc.getTextWidth(sigLabel);
  doc.text(sigLabel, margin, y);

  if (sig.mode === 'draw' && sig.signatureUrl) {
    // Invert white-on-transparent canvas to black-on-white
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.src = sig.signatureUrl;
    canvas.width = img.width || 300;
    canvas.height = img.height || 80;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const alpha = imageData.data[i + 3];
      if (alpha > 0) {
        imageData.data[i] = 255 - imageData.data[i];
        imageData.data[i + 1] = 255 - imageData.data[i + 1];
        imageData.data[i + 2] = 255 - imageData.data[i + 2];
        imageData.data[i + 3] = alpha;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    // Place image so its baseline aligns with text baseline
    const imgH = 36;
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', margin + sigLabelW, y - imgH + 4, 160, imgH);
    // Underline below the image
    y += 6;
    hRule();
    y += 30;
  } else {
    // Typed name in italic — same baseline as label
    doc.setFontSize(22);
    doc.setFont('times', 'italic');
    doc.text(sig.typedName ?? sig.printedName, margin + sigLabelW, y);
    doc.setFontSize(bodySize);
    doc.setFont('times', 'normal');
    // Underline 4pt below text baseline
    y += 4;
    hRule();
    y += 30;
  }

  // Helper: label in normal weight, value in larger bold — then underline below
  const addSignatureField = (label: string, value: string) => {
    const labelSize = 11;
    const valueSize = 15;

    // Label: e.g. "Printed Name: "
    doc.setFontSize(labelSize);
    doc.setFont('times', 'normal');
    doc.setTextColor(0, 0, 0);
    const labelStr = `${label}: `;
    const labelW = doc.getTextWidth(labelStr);
    doc.text(labelStr, margin, y);

    // Value: larger, bold, right after the label on the same baseline
    doc.setFontSize(valueSize);
    doc.setFont('times', 'bold');
    doc.text(value, margin + labelW, y);

    // Underline sits 4pt below the (taller) value baseline
    y += 4;
    hRule();

    // Double-spaced gap before next field
    y += 30;
  };

  addSignatureField('Printed Name', sig.printedName);
  addSignatureField('Current City and State', sig.cityState);
  addSignatureField('Effective Date', sig.effectiveDate);

  doc.save('LPOA-BlackCloak-Signed.pdf');
}

export function LPOAScreen({ sigData, onSign, onRescind }: LPOAScreenProps) {
  const signed = !!sigData;

  return (
    <div style={{ backgroundColor: '#1c1c1e', color: '#fff' }} className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        {signed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#34c759' }} />
            <span style={{ color: '#34c759', fontSize: '12px', fontWeight: '600' }}>Active</span>
          </div>
        )}
        <p style={{ color: GOLD, letterSpacing: '0.1em', fontSize: '11px' }} className="uppercase font-semibold mb-2">
          Legal Document
        </p>
        <h1 style={{ fontSize: '24px', lineHeight: '1.2', fontWeight: '700' }}>
          Limited Revocable Power<br />of Attorney
        </h1>
      </div>

      <div style={{ backgroundColor: BORDER, height: '1px' }} className="mx-6" />

      {/* Document body */}
      <div className="flex-1 overflow-y-auto px-6 py-5" style={{ fontSize: '13.5px', lineHeight: '1.7', color: '#e5e5e7' }}>
        <p className="mb-4">
          I, the undersigned principal (the "Principal"), do hereby grant to BlackCloak, Inc., a Delaware corporation, and its employees and representatives (the "Agent"), as my agent to have the full power and authority to exercise the following powers:
        </p>
        <p className="mb-4">
          To exercise data rights on my behalf and to remove my personally identifiable information from third party websites and databases and to otherwise prevent third parties from sharing my personally identifiable information with others.
        </p>
        <p className="mb-4">
          This grant of authority includes all incidental acts as are reasonably necessary to carry out such powers.
        </p>
        <p className="mb-4">
          <span style={{ color: '#fff', fontWeight: '600' }}>Reliance.</span> Any third party may rely upon the existence of this instrument and may deal in good faith with the Agent as if the Agent's authority were in full force and effect, unless such third party has actual knowledge of its revocation, termination, or invalidity.
        </p>
        <p className="mb-4">
          <span style={{ color: '#fff', fontWeight: '600' }}>Limitation.</span> This grant of authority is limited to the powers described above, and does not include any other powers not expressly granted herein. Principal does not grant the Agent any authority over the Principal's property, finances, medical or healthcare decisions, or business affairs.
        </p>
        <p className="mb-4">
          <span style={{ color: '#fff', fontWeight: '600' }}>Revocation.</span> The Principal shall have the unlimited right, at any time and for any reason, with or without cause, to revoke this power of attorney and the powers granted herein. This power of attorney shall automatically be revoked upon termination of the agreement between Principal and Agent.
        </p>
        <p className="mb-6">
          <span style={{ color: '#fff', fontWeight: '600' }}>Acceptance.</span> The Agent accepts this appointment as power of attorney subject to the terms of this power of attorney and the agreement between Principal and Agent.
        </p>

        {/* Signature section — only shown after signing */}
        {signed && sigData && (
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '20px' }}>
            {/* Filled signature */}
            <div className="mb-4">
              <p style={{ color: MUTED, fontSize: '11px', marginBottom: '6px', letterSpacing: '0.05em' }} className="uppercase">Signature</p>
              <div style={{ borderBottom: `1px solid #48484a`, minHeight: '44px', display: 'flex', alignItems: 'center', paddingBottom: '4px' }}>
                {sigData.mode === 'draw' && sigData.signatureUrl ? (
                  <img src={sigData.signatureUrl} alt="Signature" style={{ maxHeight: '40px', filter: 'invert(1) brightness(0.9)' }} />
                ) : (
                  <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: '26px', color: '#fff' }}>
                    {sigData.typedName}
                  </span>
                )}
              </div>
            </div>
            {[
              { label: 'Printed Name', value: sigData.printedName },
              { label: 'Current City and State', value: sigData.cityState },
              { label: 'Effective Date', value: sigData.effectiveDate },
            ].map(({ label, value }) => (
              <div key={label} className="mb-4">
                <p style={{ color: MUTED, fontSize: '11px', marginBottom: '6px', letterSpacing: '0.05em' }} className="uppercase">{label}</p>
                <div style={{ borderBottom: `1px solid #48484a`, minHeight: '28px', display: 'flex', alignItems: 'center', paddingBottom: '4px' }}>
                  <span style={{ fontSize: '14px', color: '#e5e5e7' }}>{value}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <p style={{ color: MUTED, fontSize: '12px', lineHeight: '1.5', marginBottom: '8px' }}>
          By signing, you agree to grant BlackCloak, Inc. the limited powers described above.
        </p>
      </div>

      {/* CTA area */}
      <div className="px-6 pb-10 pt-3" style={{ flexShrink: 0 }}>
        {signed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => sigData && downloadSignedCopy(sigData)}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', fontWeight: '600', fontSize: '15px',
                border: `1.5px solid ${GOLD}`, cursor: 'pointer', backgroundColor: 'transparent', color: GOLD,
              }}
            >
              ↓ Download Signed Copy
            </button>
            <button
              onClick={onRescind}
              style={{
                width: '100%', padding: '14px', borderRadius: '12px', fontWeight: '600', fontSize: '15px',
                border: '1.5px solid #ff453a', cursor: 'pointer', backgroundColor: 'transparent', color: '#ff453a',
              }}
            >
              Rescind Authorization
            </button>
          </div>
        ) : (
          <button
            onClick={onSign}
            style={{
              width: '100%', padding: '16px', borderRadius: '12px', fontWeight: '600', fontSize: '16px',
              border: 'none', cursor: 'pointer', backgroundColor: GOLD, color: '#1c1c1e',
            }}
          >
            Review &amp; Sign
          </button>
        )}
      </div>
    </div>
  );
}
