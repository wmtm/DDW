import { useId } from 'react'
import { shade } from './color'
import type { BaseKind } from '../types'

/** One reusable diagonal "studio light" gradient def, light to dark along the given color. */
function Shaded({ id, color }: { id: string; color: string }) {
  return (
    <linearGradient id={id} x1="15%" y1="5%" x2="85%" y2="100%">
      <stop offset="0%" stopColor={shade(color, 0.3)} />
      <stop offset="45%" stopColor={color} />
      <stop offset="100%" stopColor={shade(color, -0.32)} />
    </linearGradient>
  )
}

function Metallic({ id, color }: { id: string; color: string }) {
  return (
    <linearGradient id={id} x1="10%" y1="0%" x2="90%" y2="100%">
      <stop offset="0%" stopColor={shade(color, 0.55)} />
      <stop offset="30%" stopColor={shade(color, 0.1)} />
      <stop offset="55%" stopColor={shade(color, -0.1)} />
      <stop offset="80%" stopColor={shade(color, 0.2)} />
      <stop offset="100%" stopColor={shade(color, -0.35)} />
    </linearGradient>
  )
}

const GARMENT_PATH =
  'M350 390 L300 330 L230 430 L300 480 L350 460 L350 760 Q350 780 370 780 L630 780 Q650 780 650 760 L650 460 ' +
  'L700 480 L770 430 L700 330 L650 390 Q650 335 610 330 Q560 360 500 360 Q440 360 390 330 Q350 335 350 390 Z'

function TShirt({ color }: { color: string }) {
  const id = useId()
  return (
    <>
      <defs>
        <Shaded id={id} color={color} />
      </defs>
      <path d={GARMENT_PATH} fill={`url(#${id})`} stroke={shade(color, -0.45)} strokeWidth="2" />
    </>
  )
}

function Polo({ color }: { color: string }) {
  const id = useId()
  const collar = shade(color, -0.12)
  return (
    <>
      <defs>
        <Shaded id={id} color={color} />
      </defs>
      <path d={GARMENT_PATH} fill={`url(#${id})`} stroke={shade(color, -0.45)} strokeWidth="2" />
      <path d="M440 345 L500 385 L560 345 L535 332 L500 350 L465 332 Z" fill={collar} />
      <line x1="500" y1="385" x2="500" y2="470" stroke={shade(color, -0.3)} strokeWidth="3" />
      <circle cx="500" cy="415" r="4" fill={shade(color, -0.4)} />
      <circle cx="500" cy="445" r="4" fill={shade(color, -0.4)} />
    </>
  )
}

function Apron({ color }: { color: string }) {
  const id = useId()
  return (
    <>
      <defs>
        <Shaded id={id} color={color} />
      </defs>
      <path d="M470 150 Q500 140 530 150 L545 330 L455 330 Z" fill={`url(#${id})`} opacity="0.92" />
      <path d="M400 330 L600 330 Q612 330 612 346 L612 470 Q612 486 596 486 L404 486 Q388 486 388 470 L388 346 Q388 330 400 330 Z" fill={`url(#${id})`} stroke={shade(color, -0.4)} strokeWidth="2" />
      <path d="M330 486 L670 486 L700 800 Q702 818 684 818 L316 818 Q298 818 300 800 Z" fill={`url(#${id})`} stroke={shade(color, -0.4)} strokeWidth="2" />
      <path d="M300 560 Q260 580 250 640" stroke={shade(color, -0.3)} strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M700 560 Q740 580 750 640" stroke={shade(color, -0.3)} strokeWidth="10" fill="none" strokeLinecap="round" />
    </>
  )
}

function Cap({ color }: { color: string }) {
  const id = useId()
  return (
    <>
      <defs>
        <Shaded id={id} color={color} />
      </defs>
      <path
        d="M322 460 C322 300 400 190 500 190 C600 190 678 300 678 460 Z"
        fill={`url(#${id})`}
        stroke={shade(color, -0.4)}
        strokeWidth="2"
      />
      <path d="M500 230 L500 455" stroke={shade(color, -0.25)} strokeWidth="2" opacity="0.6" />
      <path d="M410 255 C405 320 400 390 404 452" stroke={shade(color, -0.25)} strokeWidth="2" opacity="0.5" fill="none" />
      <path d="M590 255 C595 320 600 390 596 452" stroke={shade(color, -0.25)} strokeWidth="2" opacity="0.5" fill="none" />
      <path d="M320 460 Q500 505 680 460 L730 492 Q500 575 270 492 Z" fill={shade(color, -0.18)} stroke={shade(color, -0.45)} strokeWidth="2" />
      <circle cx="500" cy="208" r="12" fill={shade(color, -0.2)} />
    </>
  )
}

