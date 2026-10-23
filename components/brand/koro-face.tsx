import React from "react";

/**
 * Koro's visual identity: friendly flat characters that all share one face
 * (round eyes with a sparkle, a soft smile, rosy cheeks). The mascot also wears
 * a small bindi, a nod to the shops Koro serves.
 *
 * - <KoroFace />  the mascot itself, in any tone
 * - <KoroGlyph /> everyday shop objects (box, truck, pin...) wearing the same face,
 *                 used as dynamic icons instead of generic line icons
 */

const INK = "#1a1c1c";

export const KORO_TONES = {
  sky: "#62aef0",
  blue: "#0075de",
  marigold: "#ffb110",
  coral: "#f64932",
  mint: "#4cc38a",
  ink: "#02093a",
  blush: "#ff9db1",
} as const;

export type KoroTone = keyof typeof KORO_TONES;
type Mood = "happy" | "worried";

interface EyesProps {
  cx: number;
  cy: number;
  s?: number;
  mood?: Mood;
  ink?: string;
}

/** The shared Koro face: two eyes, cheeks, a mouth. Positioned by its centre. */
function Face({ cx, cy, s = 1, mood = "happy", ink = INK }: EyesProps) {
  return (
    <g>
      <circle cx={cx - 7 * s} cy={cy} r={2.9 * s} fill={ink} />
      <circle cx={cx + 7 * s} cy={cy} r={2.9 * s} fill={ink} />
      <circle cx={cx - 6.1 * s} cy={cy - 1 * s} r={0.95 * s} fill="#fff" />
      <circle cx={cx + 7.9 * s} cy={cy - 1 * s} r={0.95 * s} fill="#fff" />
      <circle cx={cx - 12 * s} cy={cy + 5.5 * s} r={2.6 * s} fill="#ff7d8c" opacity={0.5} />
      <circle cx={cx + 12 * s} cy={cy + 5.5 * s} r={2.6 * s} fill="#ff7d8c" opacity={0.5} />
      {mood === "worried" ? (
        <>
          <path
            d={`M${cx - 11 * s} ${cy - 6 * s} L${cx - 4 * s} ${cy - 8.5 * s} M${cx + 4 * s} ${cy - 8.5 * s} L${cx + 11 * s} ${cy - 6 * s}`}
            stroke={ink}
            strokeWidth={1.8 * s}
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M${cx - 3.5 * s} ${cy + 9 * s} Q${cx} ${cy + 5.5 * s} ${cx + 3.5 * s} ${cy + 9 * s}`}
            stroke={ink}
            strokeWidth={2 * s}
            strokeLinecap="round"
            fill="none"
          />
        </>
      ) : (
        <path
          d={`M${cx - 4.8 * s} ${cy + 5 * s} Q${cx} ${cy + 10.5 * s} ${cx + 4.8 * s} ${cy + 5 * s}`}
          stroke={ink}
          strokeWidth={2.1 * s}
          strokeLinecap="round"
          fill="none"
        />
      )}
    </g>
  );
}

interface KoroFaceProps {
  size?: number;
  tone?: KoroTone;
  className?: string;
  title?: string;
}

/** The Koro mascot. Decorative by default; pass `title` to expose it to screen readers. */
export function KoroFace({ size = 56, tone = "marigold", className, title }: KoroFaceProps) {
  const fill = KORO_TONES[tone];
  const dark = tone === "ink";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <rect x="4" y="7" width="56" height="52" rx="22" fill={fill} />
      <path d="M12 24 Q20 11 34 10" stroke="#fff" strokeOpacity="0.35" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="32" cy="19" r="2.4" fill={dark ? KORO_TONES.marigold : KORO_TONES.coral} />
      <Face cx={32} cy={35} s={1.15} ink={dark ? "#fff" : INK} />
    </svg>
  );
}

export type KoroGlyphType =
  | "package"
  | "alert"
  | "truck"
  | "calendar"
  | "map-pin"
  | "check-circle"
  | "trending-up"
  | "sparkles";

interface KoroGlyphProps {
  type: KoroGlyphType;
  size?: number;
  className?: string;
}

/** A shop object that wears the Koro face. */
export function KoroGlyph({ type, size = 40, className }: KoroGlyphProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true">
      {renderGlyph(type)}
    </svg>
  );
}

function renderGlyph(type: KoroGlyphType) {
  switch (type) {
    case "package":
      return (
        <>
          <rect x="11" y="26" width="42" height="30" rx="7" fill={KORO_TONES.sky} />
          <rect x="7" y="14" width="50" height="15" rx="6" fill={KORO_TONES.blue} />
          <rect x="27" y="14" width="10" height="15" fill={KORO_TONES.marigold} />
          <Face cx={32} cy={42} s={0.95} />
        </>
      );
    case "alert":
      return (
        <>
          <path
            d="M32 7 C34 7 36 8.4 37.2 10.4 L57.6 47 C60 51.4 57 57 51.8 57 L12.2 57 C7 57 4 51.4 6.4 47 L26.8 10.4 C28 8.4 30 7 32 7Z"
            fill={KORO_TONES.marigold}
          />
          <Face cx={32} cy={41} s={0.9} mood="worried" />
          <rect x="30" y="19" width="4" height="9" rx="2" fill={INK} />
        </>
      );
    case "truck":
      return (
        <>
          <rect x="4" y="19" width="36" height="28" rx="6" fill={KORO_TONES.mint} />
          <path d="M40 27 H50 Q53 27 55 30 L60 38 V47 H40 Z" fill={KORO_TONES.blue} />
          <rect x="45" y="31" width="8" height="7" rx="2" fill="#dff1ff" />
          <circle cx="17" cy="50" r="6.5" fill={INK} />
          <circle cx="17" cy="50" r="2.6" fill="#fff" />
          <circle cx="47" cy="50" r="6.5" fill={INK} />
          <circle cx="47" cy="50" r="2.6" fill="#fff" />
          <Face cx={22} cy={32} s={0.8} />
        </>
      );
    case "calendar":
      return (
        <>
          <rect x="8" y="12" width="48" height="46" rx="10" fill="#fff" stroke={INK} strokeWidth="2.6" />
          <path d="M8 24 V22 Q8 12 18 12 H46 Q56 12 56 22 V24 Z" fill={KORO_TONES.coral} />
          <rect x="19" y="6" width="5" height="12" rx="2.5" fill={INK} />
          <rect x="40" y="6" width="5" height="12" rx="2.5" fill={INK} />
          <Face cx={32} cy={42} s={0.85} />
        </>
      );
    case "map-pin":
      return (
        <>
          <path
            d="M32 5 C19 5 10 14.5 10 26 C10 41 32 59 32 59 C32 59 54 41 54 26 C54 14.5 45 5 32 5Z"
            fill={KORO_TONES.coral}
          />
          <circle cx="32" cy="26" r="15.5" fill="#fff" />
          <Face cx={32} cy={26} s={0.85} />
        </>
      );
    case "check-circle":
      return (
        <>
          <circle cx="30" cy="32" r="24" fill={KORO_TONES.mint} />
          <Face cx={30} cy={31} s={1} />
          <circle cx="50" cy="48" r="10" fill="#fff" />
          <circle cx="50" cy="48" r="8" fill={KORO_TONES.blue} />
          <path d="M45.5 48.2 L48.8 51.5 L54.6 44.8" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      );
    case "trending-up":
      return (
        <>
          <rect x="7" y="38" width="13" height="19" rx="4.5" fill="#b9dcfa" />
          <rect x="24" y="27" width="13" height="30" rx="4.5" fill={KORO_TONES.sky} />
          <rect x="41" y="10" width="17" height="47" rx="6" fill={KORO_TONES.blue} />
          <Face cx={49.5} cy={29} s={0.62} ink="#fff" />
          <path d="M9 24 L22 14 L30 18" stroke={KORO_TONES.marigold} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </>
      );
    case "sparkles":
    default:
      return (
        <>
          <path
            d="M30 5 C32 22 40 30 57 32 C40 34 32 42 30 59 C28 42 20 34 3 32 C20 30 28 22 30 5Z"
            fill={KORO_TONES.marigold}
          />
          <Face cx={30} cy={32} s={0.75} />
          <path d="M53 6 C53.6 11 55.4 12.8 60 13.4 C55.4 14 53.6 15.8 53 21 C52.4 15.8 50.6 14 46 13.4 C50.6 12.8 52.4 11 53 6Z" fill={KORO_TONES.sky} />
        </>
      );
  }
}
