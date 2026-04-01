"use client";

import { GraphNode, RabbitHoleResult, DOMAIN_COLORS, getDomainClass } from "@/lib/api";

interface RabbitHolePanelProps {
  result: RabbitHoleResult | null;
  history: string[];
  loading: boolean;
  onBreadcrumbClick: (tech: string, idx: number) => void;
  onExploreDeeperClick: (tech: string) => void;
  onBack: () => void;
  onReset: () => void;
}

export default function RabbitHolePanel({
  result,
  history,
  loading,
  onBreadcrumbClick,
  onExploreDeeperClick,
  onBack,
  onReset,
}: RabbitHolePanelProps) {
  if (loading) {
    return (
      <div className="glass-card" style={{ height: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              height: i === 0 ? 32 : 60,
              background: "var(--bg-tertiary)",
              borderRadius: 8,
              animation: "pulse 1.5s ease-in-out infinite",
              opacity: 0.6,
            }}
          />
        ))}
      </div>
    );
  }

  if (!result) {
    return (
      <div
        className="glass-card"
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          textAlign: "center",
          padding: 32,
        }}
      >
        <div style={{ fontSize: 48, opacity: 0.2 }}>🕳️</div>
        <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Pick a technology to start<br />drilling down into connections
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", opacity: 0.6 }}>
          Each click goes one level deeper
        </div>
      </div>
    );
  }

  const currentTech = result.start_node;
  const currentNode = result.nodes.find((n) => n.id === currentTech);
  const neighbours = result.nodes
    .filter((n) => n.id !== currentTech)
    .sort((a, b) => (b.metadata?.relevance ?? 0) - (a.metadata?.relevance ?? 0));
  const topNeighbour = neighbours[0];
  const crossDomainCount = new Set(result.nodes.map((n) => n.domain)).size - 1;

  return (
    <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 0, padding: 0, overflow: "hidden" }}>
      {/* Header with back/reset */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {history.length > 1 && (
            <button
              onClick={onBack}
              className="header-btn"
              style={{ fontSize: 12, padding: "4px 10px" }}
            >
              ← Back
            </button>
          )}
          <button
            onClick={onReset}
            className="header-btn"
            style={{ fontSize: 12, padding: "4px 10px" }}
          >
            ✕ Reset
          </button>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Depth {history.length - 1}
        </div>
      </div>

      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", flex: 1 }}>
        {/* Breadcrumb trail */}
        {history.length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              Exploration Path
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
              {history.map((tech, idx) => (
                <span key={idx} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {idx > 0 && (
                    <span style={{ color: "var(--text-muted)", fontSize: 10 }}>→</span>
                  )}
                  <span
                    onClick={() => onBreadcrumbClick(tech, idx)}
                    style={{
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      cursor: "pointer",
                      fontWeight: idx === history.length - 1 ? 700 : 400,
                      background:
                        idx === history.length - 1
                          ? "rgba(59,130,246,0.15)"
                          : "var(--bg-tertiary)",
                      color:
                        idx === history.length - 1
                          ? "var(--accent-blue)"
                          : "var(--text-secondary)",
                      transition: "background 0.15s",
                    }}
                    title={`Jump back to ${tech}`}
                  >
                    {tech}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Current node card */}
        {currentNode && (
          <div
            style={{
              background: "var(--bg-tertiary)",
              borderRadius: 12,
              padding: 16,
              borderLeft: `4px solid ${DOMAIN_COLORS[currentNode.domain] || "#6b7280"}`,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
              {currentNode.label}
            </div>
            <span className={`domain-badge ${getDomainClass(currentNode.domain)}`}>
              {currentNode.domain}
            </span>

            {/* Signal strength bar */}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                <span>Signal Strength</span>
                <span style={{ fontFamily: "JetBrains Mono", color: "var(--accent-emerald)" }}>
                  {(currentNode.signal_strength * 100).toFixed(0)}%
                </span>
              </div>
              <div style={{ height: 4, background: "rgba(148,163,184,0.1)", borderRadius: 2, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${currentNode.signal_strength * 100}%`,
                    background: "var(--accent-emerald)",
                    borderRadius: 2,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>

            {/* Maturity */}
            {currentNode.metadata?.maturity && (
              <div style={{ marginTop: 8, fontSize: 11 }}>
                <span style={{ color: "var(--text-muted)" }}>Maturity: </span>
                <span
                  className={`maturity-badge ${currentNode.metadata.maturity}`}
                  style={{ marginLeft: 4 }}
                >
                  {currentNode.metadata.maturity}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { value: result.total_nodes_explored, label: "Connected", color: "var(--accent-blue)" },
            { value: result.max_depth_reached, label: "Max Depth", color: "var(--accent-purple)" },
            { value: crossDomainCount, label: "Cross-Domain", color: "var(--accent-amber)" },
          ].map(({ value, label, color }) => (
            <div
              key={label}
              style={{ background: "var(--bg-tertiary)", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "JetBrains Mono", color }}>
                {value}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Top related technologies */}
        {neighbours.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>
              🔗 Most Related Technologies
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {neighbours.slice(0, 5).map((node, i) => {
                const rel = (node.metadata?.relevance ?? 0) * 100;
                const col = DOMAIN_COLORS[node.domain] || "#6b7280";
                return (
                  <div
                    key={node.id}
                    onClick={() => onExploreDeeperClick(node.id)}
                    style={{
                      padding: "10px 12px",
                      background: "var(--bg-tertiary)",
                      borderRadius: 8,
                      cursor: "pointer",
                      border: "1px solid transparent",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget.style.borderColor = col + "55"))}
                    onMouseLeave={(e) => ((e.currentTarget.style.borderColor = "transparent"))}
                    title={`Drill into ${node.label}`}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: col, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{node.label}</span>
                      </div>
                      <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: col }}>
                        {rel.toFixed(0)}%
                      </span>
                    </div>
                    <div style={{ height: 3, background: "rgba(148,163,184,0.08)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${rel}%`, background: col, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>
                      {node.domain} · Click to drill deeper →
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Insights */}
        {result.insights && result.insights.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>
              💡 AI Insights
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {result.insights.map((insight, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    padding: "10px 12px",
                    background: "rgba(59,130,246,0.04)",
                    borderRadius: 8,
                    borderLeft: "3px solid var(--accent-blue)",
                    lineHeight: 1.6,
                  }}
                >
                  {insight}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explore deeper CTA */}
        {topNeighbour && (
          <button
            onClick={() => onExploreDeeperClick(topNeighbour.id)}
            className="header-btn primary"
            style={{ width: "100%", justifyContent: "center", fontSize: 13, padding: "10px" }}
          >
            Go deeper into "{topNeighbour.label}" →
          </button>
        )}
      </div>
    </div>
  );
}
