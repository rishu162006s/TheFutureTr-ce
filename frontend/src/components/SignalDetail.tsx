"use client";

import { useState } from "react";
import { ScoredSignal, DOMAIN_COLORS, getDomainClass, getScoreColor, formatScore } from "@/lib/api";

/**
 * Signal Detail Modal — Full drill-down into a scored signal.
 * Shows score breakdown radar, evidence list, and source analysis.
 */

interface SignalDetailProps {
  signal: ScoredSignal;
  onClose: () => void;
  onExplore: (tech: string) => void;
}

export default function SignalDetail({ signal, onClose, onExplore }: SignalDetailProps) {
  const color = DOMAIN_COLORS[signal.domain] || "#6b7280";
  const factors = [
    { key: "novelty", label: "Novelty", value: signal.score?.novelty || 0, desc: "How new/fresh this signal is", icon: "🆕" },
    { key: "velocity", label: "Velocity", value: signal.score?.velocity || 0, desc: "Rate of mention growth", icon: "🚀" },
    { key: "credibility", label: "Credibility", value: signal.score?.credibility || 0, desc: "Source authority weight", icon: "✅" },
    { key: "cross_source", label: "Cross-Source", value: signal.score?.cross_source || 0, desc: "Multi-source validation", icon: "🔗" },
  ];

  // SVG radar chart for score breakdown
  const radarPoints = factors.map((f, i) => {
    const angle = (i / factors.length) * 2 * Math.PI - Math.PI / 2;
    const r = (f.value || 0) * 80;
    return { x: 100 + Math.cos(angle) * r, y: 100 + Math.sin(angle) * r };
  });
  const radarPath = radarPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
    }} onClick={onClose}>
      <div style={{
        width: "min(90vw, 720px)", maxHeight: "85vh", overflow: "auto",
        background: "var(--card-bg)", border: `1px solid ${color}30`,
        borderRadius: 16, boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
      }} onClick={e => e.stopPropagation()}>
        {/* Header bar */}
        <div style={{
          padding: "20px 28px", borderBottom: "1px solid var(--border-color)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: `linear-gradient(135deg, ${color}10 0%, transparent 100%)`,
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-heading)" }}>{signal.technology}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <span className={`domain-badge ${getDomainClass(signal.domain)}`}>{signal.domain}</span>
              <span className={`maturity-badge ${signal.maturity}`}>{signal.maturity || "ASSESS"}</span>
              <span style={{
                padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: signal.classification === "signal" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                color: signal.classification === "signal" ? "var(--accent-emerald)" : "var(--accent-amber)",
              }}>
                {signal.classification === "signal" ? "🟢 SIGNAL" : "🟡 WEAK SIGNAL"}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "var(--bg-card)", border: "var(--glass-border)", borderRadius: 8,
            color: "var(--text-body)", padding: "8px 12px", cursor: "pointer", fontSize: 16,
          }}>✕</button>
        </div>

        <div style={{ padding: "24px 28px" }}>
          {/* Composite Score */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>
              Composite Score
            </div>
            <div style={{
              fontSize: 56, fontWeight: 800, fontFamily: "JetBrains Mono",
              color: getScoreColor(signal.score?.composite || 0),
              lineHeight: 1.1, marginTop: 4,
            }}>
              {formatScore(signal.score?.composite || 0)}%
            </div>
            <div style={{
              width: "100%", height: 6, background: "rgba(148,163,184,0.1)",
              borderRadius: 3, marginTop: 12, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 3,
                width: `${(signal.score?.composite || 0) * 100}%`,
                background: `linear-gradient(90deg, ${color}, ${getScoreColor(signal.score?.composite || 0)})`,
                transition: "width 0.8s ease",
              }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 28 }}>
            {/* Radar Chart */}
            <div>
              <svg viewBox="0 0 200 200" width="100%">
                {/* Grid rings */}
                {[0.25, 0.5, 0.75, 1.0].map((r, i) => (
                  <polygon key={i}
                    points={factors.map((_, j) => {
                      const angle = (j / factors.length) * 2 * Math.PI - Math.PI / 2;
                      return `${100 + Math.cos(angle) * 80 * r},${100 + Math.sin(angle) * 80 * r}`;
                    }).join(" ")}
                    fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth={1}
                  />
                ))}
                {/* Axis lines */}
                {factors.map((_, i) => {
                  const angle = (i / factors.length) * 2 * Math.PI - Math.PI / 2;
                  return <line key={i} x1={100} y1={100}
                    x2={100 + Math.cos(angle) * 85} y2={100 + Math.sin(angle) * 85}
                    stroke="rgba(148,163,184,0.08)" strokeWidth={1} />;
                })}
                {/* Data polygon */}
                <path d={radarPath} fill={`${color}20`} stroke={color} strokeWidth={2} />
                {/* Data points */}
                {radarPoints.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r={4} fill={color} />
                ))}
                {/* Labels */}
                {factors.map((f, i) => {
                  const angle = (i / factors.length) * 2 * Math.PI - Math.PI / 2;
                  const lx = 100 + Math.cos(angle) * 98;
                  const ly = 100 + Math.sin(angle) * 98;
                  return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                    fill="var(--text-muted)" fontSize={9} fontFamily="Inter">{f.label}</text>;
                })}
              </svg>
            </div>

            {/* Factor Breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {factors.map(f => (
                <div key={f.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-heading)" }}>
                      {f.icon} {f.label}
                    </span>
                    <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 600, color: getScoreColor(f.value) }}>
                      {(f.value * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ height: 6, background: "rgba(148,163,184,0.08)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 3,
                      width: `${f.value * 100}%`,
                      background: getScoreColor(f.value),
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Opportunity & Risk */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, margin: "24px 0" }}>
            <div style={{
              background: "rgba(16,185,129,0.06)", borderRadius: 12, padding: 20,
              border: "1px solid rgba(16,185,129,0.1)",
            }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Opportunity Score</div>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 32, fontWeight: 800, color: "var(--accent-emerald)", marginTop: 4 }}>
                {((signal.opportunity_score || 0) * 100).toFixed(0)}%
              </div>
              <div style={{ fontSize: 12, color: "var(--text-body)", marginTop: 4 }}>
                Based on signal strength × inverse maturity
              </div>
            </div>
            <div style={{
              background: "rgba(245,158,11,0.06)", borderRadius: 12, padding: 20,
              border: "1px solid rgba(245,158,11,0.1)",
            }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase" }}>Risk Level</div>
              <div style={{ fontFamily: "JetBrains Mono", fontSize: 32, fontWeight: 800, color: "var(--accent-amber)", marginTop: 4 }}>
                {((signal.risk_level || 0) * 100).toFixed(0)}%
              </div>
              <div style={{ fontSize: 12, color: "var(--text-body)", marginTop: 4 }}>
                Maturity + source diversity + credibility
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div style={{
            background: "rgba(59,130,246,0.04)", borderRadius: 12, padding: 16,
            border: "1px solid rgba(59,130,246,0.08)", marginBottom: 20,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-blue)", marginBottom: 6 }}>
              🧠 Why this is a {signal.classification === "signal" ? "Signal" : "Weak Signal"}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-body)", lineHeight: 1.6 }}>
              {signal.explanation || "N/A"}
            </div>
          </div>

          {/* Evidence */}
          {(signal.evidence?.length || 0) > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-heading)", marginBottom: 8 }}>
                📎 Evidence Sources ({signal.evidence?.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {signal.evidence?.slice(0, 5).map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener" style={{
                    fontSize: 12, color: "var(--accent-cyan)", textDecoration: "none",
                    padding: "6px 10px", background: "var(--bg-card)", borderRadius: 6,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    🔗 {url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Action */}
          <button onClick={() => { onExplore(signal.technology); onClose(); }} style={{
            width: "100%", marginTop: 20, padding: "14px", borderRadius: 12,
            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
            color: "white", fontSize: 14, fontWeight: 600, cursor: "pointer",
            border: "none", fontFamily: "Inter",
            boxShadow: `0 4px 20px ${color}40`,
          }}>
            🕳️ Explore Rabbit Hole from {signal.technology}
          </button>
        </div>

      </div>
    </div>
  );
}
