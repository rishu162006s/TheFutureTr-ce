"use client";

import { DOMAIN_COLORS, getScoreColor } from "@/lib/api";

/**
 * Time × Domain trend heatmap visualization.
 * Shows intensity of signal activity across time and technology domains.
 */

interface HeatmapProps {
  data: {
    technology: string;
    domain: string;
    historical: { date: string; value: number }[];
  }[];
}

export default function TrendHeatmap({ data }: HeatmapProps) {
  if (!data || data.length === 0) return null;

  // Build heatmap grid: rows = technologies, columns = dates
  const allDates = new Set<string>();
  data.forEach(d => d.historical.forEach(h => allDates.add(h.date)));
  const dates = Array.from(allDates).sort().slice(-14); // Last 14 days

  // Get max value for normalization
  let maxValue = 0;
  data.forEach(d => d.historical.forEach(h => { if (h.value > maxValue) maxValue = h.value; }));
  maxValue = maxValue || 1;

  return (
    <div className="glass-card" style={{ overflow: "auto" }}>
      <div className="card-header">
        <div>
          <div className="card-title">🗓️ Signal Activity Heatmap</div>
          <div className="card-subtitle">Intensity of technology signals over time</div>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--text-muted)" }}>
          <span>Low</span>
          <div style={{ display: "flex", gap: 1 }}>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
              <div key={v} style={{
                width: 12, height: 12, borderRadius: 2,
                background: getHeatColor(v),
              }} />
            ))}
          </div>
          <span>High</span>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 3 }}>
          <thead>
            <tr>
              <th style={{
                textAlign: "left", padding: "6px 12px", fontSize: 11,
                color: "var(--text-muted)", fontWeight: 500, position: "sticky", left: 0,
                background: "var(--bg-card)", zIndex: 1,
              }}>Technology</th>
              {dates.map(date => (
                <th key={date} style={{
                  padding: "6px 2px", fontSize: 9, color: "var(--text-muted)",
                  fontWeight: 400, textAlign: "center", fontFamily: "JetBrains Mono",
                }}>
                  {date.slice(5)} {/* MM-DD */}
                </th>
              ))}
              <th style={{ padding: "6px 12px", fontSize: 11, color: "var(--text-muted)", fontWeight: 500, textAlign: "right" }}>
                Trend
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((tech, rowIdx) => {
              const color = DOMAIN_COLORS[tech.domain] || "#6b7280";
              const values = dates.map(date => {
                const point = tech.historical.find(h => h.date === date);
                return point ? point.value : 0;
              });
              // Simple trend: compare last 3 vs first 3
              const recent = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
              const older = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3 || 0.01;
              const trendPct = ((recent - older) / older * 100);

              return (
                <tr key={`${tech.technology}-${rowIdx}`}>
                  <td style={{
                    padding: "6px 12px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                    color: "var(--text-primary)", position: "sticky", left: 0,
                    background: "var(--bg-card)", zIndex: 1,
                    borderLeft: `3px solid ${color}`,
                  }}>
                    {tech.technology}
                  </td>
                  {values.map((val, colIdx) => {
                    const normalized = val / maxValue;
                    return (
                      <td key={colIdx} style={{ padding: 0 }}>
                        <div
                          className="heatmap-cell"
                          title={`${tech.technology} • ${dates[colIdx]} • ${(val * 100).toFixed(0)}%`}
                          style={{
                            background: getHeatColor(normalized),
                            color: normalized > 0.6 ? "white" : "transparent",
                            minWidth: 32,
                          }}
                        >
                          {normalized > 0.5 ? (val * 100).toFixed(0) : ""}
                        </div>
                      </td>
                    );
                  })}
                  <td style={{ padding: "6px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <span style={{
                      fontFamily: "JetBrains Mono", fontSize: 12, fontWeight: 600,
                      color: trendPct > 5 ? "var(--accent-emerald)" : trendPct < -5 ? "var(--accent-rose)" : "var(--text-muted)",
                    }}>
                      {trendPct > 0 ? "↑" : trendPct < 0 ? "↓" : "→"} {Math.abs(trendPct).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getHeatColor(value: number): string {
  if (value < 0.05) return "rgba(148,163,184,0.03)";
  if (value < 0.2) return "rgba(59,130,246,0.08)";
  if (value < 0.35) return "rgba(59,130,246,0.18)";
  if (value < 0.5) return "rgba(6,182,212,0.28)";
  if (value < 0.65) return "rgba(16,185,129,0.38)";
  if (value < 0.8) return "rgba(245,158,11,0.48)";
  return "rgba(239,68,68,0.55)";
}
