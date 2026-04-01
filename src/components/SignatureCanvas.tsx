import { useRef, useState, useEffect, useCallback } from 'react';

export interface SignatureData {
  mode: 'draw' | 'type';
  signatureUrl?: string;
  typedName?: string;
  printedName: string;
  cityState: string;
  effectiveDate: string;
}

interface SignatureCanvasProps {
  onBack: () => void;
  onSubmit: (data: SignatureData) => void;
}

const GOLD = '#c4a882';
const SURFACE = '#2c2c2e';
const BORDER = '#3a3a3c';
const MUTED = '#8e8e93';

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="mb-4">
      <p style={{ color: MUTED, fontSize: '11px', letterSpacing: '0.06em', marginBottom: '6px' }} className="uppercase">
        {label}
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          backgroundColor: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: '8px',
          padding: '10px 12px',
          color: '#fff',
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

export function SignatureCanvas({ onBack, onSubmit }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasEmpty, setCanvasEmpty] = useState(true);
  const [typedName, setTypedName] = useState('');
  const [printedName, setPrintedName] = useState('');
  const [cityState, setCityState] = useState('');
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Init canvas
  useEffect(() => {
    if (mode !== 'draw') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setCanvasEmpty(true);
  }, [mode]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setCanvasEmpty(false);
    const pos = getPos(e);
    lastPos.current = pos;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 1, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }, []);

  const drawMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !lastPos.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  }, [isDrawing]);

  const stopDraw = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width * dpr, rect.height * dpr);
    setCanvasEmpty(true);
  }, []);

  const sigValid = mode === 'draw' ? !canvasEmpty : typedName.trim().length > 0;
  const formValid = sigValid && printedName.trim().length > 0 && cityState.trim().length > 0;

  const handleSubmit = useCallback(() => {
    if (!formValid) return;
    if (mode === 'draw') {
      const url = canvasRef.current!.toDataURL('image/png');
      onSubmit({ mode, signatureUrl: url, printedName, cityState, effectiveDate: today });
    } else {
      onSubmit({ mode, typedName: typedName.trim(), printedName, cityState, effectiveDate: today });
    }
  }, [formValid, mode, typedName, printedName, cityState, today, onSubmit]);

  return (
    <div style={{ backgroundColor: '#1c1c1e', color: '#fff' }} className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center px-6 pt-6 pb-3">
        <button onClick={onBack} style={{ color: GOLD, fontSize: '14px', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          ← Back
        </button>
      </div>

      <div className="px-6 pb-3">
        <p style={{ color: GOLD, letterSpacing: '0.1em', fontSize: '11px' }} className="uppercase font-semibold mb-1">
          Signature
        </p>
        <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Sign to Authorize</h2>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6">
        {/* Mode toggle */}
        <div
          style={{
            display: 'flex',
            backgroundColor: SURFACE,
            borderRadius: '10px',
            padding: '3px',
            marginBottom: '14px',
          }}
        >
          {(['draw', 'type'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                backgroundColor: mode === m ? '#48484a' : 'transparent',
                color: mode === m ? '#fff' : MUTED,
              }}
            >
              {m === 'draw' ? 'Draw' : 'Type'}
            </button>
          ))}
        </div>

        {/* Signature area */}
        {mode === 'draw' ? (
          <div className="mb-1">
            <div
              style={{
                backgroundColor: SURFACE,
                borderRadius: '12px',
                border: `1px solid ${BORDER}`,
                position: 'relative',
                height: '140px',
                overflow: 'hidden',
              }}
            >
              <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair', display: 'block' }}
                onMouseDown={startDraw}
                onMouseMove={drawMove}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={drawMove}
                onTouchEnd={stopDraw}
              />
              {canvasEmpty && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', color: '#48484a', fontSize: '13px' }}>
                  Draw your signature here
                </div>
              )}
              <div style={{ position: 'absolute', bottom: '30px', left: '16px', right: '16px', height: '1px', backgroundColor: BORDER, pointerEvents: 'none' }} />
            </div>
            <div className="flex justify-end mt-1 mb-3">
              <button onClick={clearCanvas} style={{ color: MUTED, fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <p style={{ color: MUTED, fontSize: '11px', letterSpacing: '0.06em', marginBottom: '6px' }} className="uppercase">
              Type your name
            </p>
            <div
              style={{
                backgroundColor: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: '12px',
                padding: '12px 16px',
                minHeight: '72px',
                display: 'flex',
                alignItems: 'center',
                position: 'relative',
              }}
            >
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Your full name"
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  fontFamily: "'Dancing Script', cursive",
                  fontSize: '26px',
                  color: '#fff',
                  caretColor: GOLD,
                }}
              />
            </div>
            {typedName.trim().length > 0 && (
              <p style={{ color: MUTED, fontSize: '11px', marginTop: '4px' }}>
                Typed signatures are legally binding
              </p>
            )}
          </div>
        )}

        {/* Form fields */}
        <Field label="Printed Name" value={printedName} onChange={setPrintedName} placeholder="Full legal name" />
        <Field label="Current City and State" value={cityState} onChange={setCityState} placeholder="e.g. Austin, TX" />

        {/* Effective date (read-only) */}
        <div className="mb-4">
          <p style={{ color: MUTED, fontSize: '11px', letterSpacing: '0.06em', marginBottom: '6px' }} className="uppercase">
            Effective Date
          </p>
          <div style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '8px', padding: '10px 12px', color: MUTED, fontSize: '14px' }}>
            {today}
          </div>
        </div>

        <p style={{ color: MUTED, fontSize: '12px', lineHeight: '1.5', marginBottom: '12px' }}>
          By signing, you confirm that you have read and agree to grant BlackCloak, Inc. the limited powers described in this document.
        </p>
      </div>

      {/* Submit */}
      <div className="px-6 pb-10 pt-3" style={{ flexShrink: 0 }}>
        <button
          onClick={handleSubmit}
          disabled={!formValid}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '16px',
            border: 'none',
            cursor: formValid ? 'pointer' : 'default',
            backgroundColor: formValid ? GOLD : '#3a3a3c',
            color: formValid ? '#1c1c1e' : MUTED,
            transition: 'all 0.2s',
          }}
        >
          Submit Signature
        </button>
      </div>
    </div>
  );
}
