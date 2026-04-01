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

  const hexToRgb = (hex: string) =>
    hex.match(/\w\w/g)!.map(h => parseInt(h, 16)) as [number, number, number];

  // Returns height that will be used (without advancing y), for planning
  const measureText = (text: string, size: number, lineHeight: number) => {
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, contentW);
    return lines.length * size * lineHeight;
  };

  const addText = (text: string, opts: {
    size?: number; bold?: boolean; color?: string; lineHeight?: number; indent?: number;
  } = {}) => {
    const { size = 11, bold = false, color = '#111111', lineHeight = 1.45, indent = 0 } = opts;
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const [r, g, b] = hexToRgb(color);
    doc.setTextColor(r, g, b);
    const lines = doc.splitTextToSize(text, contentW - indent);
    const lineH = size * lineHeight;
    if (y + lines.length * lineH > pageH - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines, margin + indent, y);
    y += lines.length * lineH;
  };

  const addSpacer = (h: number) => { y += h; };

  const drawHRule = (color: [number, number, number] = [210, 210, 210]) => {
    doc.setDrawColor(...color);
    doc.line(margin, y, margin + contentW, y);
  };

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...hexToRgb('#999999'));
  doc.text('LEGAL DOCUMENT', margin, y);
  addSpacer(14);

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...hexToRgb('#111111'));
  doc.text('Limited Revocable Power of Attorney', margin, y);
  addSpacer(10);

  drawHRule();
  addSpacer(18);

  // ── Body ────────────────────────────────────────────────────────────────
  const bodySize = 10.5;
  const bodyLH = 1.5;

  const plain = (text: string) => {
    addText(text, { size: bodySize, lineHeight: bodyLH });
    addSpacer(9);
  };

  const prefixed = (boldPart: string, rest: string) => {
    // Estimate height needed for this paragraph
    const fullText = boldPart + rest;
    const needed = measureText(fullText, bodySize, bodyLH) + 9;
    if (y + needed > pageH - margin) { doc.addPage(); y = margin; }

    doc.setFontSize(bodySize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...hexToRgb('#111111'));
    const bw = doc.getTextWidth(boldPart);

    // First line: bold prefix + rest on same line
    const firstLineRest = doc.splitTextToSize(rest, contentW - bw);
    doc.text(boldPart, margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(firstLineRest[0], margin + bw, y);
    y += bodySize * bodyLH;

    // Remaining lines (if any) full-width
    if (firstLineRest.length > 1) {
      const overflow = doc.splitTextToSize(firstLineRest.slice(1).join(' '), contentW);
      doc.text(overflow, margin, y);
      y += overflow.length * bodySize * bodyLH;
    }
    addSpacer(9);
  };

  plain('I, the undersigned principal (the "Principal"), do hereby grant to BlackCloak, Inc., a Delaware corporation, and its employees and representatives (the "Agent"), as my agent to have the full power and authority to exercise the following powers:');
  plain('To exercise data rights on my behalf and to remove my personally identifiable information from third party websites and databases and to otherwise prevent third parties from sharing my personally identifiable information with others.');
  plain('This grant of authority includes all incidental acts as are reasonably necessary to carry out such powers.');
  prefixed('Reliance.', ' Any third party may rely upon the existence of this instrument and may deal in good faith with the Agent as if the Agent\'s authority were in full force and effect, unless such third party has actual knowledge of its revocation, termination, or invalidity.');
  prefixed('Limitation.', ' This grant of authority is limited to the powers described above, and does not include any other powers not expressly granted herein. Principal does not grant the Agent any authority over the Principal\'s property, finances, medical or healthcare decisions, or business affairs.');
  prefixed('Revocation.', ' The Principal shall have the unlimited right, at any time and for any reason, with or without cause, to revoke this power of attorney and the powers granted herein. This power of attorney shall automatically be revoked upon termination of the agreement between Principal and Agent.');
  prefixed('Acceptance.', ' The Agent accepts this appointment as power of attorney subject to the terms of this power of attorney and the agreement between Principal and Agent.');

  // ── Signature section ───────────────────────────────────────────────────
  // Calculate total height needed for the entire signature block so it
  // always starts on a fresh page if it won't fit together.
  const sigBlockHeight = 220; // conservative estimate for all fields
  if (y + sigBlockHeight > pageH - margin) {
    doc.addPage();
    y = margin;
  } else {
    addSpacer(12);
    drawHRule();
    addSpacer(20);
  }

  // Signature
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...hexToRgb('#888888'));
  doc.text('SIGNATURE', margin, y);
  addSpacer(8);

  if (sig.mode === 'draw' && sig.signatureUrl) {
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
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', margin, y, 200, 52);
    y += 52;
  } else if (sig.typedName) {
    doc.setFontSize(26);
    doc.setFont('times', 'italic');
    doc.setTextColor(...hexToRgb('#111111'));
    doc.text(sig.typedName, margin, y + 24);
    y += 30;
  }

  addSpacer(6);
  drawHRule([180, 180, 180]);
  addSpacer(18);

  // Helper for labeled fields
  const addField = (label: string, value: string) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb('#888888'));
    doc.text(label.toUpperCase(), margin, y);
    addSpacer(10);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...hexToRgb('#111111'));
    doc.text(value, margin, y);
    addSpacer(6);
    drawHRule([200, 200, 200]);
    addSpacer(16);
  };

  addField('Printed Name', sig.printedName);
  addField('Current City and State', sig.cityState);
  addField('Effective Date', sig.effectiveDate);

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
