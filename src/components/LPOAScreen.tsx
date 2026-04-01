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
  const margin = 60;
  const pageW = doc.internal.pageSize.getWidth();
  const contentW = pageW - margin * 2;
  let y = margin;

  const addText = (text: string, opts: {
    size?: number; bold?: boolean; color?: string; lineHeight?: number; indent?: number;
  } = {}) => {
    const { size = 11, bold = false, color = '#111111', lineHeight = 1.6, indent = 0 } = opts;
    doc.setFontSize(size);
    doc.setFont('times', bold ? 'bold' : 'normal');
    const [r, g, b] = color.match(/\w\w/g)!.map(h => parseInt(h, 16));
    doc.setTextColor(r, g, b);
    const lines = doc.splitTextToSize(text, contentW - indent);
    const lineH = size * lineHeight;
    // Page break check
    if (y + lines.length * lineH > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines, margin + indent, y);
    y += lines.length * lineH;
    return lineH;
  };

  const addSpacer = (h = 10) => { y += h; };

  const addField = (label: string, value: string) => {
    if (y + 50 > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
    addText(label.toUpperCase(), { size: 8, color: '#666666' });
    addSpacer(4);
    doc.setDrawColor(180, 180, 180);
    doc.line(margin, y, margin + contentW, y);
    addSpacer(6);
    addText(value, { size: 12 });
    addSpacer(16);
  };

  // Header
  addText('LEGAL DOCUMENT', { size: 9, color: '#a08060' });
  addSpacer(6);
  addText('Limited Revocable Power of Attorney', { size: 20, bold: true });
  addSpacer(12);
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, margin + contentW, y);
  addSpacer(16);

  // Body paragraphs
  const paragraphs: Array<{ text: string; boldPrefix?: string }> = [
    { text: 'I, the undersigned principal (the "Principal"), do hereby grant to BlackCloak, Inc., a Delaware corporation, and its employees and representatives (the "Agent"), as my agent to have the full power and authority to exercise the following powers:' },
    { text: 'To exercise data rights on my behalf and to remove my personally identifiable information from third party websites and databases and to otherwise prevent third parties from sharing my personally identifiable information with others.' },
    { text: 'This grant of authority includes all incidental acts as are reasonably necessary to carry out such powers.' },
    { boldPrefix: 'Reliance.', text: ' Any third party may rely upon the existence of this instrument and may deal in good faith with the Agent as if the Agent\'s authority were in full force and effect, unless such third party has actual knowledge of its revocation, termination, or invalidity.' },
    { boldPrefix: 'Limitation.', text: ' This grant of authority is limited to the powers described above, and does not include any other powers not expressly granted herein. Principal does not grant the Agent any authority over the Principal\'s property, finances, medical or healthcare decisions, or business affairs.' },
    { boldPrefix: 'Revocation.', text: ' The Principal shall have the unlimited right, at any time and for any reason, with or without cause, to revoke this power of attorney and the powers granted herein. This power of attorney shall automatically be revoked upon termination of the agreement between Principal and Agent.' },
    { boldPrefix: 'Acceptance.', text: ' The Agent accepts this appointment as power of attorney subject to the terms of this power of attorney and the agreement between Principal and Agent.' },
  ];

  for (const p of paragraphs) {
    if (p.boldPrefix) {
      // Render bold prefix inline then normal text
      doc.setFontSize(11);
      doc.setFont('times', 'bold');
      doc.setTextColor(17, 17, 17);
      const prefixW = doc.getTextWidth(p.boldPrefix + ' ');
      doc.text(p.boldPrefix, margin, y);
      doc.setFont('times', 'normal');
      const rest = doc.splitTextToSize(p.text, contentW - prefixW);
      doc.text(rest[0], margin + prefixW, y);
      y += 11 * 1.6;
      if (rest.length > 1) {
        const remaining = doc.splitTextToSize(rest.slice(1).join(' '), contentW);
        doc.text(remaining, margin, y);
        y += remaining.length * 11 * 1.6;
      }
    } else {
      addText(p.text);
    }
    addSpacer(8);
  }

  // Signature section divider
  addSpacer(8);
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, margin + contentW, y);
  addSpacer(20);

  // Signature field
  if (y + 80 > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
  addText('SIGNATURE', { size: 8, color: '#666666' });
  addSpacer(4);

  if (sig.mode === 'draw' && sig.signatureUrl) {
    // Draw signature image - invert white-on-transparent to black-on-white
    // Create a temporary canvas to invert the colors
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.src = sig.signatureUrl;
    canvas.width = img.width || 300;
    canvas.height = img.height || 80;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    // Invert pixels: white strokes → black strokes
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
    const invertedDataUrl = canvas.toDataURL('image/png');
    doc.addImage(invertedDataUrl, 'PNG', margin, y, 180, 50);
    y += 56;
  } else if (sig.typedName) {
    addText(sig.typedName, { size: 22, bold: false });
  }

  doc.setDrawColor(180, 180, 180);
  doc.line(margin, y, margin + contentW, y);
  addSpacer(20);

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

        {/* Signature section */}
        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: '20px' }}>
          {signed && sigData ? (
            <>
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
            </>
          ) : (
            /* Blank fields */
            <>
              {['Signature', 'Printed Name', 'Current City and State', 'Effective Date'].map((label) => (
                <div key={label} className="mb-4">
                  <p style={{ color: MUTED, fontSize: '11px', marginBottom: '6px', letterSpacing: '0.05em' }} className="uppercase">{label}</p>
                  <div style={{ borderBottom: `1px solid #48484a`, height: '28px' }} />
                </div>
              ))}
            </>
          )}
        </div>

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
