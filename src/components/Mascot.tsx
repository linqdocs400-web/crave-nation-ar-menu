import { MustTry } from './Boards';

/**
 * Cute cheering bear mascot ("Must try!") — inline SVG + CSS keyframes.
 * Lightweight and never blocks the food or the physical menu.
 */
export function Mascot({ celebrating }: { line?: string; celebrating: boolean }) {
  return (
    <div className={`mascot mascot-bear ${celebrating ? 'mascot-cheer' : ''}`} aria-hidden="true">
      <MustTry />
      <svg viewBox="0 0 80 90" width="70" height="80">
        <g className="mascot-body">
          {/* ears */}
          <circle cx="22" cy="14" r="9" fill="#c98d5c" />
          <circle cx="58" cy="14" r="9" fill="#c98d5c" />
          <circle cx="22" cy="14" r="4.5" fill="#8d5a34" />
          <circle cx="58" cy="14" r="4.5" fill="#8d5a34" />
          {/* head */}
          <ellipse cx="40" cy="26" rx="22" ry="19" fill="#d8a06c" />
          {/* muzzle */}
          <ellipse cx="40" cy="33" rx="13" ry="9.5" fill="#f3d9b8" />
          <circle cx="35" cy="23" r="2.6" fill="#241a10" />
          <circle cx="45" cy="23" r="2.6" fill="#241a10" />
          <ellipse cx="40" cy="30" rx="3.4" ry="2.4" fill="#241a10" />
          <path d="M40 32 Q40 37 35 36 M40 32 Q40 37 45 36" stroke="#241a10" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          {/* body */}
          <ellipse cx="40" cy="62" rx="21" ry="24" fill="#d8a06c" />
          <ellipse cx="40" cy="66" rx="13" ry="16" fill="#f3d9b8" />
          {/* waving arm */}
          <path className="mascot-arm" d="M22 52 Q12 44 14 32" stroke="#c98d5c" strokeWidth="8" fill="none" strokeLinecap="round" />
          {/* thumbs-up arm */}
          <path d="M58 56 Q68 60 66 70" stroke="#c98d5c" strokeWidth="8" fill="none" strokeLinecap="round" />
          <circle cx="66" cy="74" r="4.6" fill="#f3d9b8" />
          {/* feet */}
          <ellipse cx="28" cy="85" rx="7" ry="4.5" fill="#c98d5c" />
          <ellipse cx="52" cy="85" rx="7" ry="4.5" fill="#c98d5c" />
        </g>
        {/* sparkles */}
        <g className="mascot-spark">
          <path d="M72 20 l1.6 4.6 4.6 1.6 -4.6 1.6 -1.6 4.6 -1.6-4.6 -4.6-1.6 4.6-1.6z" fill="#ff5fa2" />
          <path d="M8 44 l1.2 3.4 3.4 1.2 -3.4 1.2 -1.2 3.4 -1.2-3.4 -3.4-1.2 3.4-1.2z" fill="#c084fc" />
        </g>
      </svg>
    </div>
  );
}
