"use client";

import { useRef, useEffect, useState } from "react";
import { RadarItem, DOMAIN_COLORS, getScoreColor, formatScore } from "@/lib/api";

/**
 * Interactive Technology Radar built with D3-style SVG.
 * Concentric rings: Adopt → Trial → Assess → Hold
 * Quadrants: AI, Cybersecurity, AR/VR, Robotics, IoT
 */

const RINGS = ["adopt", "trial", "assess", "hold"];
const RING_LABELS = ["Adopt", "Trial", "Assess", "Hold"];
const RING_COLORS = [
  "rgba(16, 185, 129, 0.08)",
  "rgba(59, 130, 246, 0.06)",
  "rgba(245, 158, 11, 0.05)",
  "rgba(148, 163, 184, 0.03)",
];

const QUADRANTS = [
  { name: "Artificial Intelligence", angle: -90, color: "#3b82f6" },
  { name: "Cybersecurity", angle: 0, color: "#ef4444" },
  { name: "AR/VR", angle: 90, color: "#a855f7" },
  { name: "Robotics", angle: 180, color: "#f59e0b" },
];

interface TechRadarProps {
  items: RadarItem[];
  onSelect: (name: string) => void;
  selectedTech?: string | null;
}

export default function TechRadar({ items, onSelect, selectedTech }: TechRadarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; item: RadarItem } | null>(null);

  const cx = 400;
  const cy = 340;
  const maxR = 300;
  const ringRadii = [0.25, 0.50, 0.75, 1.0].map(f => f * maxR);

  // Position items on the radar using deterministic placement
  const getItemPosition = (item: RadarItem, index: number, totalInGroup: number) => {
    const ringIndex = RINGS.indexOf(item.ring);
    const quadIndex = QUADRANTS.findIndex(q => q.name === item.quadrant);
    if (ringIndex === -1 || quadIndex === -1) return null;

    // Ring band radii
    const innerR = ringIndex === 0 ? 30 : ringRadii[ringIndex - 1];
    const outerR = ringRadii[ringIndex];
    const midR = (innerR + outerR) / 2 + (index % 2 === 0 ? -15 : 15);

    // Quadrant angle range (each gets ~72° since 5 domains but using 4 quadrants)
    // Spread items evenly within quadrant
    const quadAngleStart = quadIndex * 90 - 45;
    const spreadAngle = 80 / (totalInGroup + 1);
    const angle = (quadAngleStart + spreadAngle * (index + 1)) * (Math.PI / 180);

    return {
      x: cx + Math.cos(angle) * midR,
      y: cy + Math.sin(angle) * midR,
    };
  };

  // Group items by quadrant+ring
  const grouped: Record<string, { items: RadarItem[]; quadrant: string; ring: string }> = {};
  items.forEach(item => {
    const key = `${item.quadrant}__${item.ring}`;
    if (!grouped[key]) grouped[key] = { items: [], quadrant: item.quadrant, ring: item.ring };
    grouped[key].items.push(item);
  });

  // IoT items get placed in the "Robotics" quadrant area with offset
  const getEffectiveQuadrant = (domain: string) => {
    if (domain === "IoT") return "Robotics";
    return domain;
  };

  return (
    <div className="glass-card" style={{ padding: "24px 16px", position: "relative" }}>
      <div className="card-header">
        <div>
          <div className="card-title" style={{ fontSize: 20 }}>🎯 Innovation Radar</div>
          <div className="card-subtitle">Real-time technology readiness mapping • Click any blip to explore</div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {QUADRANTS.map(q => (
            <div key={q.name} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: q.color }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: q.color }} />
              {q.name}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#10b981" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
            IoT
          </div>
        </div>
      </div>

      <svg width="100%" viewBox="0 0 800 700" style={{ maxHeight: 620 }}>
        <defs>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Radial gradient for rings */}
          <radialGradient id="radarGradient">
            <stop offset="0%" stopColor="rgba(59,130,246,0.08)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0)" />
          </radialGradient>
        </defs>

        {/* Ring backgrounds */}
        {ringRadii.map((r, i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill={RING_COLORS[i]}
              stroke="rgba(148,163,184,0.08)" strokeWidth={1} />
          </g>
        )).reverse()}

        {/* Cross lines for quadrants */}
        <line x1={cx} y1={cy - maxR - 10} x2={cx} y2={cy + maxR + 10}
          stroke="rgba(148,163,184,0.06)" strokeWidth={1} strokeDasharray="4 4" />
        <line x1={cx - maxR - 10} y1={cy} x2={cx + maxR + 10} y2={cy}
          stroke="rgba(148,163,184,0.06)" strokeWidth={1} strokeDasharray="4 4" />

        {/* Ring labels */}
        {RING_LABELS.map((label, i) => (
          <text key={label} x={cx + 6} y={cy - ringRadii[i] + 16}
            fill="rgba(148,163,184,0.4)" fontSize={11} fontFamily="Inter" fontWeight={500}>
            {label}
          </text>
        ))}

        {/* Quadrant labels */}
        <text x={cx} y={35} textAnchor="middle" fill="#3b82f6" fontSize={13} fontWeight={600} fontFamily="Inter">
          Artificial Intelligence
        </text>
        <text x={cx + maxR + 15} y={cy + 5} textAnchor="start" fill="#ef4444" fontSize={13} fontWeight={600} fontFamily="Inter">
          Cyber
        </text>
        <text x={cx} y={cy + maxR + 30} textAnchor="middle" fill="#a855f7" fontSize={13} fontWeight={600} fontFamily="Inter">
          AR/VR · Robotics · IoT
        </text>
        <text x={cx - maxR - 15} y={cy + 5} textAnchor="end" fill="#f59e0b" fontSize={13} fontWeight={600} fontFamily="Inter">
          Robotics
        </text>

        {/* Blips — Technology items */}
        {items.map((item, globalIdx) => {
          const effectiveQuadrant = getEffectiveQuadrant(item.quadrant);
          const groupKey = `${effectiveQuadrant}__${item.ring}`;
          const group = items.filter(i => getEffectiveQuadrant(i.quadrant) === effectiveQuadrant && i.ring === item.ring);
          const indexInGroup = group.indexOf(item);

          const modItem = { ...item, quadrant: effectiveQuadrant };
          const pos = getItemPosition(modItem, indexInGroup, group.length);
          if (!pos) return null;

          const color = DOMAIN_COLORS[item.quadrant] || "#6b7280";
          const isSelected = selectedTech === item.name;
          const isHovered = hoveredItem === item.name;
          const radius = isSelected ? 10 : isHovered ? 9 : 7;

          return (
            <g key={item.id}
              onClick={() => onSelect(item.name)}
              onMouseEnter={(e) => {
                setHoveredItem(item.name);
                setTooltip({ x: pos.x, y: pos.y, item });
              }}
              onMouseLeave={() => {
                setHoveredItem(null);
                setTooltip(null);
              }}
              style={{ cursor: "pointer" }}
            >
              {/* Pulse ring for selected/new */}
              {(isSelected || item.is_new) && (
                <circle cx={pos.x} cy={pos.y} r={radius + 4} fill="none" stroke={color} strokeWidth={1.5} opacity={0.4}>
                  <animate attributeName="r" from={radius + 2} to={radius + 12} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              {/* Glow background */}
              <circle cx={pos.x} cy={pos.y} r={radius + 3} fill={color} opacity={0.15} />
              {/* Main blip */}
              <circle cx={pos.x} cy={pos.y} r={radius} fill={color}
                opacity={isHovered || isSelected ? 1 : 0.85}
                filter={isSelected ? "url(#glow)" : undefined}
                style={{ transition: "all 0.2s" }}
              />
              {/* Label */}
              {(isHovered || isSelected) && (
                <text x={pos.x} y={pos.y - radius - 6} textAnchor="middle"
                  fill="var(--text-primary)" fontSize={11} fontWeight={600} fontFamily="Inter">
                  {item.name}
                </text>
              )}
              {/* New indicator */}
              {item.is_new && !isHovered && (
                <text x={pos.x} y={pos.y + radius + 12} textAnchor="middle"
                  fill={color} fontSize={8} fontFamily="Inter" opacity={0.7}>
                  ✨ NEW
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: "absolute",
          left: `calc(${(tooltip.x / 800) * 100}% - 80px)`,
          top: `calc(${(tooltip.y / 700) * 90}% + 40px)`,
          background: "rgba(15,23,42,0.95)",
          backdropFilter: "blur(12px)",
          border: `1px solid ${DOMAIN_COLORS[tooltip.item.quadrant] || "#6b7280"}40`,
          borderRadius: 10,
          padding: "12px 16px",
          minWidth: 180,
          zIndex: 100,
          pointerEvents: "none",
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
            {tooltip.item.name}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: "var(--text-muted)" }}>Domain</span>
            <span style={{ color: DOMAIN_COLORS[tooltip.item.quadrant] || "#6b7280" }}>{tooltip.item.quadrant}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
            <span style={{ color: "var(--text-muted)" }}>Ring</span>
            <span style={{ color: "var(--text-primary)", textTransform: "capitalize" }}>{tooltip.item.ring}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "var(--text-muted)" }}>Score</span>
            <span style={{ color: getScoreColor(tooltip.item.score), fontFamily: "JetBrains Mono", fontWeight: 600 }}>
              {formatScore(tooltip.item.score)}%
            </span>
          </div>
          <div style={{ height: 4, background: "rgba(148,163,184,0.1)", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${tooltip.item.score * 100}%`, background: getScoreColor(tooltip.item.score), borderRadius: 2 }} />
          </div>
        </div>
      )}
    </div>
  );
}
