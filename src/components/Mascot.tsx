/**
 * Cute, energetic food-themed cheer mascot (a happy fry box).
 * Pure inline SVG + CSS keyframes; lightweight and never blocks the food.
 */
export function Mascot({ line, celebrating }: { line: string; celebrating: boolean }) {
  return (
    <div className={`mascot ${celebrating ? 'mascot-cheer' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 72 72" width="64" height="64">
        {/* fry box */}
        <g className="mascot-body">
          <path d="M18 30 L54 30 L49 62 Q36 70 23 62 Z" fill="#fff1e0" stroke="#d84b2e" strokeWidth="3" strokeLinejoin="round" />
          <path d="M24 30 L26 44 M36 30 L36 46 M48 30 L46 44" stroke="#ffd84d" strokeWidth="5" strokeLinecap="round" />
          {/* eyes */}
          <circle cx="29" cy="47" r="2.6" fill="#0a1c33" />
          <circle cx="43" cy="47" r="2.6" fill="#0a1c33" />
          {/* smile */}
          <path d="M30 53 Q36 58 42 53" stroke="#0a1c33" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          {/* waving arm */}
          <path className="mascot-arm" d="M16 38 Q8 32 10 22" stroke="#d84b2e" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
        {/* sparkles */}
        <g className="mascot-spark">
          <path d="M60 14 l2 6 6 2 -6 2 -2 6 -2-6 -6-2 6-2z" fill="#ff5fa2" />
          <path d="M10 12 l1.6 4.8 4.8 1.6 -4.8 1.6 -1.6 4.8 -1.6-4.8 -4.8-1.6 4.8-1.6z" fill="#c084fc" />
        </g>
      </svg>
      {line && <span className="mascot-line">{line}</span>}
    </div>
  );
}
