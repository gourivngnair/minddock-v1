import { useState, useRef, useEffect } from 'react';

interface Props {
  src: string;
  onCrop: (dataUrl: string) => void;
  onCancel: () => void;
}

type Handle = 'move' | 'nw' | 'ne' | 'sw' | 'se';
const CLAMP = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const MIN_SZ = 60; // minimum crop side in px

// Crop stored in pixels relative to the displayed image element
interface Crop { x: number; y: number; size: number; }

export default function ImageCropper({ src, onCrop, onCancel }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop | null>(null);
  const drag = useRef<{ handle: Handle; ox: number; oy: number; startCrop: Crop } | null>(null);

  // Set initial centered square once the image renders
  const initCrop = () => {
    if (!imgRef.current) return;
    const { width, height } = imgRef.current.getBoundingClientRect();
    const size = Math.round(Math.min(width, height) * 0.85);
    setCrop({ x: Math.round((width - size) / 2), y: Math.round((height - size) / 2), size });
  };

  // Window-level pointer handlers — reliable for drag across the whole screen
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!drag.current || !imgRef.current) return;
      const { handle, ox, oy, startCrop: s } = drag.current;
      const rect = imgRef.current.getBoundingClientRect();
      const W = rect.width, H = rect.height;
      const cx = CLAMP(e.clientX - rect.left, 0, W);
      const cy = CLAMP(e.clientY - rect.top,  0, H);
      const dx = cx - ox, dy = cy - oy;

      setCrop(() => {
        if (handle === 'move') {
          return { size: s.size, x: CLAMP(s.x + dx, 0, W - s.size), y: CLAMP(s.y + dy, 0, H - s.size) };
        }
        // Each corner keeps its opposite corner fixed; use averaged diagonal delta for square
        let delta = 0, maxSz = Math.min(W, H);
        let nx = s.x, ny = s.y;
        if (handle === 'se') { delta = (dx + dy)   / 2; maxSz = Math.min(W - s.x, H - s.y); }
        if (handle === 'nw') { delta = -(dx + dy)  / 2; maxSz = Math.min(s.x + s.size, s.y + s.size); }
        if (handle === 'ne') { delta = (dx - dy)   / 2; maxSz = Math.min(W - s.x, s.y + s.size); }
        if (handle === 'sw') { delta = (-dx + dy)  / 2; maxSz = Math.min(s.x + s.size, H - s.y); }
        const newSz = CLAMP(s.size + delta, MIN_SZ, maxSz);
        if (handle === 'nw') { nx = s.x + s.size - newSz; ny = s.y + s.size - newSz; }
        if (handle === 'ne') { ny = s.y + s.size - newSz; }
        if (handle === 'sw') { nx = s.x + s.size - newSz; }
        return { size: newSz, x: CLAMP(nx, 0, W - newSz), y: CLAMP(ny, 0, H - newSz) };
      });
    };
    const onUp = () => { drag.current = null; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup',   onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, []);

  const startDrag = (handle: Handle, e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!crop || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    drag.current = {
      handle, startCrop: { ...crop },
      ox: CLAMP(e.clientX - rect.left, 0, rect.width),
      oy: CLAMP(e.clientY - rect.top,  0, rect.height),
    };
  };

  // Draw to square canvas using natural pixel coordinates
  const confirmCrop = () => {
    if (!crop || !imgRef.current) return;
    const img  = imgRef.current;
    const rect = img.getBoundingClientRect();
    const sx   = Math.round((crop.x    / rect.width)  * img.naturalWidth);
    const sy   = Math.round((crop.y    / rect.height) * img.naturalHeight);
    const sw   = Math.round((crop.size / rect.width)  * img.naturalWidth);
    const sh   = Math.round((crop.size / rect.height) * img.naturalHeight);
    const side = Math.min(sw, sh);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = side;
    canvas.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, side, side);
    onCrop(canvas.toDataURL('image/jpeg', 0.9));
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onCancel]);

  const SZ = 13;
  const hdl = (pos: Handle, cursor: string, top: string, left: string) => (
    <div
      onPointerDown={(e) => startDrag(pos, e)}
      style={{
        position: 'absolute', width: SZ, height: SZ,
        background: '#fff', border: '2px solid var(--slate-blue)',
        borderRadius: 3, cursor, transform: 'translate(-50%,-50%)',
        top, left, zIndex: 3, touchAction: 'none',
      }}
    />
  );

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(10,10,18,0.88)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '20px', backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
        Drag to crop · square
      </div>

      <div style={{ position: 'relative', userSelect: 'none', touchAction: 'none', maxWidth: '90vw', maxHeight: '65vh' }}>
        <img
          ref={imgRef}
          src={src}
          draggable={false}
          onLoad={initCrop}
          style={{ display: 'block', maxWidth: '90vw', maxHeight: '65vh', borderRadius: 6 }}
        />
        {crop && (
          <div
            onPointerDown={(e) => startDrag('move', e)}
            style={{
              position: 'absolute',
              left: crop.x, top: crop.y,
              width: crop.size, height: crop.size,
              border: '1.5px solid #fff',
              cursor: 'move', touchAction: 'none',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.52)',
              zIndex: 2, boxSizing: 'border-box',
            }}
          >
            {[33, 66].map((p) => (
              <div key={`v${p}`} style={{ position: 'absolute', left: `${p}%`, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
            ))}
            {[33, 66].map((p) => (
              <div key={`h${p}`} style={{ position: 'absolute', top: `${p}%`, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }} />
            ))}
            {hdl('nw', 'nw-resize', '0%',   '0%'  )}
            {hdl('ne', 'ne-resize', '0%',   '100%')}
            {hdl('sw', 'sw-resize', '100%', '0%'  )}
            {hdl('se', 'se-resize', '100%', '100%')}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button
          onClick={onCancel}
          style={{ padding: '10px 22px', borderRadius: 99, border: '1.5px solid rgba(255,255,255,0.25)', background: 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
        >Cancel</button>
        <button
          onClick={confirmCrop}
          disabled={!crop}
          style={{ padding: '10px 24px', borderRadius: 99, border: 'none', background: 'var(--slate-blue)', color: '#fff', cursor: crop ? 'pointer' : 'default', fontSize: 13, fontWeight: 600, boxShadow: '0 4px 14px rgba(74,99,167,0.4)' }}
        >Crop &amp; use</button>
      </div>
    </div>
  );
}