function cylinder(cx: number, topY: number, bottomY: number, rx: number): string {
  return `M${cx - rx} ${topY} L${cx - rx} ${bottomY} A${rx} ${16} 0 0 0 ${cx + rx} ${bottomY} L${cx + rx} ${topY} A${rx} ${16} 0 0 1 ${cx - rx} ${topY} Z`
}

function Mug({ color }: { color: string }) {
  const id = useId()
  return (
    <>
      <defs>
        <Shaded id={id} color={color} />
      </defs>
      <path d={cylinder(500, 380, 700, 110)} fill={`url(#${id})`} stroke={shade(color, -0.4)} strokeWidth="2" />
      <ellipse cx="500" cy="380" rx="110" ry="22" fill={shade(color, 0.22)} stroke={shade(color, -0.3)} strokeWidth="1.5" />
      <path
        d="M610 440 C 700 450 700 580 610 600"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="34"
        strokeLinecap="round"
      />
    </>
  )
}

function Bottle({ color }: { color: string }) {
  const id = useId()
  return (
    <>
      <defs>
        <Shaded id={id} color={color} />
      </defs>
      <path d={cylinder(500, 300, 760, 70)} fill={`url(#${id})`} stroke={shade(color, -0.4)} strokeWidth="2" />
      <ellipse cx="500" cy="300" rx="70" ry="14" fill={shade(color, 0.2)} />
      <path d="M460 300 L470 232 L530 232 L540 300 Z" fill={`url(#${id})`} stroke={shade(color, -0.4)} strokeWidth="2" />
      <rect x="463" y="186" width="74" height="50" rx="10" fill={shade(color, -0.15)} stroke={shade(color, -0.45)} strokeWidth="2" />
    </>
  )
}

function KidsBottle({ color }: { color: string }) {
  const id = useId()
  return (
    <>
      <defs>
        <Shaded id={id} color={color} />
      </defs>
      <path d={cylinder(500, 380, 720, 90)} fill={`url(#${id})`} stroke={shade(color, -0.4)} strokeWidth="2" />
      <ellipse cx="500" cy="380" rx="90" ry="16" fill={shade(color, 0.2)} />
      <rect x="455" y="320" width="90" height="62" rx="14" fill={shade(color, -0.1)} stroke={shade(color, -0.45)} strokeWidth="2" />
      <path d="M470 320 Q470 260 450 220" stroke={shade(color, -0.3)} strokeWidth="12" fill="none" strokeLinecap="round" />
    </>
  )
}

function KidsCup({ color }: { color: string }) {
  const id = useId()
  return (
    <>
      <defs>
        <Shaded id={id} color={color} />
      </defs>
      <path d="M390 420 L610 420 L580 680 L420 680 Z" fill={`url(#${id})`} stroke={shade(color, -0.4)} strokeWidth="2" />
      <ellipse cx="500" cy="420" rx="110" ry="20" fill={shade(color, 0.22)} stroke={shade(color, -0.3)} strokeWidth="1.5" />
      <ellipse cx="500" cy="680" rx="80" ry="14" fill={shade(color, -0.18)} />
    </>
  )
}

