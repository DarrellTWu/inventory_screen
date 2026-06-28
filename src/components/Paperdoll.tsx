import type { Zone } from '@/types';

/**
 * The carry stage: body silhouette, connector lines, and a dot per zone — all
 * in ONE 600×430 SVG coordinate space so they stay aligned at any rendered
 * size. The silhouette (native 170×415) is translated to the stage centre;
 * zone dots are placed from each zone's normalized x/y over the same 600×430
 * box, so they sit directly on the body. Layer order: body, connectors, dots.
 */
export interface Connector {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface PaperdollProps {
  zones: Zone[];
  activeZoneIds: Set<string>;
  connectors: Connector[];
  onZoneActivate: (zoneId: string) => void;
}

export const STAGE_W = 600;
export const STAGE_H = 430;
// Centre the 170-wide / 415-tall silhouette in the stage.
const BODY_DX = (STAGE_W - 170) / 2; // 215
const BODY_DY = 8;

export function Paperdoll({ zones, activeZoneIds, connectors, onZoneActivate }: PaperdollProps) {
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Body silhouette — non-interactive, translated to stage centre. */}
      <g
        transform={`translate(${BODY_DX} ${BODY_DY})`}
        fill="#161622"
        stroke="#28283a"
        strokeWidth="1.5"
        style={{ pointerEvents: 'none' }}
      >
        <ellipse cx="85" cy="35" rx="22" ry="24" />
        <path d="M52 108 Q52 76 65 65 Q72 58 85 56 Q98 58 105 65 Q118 76 118 108 L114 158 L56 158Z" />
        <path d="M56 108 L32 170 L43 174 L60 122 L56 108Z" />
        <path d="M114 108 L138 170 L127 174 L110 122 L114 108Z" />
        <ellipse cx="33" cy="174" rx="12" ry="9" />
        <ellipse cx="137" cy="174" rx="12" ry="9" />
        <path d="M58 158 L53 250 L67 250 L85 188 L103 250 L117 250 L112 158Z" />
        <path d="M53 250 L47 348 L63 348 L68 264 L67 250Z" />
        <path d="M117 250 L123 348 L107 348 L102 264 L103 250Z" />
        <ellipse cx="55" cy="350" rx="16" ry="8" />
        <ellipse cx="115" cy="350" rx="16" ry="8" />
      </g>

      {/* Connectors: dot → its container panel. */}
      <g stroke="#28284a" strokeWidth="1" style={{ pointerEvents: 'none' }}>
        {connectors.map((c, i) => (
          <line key={i} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} />
        ))}
      </g>

      {/* Zone dots. Active = bright ring; inactive = dim. Double-click to create. */}
      {zones.map((z) => {
        const active = activeZoneIds.has(z.id);
        return (
          <circle
            key={z.id}
            className="dot"
            cx={z.x * STAGE_W}
            cy={z.y * STAGE_H}
            r={active ? 4 : 3}
            fill={active ? '#1e1e32' : '#141420'}
            stroke={active ? 'var(--border-active)' : '#222230'}
            strokeWidth={active ? 1.5 : 1}
            onDoubleClick={() => onZoneActivate(z.id)}
          >
            <title>{z.label ?? z.id}</title>
          </circle>
        );
      })}
    </svg>
  );
}
