import { useCallback, useEffect, useRef, useState } from 'react';
import { ArSession } from '../ar/arSession';
import type { TrackingState } from '../ar/arSession';
import { DishExperience } from '../ar/content';
import { DISHES, PRICE_LIST } from '../data/menu';
import type { Dish } from '../data/menu';
import { pointInRegion, regionCenter } from '../ar/coords';
import { DishExperienceSheet } from '../components/DishExperienceSheet';

const STATE_TEXT: Record<TrackingState, string> = {
  starting: 'Starting camera…',
  'camera-denied': 'Camera blocked',
  unsupported: 'Camera unavailable',
  failed: 'Something went wrong',
  searching: 'Point at the Crave Nation menu',
  found: 'Menu detected ✓',
};

/**
 * SCREEN 2 + 3: live rear camera, MindAR image tracking of the printed menu,
 * tap mapping from phone screen → menu coordinates, and the floating dish
 * experience anchored over the tapped dish.
 */
export function ArScreen({ onExit, onFallback }: { onExit: () => void; onFallback: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<ArSession | null>(null);
  const contentRef = useRef<DishExperience | null>(null);
  const [state, setState] = useState<TrackingState>('starting');
  const [started, setStarted] = useState(false);
  const [dish, setDish] = useState<Dish | null>(null);
  const dishRef = useRef<Dish | null>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [calibrate, setCalibrate] = useState(() => new URLSearchParams(window.location.search).has('calibrate'));
  const calibrateRef = useRef(calibrate);
  const [flipV, setFlipV] = useState(() => localStorage.getItem('cn_flipV') === '1');
  const [calibratePos, setCalibratePos] = useState<{ u: number; v: number }[] | null>(null);
  const [listOpen, setListOpen] = useState(false);

  calibrateRef.current = calibrate;

  /* ---- lifecycle ---- */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const session = new ArSession({
      container,
      onStateChange: (s) => setState(s),
    });
    sessionRef.current = session;
    let alive = true;

    session.start().then(async (mode) => {
      if (!alive) return;
      if (mode === 'demo') {
        onFallback();
        return;
      }
      const root = session.contentRoot;
      if (!root) return;
      const content = new DishExperience(root);
      contentRef.current = content;
      session.setTicker((dt) => content.update(dt));
      session.setFlipV(flipV);
      setStarted(true);
      if (calibrateRef.current) session.showGhost(true);
    });

    return () => {
      alive = false;
      session.stop();
      contentRef.current?.clearAssets();
      contentRef.current = null;
      sessionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- flip toggling ---- */
  const toggleFlip = useCallback(() => {
    const next = !flipV;
    setFlipV(next);
    localStorage.setItem('cn_flipV', next ? '1' : '0');
    sessionRef.current?.setFlipV(next);
  }, [flipV]);

  /* ---- calibrate overlay loop ---- */
  useEffect(() => {
    const s = sessionRef.current;
    if (!s || !started || !calibrate) return;
    s.showGhost(true);
    const int = setInterval(() => {
      const s2 = sessionRef.current;
      if (!s2) return;
      // project the four menu corners + each dish region centre
      const pts = [
        s2.menuUvToScreen(0.03, 0.02),
        s2.menuUvToScreen(0.97, 0.02),
        s2.menuUvToScreen(0.97, 0.98),
        s2.menuUvToScreen(0.03, 0.98),
        ...DISHES.map((d) => {
          const c = regionCenter(d.region);
          return s2.menuUvToScreen(c.u, c.v);
        }),
      ].map((p) => (p ? { u: p.x / window.innerWidth, v: p.y / window.innerHeight } : { u: -1, v: -1 }));
      setCalibratePos(pts);
    }, 120);
    return () => {
      clearInterval(int);
      sessionRef.current?.showGhost(false);
    };
  }, [calibrate, started]);

  /* ---- dish selection ---- */
  const selectDish = useCallback((d: Dish) => {
    const s = sessionRef.current;
    const content = contentRef.current;
    if (!s || !content || content.getStatus() !== 'gone') return;
    const c = regionCenter(d.region);
    const local = s.menuUvToLocalPoint(c.u, c.v);
    dishRef.current = d;
    setDish(d);
    void content.show(d).then(() => {
      content.anchorAt({ x: local.x, y: local.y, z: 0.16 });
    });
  }, []);

  const closeDish = useCallback(() => {
    const content = contentRef.current;
    dishRef.current = null;
    setDish(null);
    setAnchor(null);
    content?.beginExit();
  }, []);

  useEffect(() => {
    if (!dish || !started) return;
    const s = sessionRef.current;
    if (!s) return;
    const int = setInterval(() => {
      if (!dishRef.current) return;
      const c = regionCenter(dishRef.current.region);
      const p = s.menuUvToScreen(c.u, c.v);
      if (p) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        // keep the whole promo composition (title above, cards around, mascot
        // below) inside the viewport: comp is ~min(92vw,540px) wide with a
        // 0.98 aspect, anchored so the food sits roughly mid-composition.
        const compW = Math.min(rect.width * 0.92, 540);
        const compH = compW / 0.98;
        const x = Math.max(compW / 2, Math.min(rect.width - compW / 2, p.x));
        const y = Math.max(compH * 0.46 + 6, Math.min(rect.height - compH * 0.55, p.y));
        setAnchor({ x, y });
      }
    }, 90);
    return () => clearInterval(int);
  }, [dish, started]);

  /* ---- pointer handling: tap dishes on the physical menu, drag to turn ---- */
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !started) return;
    let downX = 0;
    let downY = 0;
    let downT = 0;
    let moved = false;

    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('.hud, .dish-sheet')) return;
      downX = e.clientX;
      downY = e.clientY;
      downT = performance.now();
      moved = false;
    };
    const onMove = (e: PointerEvent) => {
      if (e.buttons === 0 && e.pointerType !== 'touch') return;
      if (downT === 0) return;
      const dx = e.clientX - downX;
      const dy = e.clientY - downY;
      if (Math.abs(dx) + Math.abs(dy) > 12 && !moved) {
        moved = true;
      }
      if (moved && dishRef.current) {
        contentRef.current?.onDrag(e.movementX || 0, e.movementY || 0);
      }
    };
    const onUp = (e: PointerEvent) => {
      const dtMs = performance.now() - downT;
      if (downT === 0 || moved || dtMs > 500) {
        downT = 0;
        return;
      }
      downT = 0;
      const s = sessionRef.current;
      if (!s) return;
      const uv = s.tapToMenuUv(e.clientX, e.clientY);
      if (!uv) return;
      if (calibrateRef.current) {
        setCalibratePos((p) => p);
        console.log('menu uv', uv);
        return;
      }
      if (dishRef.current) return; // already inside the experience
      const hit = DISHES.find((d) => pointInRegion(uv, d.region));
      if (hit) selectDish(hit);
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
    };
  }, [started, selectDish]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    content.onDragEnd();
  }, [dish]);

  /* ---- render ---- */
  return (
    <div className="ar-screen">
      <div ref={containerRef} className="ar-canvas-holder" />

      <div className={`hud ${state === 'found' ? 'hud-found' : ''}`}>
        <span className={`tracking-chip t-${state}`}>
          <span className="dot" />
          {STATE_TEXT[state]}
        </span>
        {!dish && (
          <div className="hud-actions">
            {!dish && (
              <button className="btn-hud" onClick={() => setCalibrate((c) => !c)}>
                {calibrate ? 'Exit calibrate' : '⚙ Calibrate'}
              </button>
            )}
            <button className="btn-hud" onClick={() => setListOpen((o) => !o)}>
              ☰ Another dish
            </button>
            <button className="btn-hud" onClick={onExit}>
              ✕ Exit
            </button>
          </div>
        )}
      </div>

      {state === 'camera-denied' && (
        <div className="ar-overlay-error">
          <h2>Camera access needed</h2>
          <p>
            To see the AR menu, allow camera access for this site (and make sure it opens over
            HTTPS). You can still browse every dish in demo mode.
          </p>
          <button className="btn-primary" onClick={onFallback}>
            Open demo mode →
          </button>
        </div>
      )}
      {state === 'unsupported' && (
        <div className="ar-overlay-error">
          <h2>Camera not available</h2>
          <p>
            This browser can’t stream the camera. Try Safari (iPhone) or Chrome (Android) over
            HTTPS, or browse the demo meanwhile.
          </p>
          <button className="btn-primary" onClick={onFallback}>
            Open demo mode →
          </button>
        </div>
      )}

      {calibrate && (
        <div className="calibrate-overlay">
          {calibratePos && (
            <svg className="calibrate-svg" viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}>
              {DISHES.map((d, i) => {
                const p = calibratePos[i + 4];
                if (p.u < 0) return null;
                return (
                  <g key={d.id}>
                    <circle cx={p.u * window.innerWidth} cy={p.v * window.innerHeight} r={2.5} fill="rgba(255,80,180,0.9)" />
                    <text x={p.u * window.innerWidth + 8} y={p.v * window.innerHeight - 6} fill="#fff" fontSize="12">
                      {d.name}
                    </text>
                  </g>
                );
              })}
              {calibratePos.slice(0, 4).map((p, i) =>
                p.u < 0 ? null : (
                  <text key={'c' + i} x={p.u * window.innerWidth} y={p.v * window.innerHeight} fill="#7cf0ff" fontSize="18" fontWeight="bold">
                    {['TL', 'TR', 'BR', 'BL'][i]}
                  </text>
                )
              )}
            </svg>
          )}
          <div className="calibrate-controls">
            <span>
              Align the preview photo with your printed menu. If it looks upside down, flip it.
            </span>
            <button className="btn-hud" onClick={toggleFlip}>
              🔄 Flip preview {flipV ? '(on)' : '(off)'}
            </button>
          </div>
        </div>
      )}

      {dish && (
        <DishExperienceSheet
          dish={dish}
          arActive
          boardAnchor={anchor}
          onClose={closeDish}
        />
      )}

      {listOpen && (
        <div className="dish-list-panel">
          <div className="dish-list-head">
            <strong>All dishes — demo</strong>
            <button className="btn-hud" onClick={() => setListOpen(false)}>✕</button>
          </div>
          <p className="demo-note">Tap to preview. Prices as printed on the Crave Nation menu (sample data).</p>
          {PRICE_LIST.map((cat) => (
            <details key={cat.category} open={true}>
              <summary>
                {cat.category}
              </summary>
              <ul>
                {cat.items.map((it) => {
                  const enabled = DISHES.find((d) => d.name === it.name);
                  return (
                    <li key={it.name}>
                      {enabled ? (
                        <button onClick={() => { setListOpen(false); selectDish(enabled); }}>
                          <span className="dish-list-name">{enabled.name}</span>
                          <span className="dish-list-price">{it.price}</span>
                        </button>
                      ) : (
                        <span className="dish-list-static">
                          <span className="dish-list-name">{it.name}</span>
                          <span className="dish-list-price">{it.price}</span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