function GolfBalls({ color }: { color: string }) {
  const id = useId()
  const balls: [number, number][] = [
    [420, 580],
    [580, 580],
    [500, 470],
  ]
  return (
    <>
      <defs>
        <Shaded id={id} color={color} />
        <radialGradient id={`${id}-sheen`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={shade(color, 0.55)} />
          <stop offset="55%" stopColor={color} />
          <stop offset="100%" stopColor={shade(color, -0.18)} />
        </radialGradient>
      </defs>
      {balls.map(([cx, cy], i) => (
        <g key={i}>
          <ellipse cx={cx} cy={cy + 62} rx="58" ry="12" fill="#2a2013" opacity="0.22" />
          <circle cx={cx} cy={cy} r="62" fill={`url(#${id}-sheen)`} stroke={shade(color, -0.3)} strokeWidth="1.5" />
          {[-28, 0, 28].map((dx) =>
            [-28, 0, 28].map((dy) =>
              Math.hypot(dx, dy) < 42 ? (
                <circle key={`${dx}-${dy}`} cx={cx + dx} cy={cy + dy} r="4" fill={shade(color, -0.18)} opacity="0.5" />
              ) : null,
            ),
          )}
        </g>
      ))}
    </>
  )
}

function Frisbee({ color }: { color: string }) {
  const id = useId()
  return (
    <>
      <defs>
        <Shaded id={id} color={color} />
      </defs>
      <ellipse cx="500" cy="560" rx="260" ry="92" fill={`url(#${id})`} stroke={shade(color, -0.4)} strokeWidth="2" />
      <ellipse cx="500" cy="548" rx="210" ry="74" fill="none" stroke={shade(color, -0.25)} strokeWidth="3" opacity="0.6" />
    </>
  )
}

function PlushDeer({ color }: { color: string }) {
  const id = useId()
  const tagColor = '#c9a24a'
  return (
    <>
      <defs>
        <Shaded id={id} color={color} />
      </defs>
      <ellipse cx="500" cy="640" rx="150" ry="118" fill={`url(#${id})`} stroke={shade(color, -0.35)} strokeWidth="2" />
      <circle cx="500" cy="450" r="92" fill={`url(#${id})`} stroke={shade(color, -0.35)} strokeWidth="2" />
      <ellipse cx="430" cy="390" rx="26" ry="34" fill={shade(color, 0.1)} stroke={shade(color, -0.3)} strokeWidth="2" />
      <ellipse cx="570" cy="390" rx="26" ry="34" fill={shade(color, 0.1)} stroke={shade(color, -0.3)} strokeWidth="2" />
      <path d="M460 370 Q440 300 400 280" stroke={shade(color, -0.35)} strokeWidth="10" fill="none" strokeLinecap="round" />
      <path d="M540 370 Q560 300 600 280" stroke={shade(color, -0.35)} strokeWidth="10" fill="none" strokeLinecap="round" />
      <circle cx="472" cy="455" r="6" fill="#2a2013" />
      <circle cx="528" cy="455" r="6" fill="#2a2013" />
      <path d="M484 480 Q500 492 516 480" stroke="#2a2013" strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="598" y="532" width="56" height="40" rx="8" fill={tagColor} stroke={shade(tagColor, -0.3)} strokeWidth="2" />
    </>
  )
}

function PetTag({ color }: { color: string }) {
  const id = useId()
  return (
    <>
      <defs>
        <Metallic id={id} color={color} />
      </defs>
      <circle cx="500" cy="420" r="26" fill="none" stroke={`url(#${id})`} strokeWidth="14" />
      <rect x="360" y="440" width="280" height="260" rx="52" fill={`url(#${id})`} stroke={shade(color, -0.4)} strokeWidth="2" />
      <rect x="390" y="470" width="220" height="200" rx="38" fill="none" stroke={shade(color, 0.2)} strokeWidth="2" opacity="0.5" />
    </>
  )
}

function Bandana({ color }: { color: string }) {
  const id = useId()
  return (
    <>
      <defs>
        <Shaded id={id} color={color} />
      </defs>
      <path d="M280 380 L720 380 L500 700 Z" fill={`url(#${id})`} stroke={shade(color, -0.4)} strokeWidth="2" strokeLinejoin="round" />
      <path d="M280 380 L720 380 L706 414 L294 414 Z" fill={shade(color, 0.25)} opacity="0.7" />
      <path d="M440 460 L500 540 L560 460" stroke={shade(color, -0.25)} strokeWidth="3" fill="none" opacity="0.5" />
    </>
  )
}

function Leash({ color }: { color: string }) {
  const id = useId()
  const metal = '#b9bcc2'
  return (
    <>
      <defs>
        <Shaded id={id} color={color} />
      </defs>
      <path
        d="M250 740 C 320 560 420 520 500 520 C 580 520 680 560 750 740"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="30"
        strokeLinecap="round"
      />
      <rect x="465" y="470" width="70" height="56" rx="14" fill="#2a2420" stroke={shade(color, -0.3)} strokeWidth="2" />
      <circle cx="750" cy="748" r="22" fill="none" stroke={metal} strokeWidth="10" />
      <rect x="730" y="748" width="46" height="26" rx="10" fill={metal} stroke={shade(metal, -0.35)} strokeWidth="2" />
    </>
  )
}

export const BASE_RENDERERS: Record<BaseKind, (props: { color: string }) => JSX.Element> = {
  tshirt: TShirt,
  polo: Polo,
  apron: Apron,
  cap: Cap,
  mug: Mug,
  bottle: Bottle,
  golfBalls: GolfBalls,
  frisbee: Frisbee,
  kidsBottle: KidsBottle,
  kidsCup: KidsCup,
  plushDeer: PlushDeer,
  petTag: PetTag,
  bandana: Bandana,
  leash: Leash,
}
