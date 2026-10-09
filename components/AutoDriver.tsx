export type Mood = "happy" | "worried" | "sad" | "sweating";

/**
 * A Chennai auto driver, drawn to be 300 units tall so his ankle, knee, waist
 * and chest line up with the wall's level guides (10%, 30%, 50%, 72%).
 */
export function Driver({ mood, className }: { mood: Mood; className?: string }) {
  const mouth = {
    happy: "M36 62 Q50 76 64 62",
    worried: "M38 68 Q50 62 62 68",
    sad: "M36 72 Q50 58 64 72",
    sweating: "M40 66 Q50 72 60 66",
  }[mood];
  const browLift = mood === "worried" || mood === "sad" ? -6 : 0;

  return (
    <svg viewBox="0 0 110 300" className={className} aria-hidden="true">
      <g strokeLinecap="round" strokeLinejoin="round">
        {/* legs */}
        <path d="M44 180 L38 292 M66 180 L72 292" stroke="#2f2a26" strokeWidth="16" />
        <path d="M30 292 h18 M64 292 h18" stroke="#121212" strokeWidth="8" />
        {/* shirt (khaki) */}
        <path d="M30 100 h50 l6 85 h-62 z" fill="#b89b5e" stroke="#121212" strokeWidth="5" />
        <path d="M55 100 v85" stroke="#121212" strokeWidth="3" />
        {/* arms */}
        <path d="M30 108 L12 160 M80 108 L98 160" stroke="#b89b5e" strokeWidth="14" />
        <circle cx="12" cy="166" r="8" fill="#c98b5a" stroke="#121212" strokeWidth="4" />
        <circle cx="98" cy="166" r="8" fill="#c98b5a" stroke="#121212" strokeWidth="4" />
        {/* neck + head */}
        <rect x="46" y="84" width="18" height="18" fill="#c98b5a" />
        <circle cx="55" cy="56" r="30" fill="#c98b5a" stroke="#121212" strokeWidth="5" />
        {/* cap or towel */}
        {mood === "sweating" ? (
          <path d="M22 36 Q55 10 88 36 L84 48 Q55 30 26 48 Z" fill="#faf3e0" stroke="#121212" strokeWidth="4" />
        ) : (
          <path d="M24 44 Q55 14 86 44 L90 48 H20 Z" fill="#121212" />
        )}
        {/* brows + eyes */}
        <path d={`M38 ${46 + browLift} l10 ${-browLift / 2} M72 ${46 + browLift} l-10 ${-browLift / 2}`} stroke="#121212" strokeWidth="4" />
        <circle cx="44" cy="52" r="3.5" fill="#121212" />
        <circle cx="66" cy="52" r="3.5" fill="#121212" />
        {/* moustache */}
        <path d="M40 60 Q55 68 70 60 Q55 64 40 60 Z" fill="#121212" />
        <path d={mouth} stroke="#121212" strokeWidth="4" fill="none" />
        {/* sweat */}
        {mood === "sweating" && (
          <g fill="#2e78b7">
            <path className="sweat" d="M86 44 q4 8 0 12 q-4 -4 0 -12z" />
            <path className="sweat sweat-2" d="M20 50 q4 8 0 12 q-4 -4 0 -12z" />
          </g>
        )}
        {/* tears */}
        {mood === "sad" && (
          <g fill="#2e78b7">
            <path className="sweat" d="M44 58 q4 8 0 12 q-4 -4 0 -12z" />
          </g>
        )}
      </g>
    </svg>
  );
}

/** A parked auto rickshaw, side view, roughly 300 units tall at the roof. */
export function Auto({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 300" className={className} aria-hidden="true">
      <g stroke="#121212" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round">
        {/* body */}
        <path d="M40 250 L40 120 Q40 60 100 60 L200 60 Q235 60 235 100 L235 250 Z" fill="#f2c94c" />
        {/* roof */}
        <path d="M30 120 Q30 44 100 44 L205 44 Q245 44 245 100 L245 120 Z" fill="#121212" />
        {/* windscreen + side window */}
        <path d="M60 120 Q60 76 100 76 L130 76 L130 160 L60 160 Z" fill="#cfe6f5" />
        <path d="M150 76 L205 76 Q222 76 222 100 L222 160 L150 160 Z" fill="#cfe6f5" />
        {/* green band */}
        <rect x="40" y="170" width="195" height="22" fill="#2f8f5b" />
        {/* wheels */}
        <circle cx="85" cy="252" r="30" fill="#2f2a26" />
        <circle cx="85" cy="252" r="12" fill="#faf3e0" />
        <circle cx="200" cy="252" r="30" fill="#2f2a26" />
        <circle cx="200" cy="252" r="12" fill="#faf3e0" />
        {/* headlight */}
        <circle cx="48" cy="140" r="9" fill="#faf3e0" />
      </g>
    </svg>
  );
}
