"use client";

import { useState, useEffect } from "react";
import { api, MissionResponse, MissionRequest, MissionPath } from "@/lib/api";

interface AgenticMissionViewProps {
  initialGoal?: string;
}

export default function AgenticMissionView({ initialGoal = "" }: AgenticMissionViewProps) {
  const [goal, setGoal] = useState(initialGoal);
  const [depth, setDepth] = useState(3);
  const [risk, setRisk] = useState("low");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MissionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync if parent changes the initialGoal (e.g. user clicks Explore on a new signal)
  useEffect(() => {
    if (initialGoal) setGoal(initialGoal);
  }, [initialGoal]);

  const runMission = async () => {
    if (!goal.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.runMission({
        goal,
        constraints: {
          depth,
          risk,
          domain: domain || null,
        },
      });
      setResult(response);
    } catch (err: any) {
      setError(err?.message || "Failed to run mission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="glass-card">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <span style={{ fontSize: 22 }}>🎯</span>
          <div>
            <div className="card-title" style={{ marginBottom: 2 }}>Agentic Mission Control</div>
            <div className="card-subtitle">
              Dispatch the reasoning engine to discover high-value multi-step opportunities.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What is your mission? (e.g. Find cross-domain opportunities in AI and Healthcare)"
            style={{
              padding: "12px 16px", borderRadius: 8, border: "var(--glass-border)",
              background: "var(--bg-tertiary)", color: "var(--text-primary)",
              fontSize: 14, outline: "none", width: "100%",
            }}
            onKeyDown={(e) => { if (e.key === "Enter") runMission(); }}
          />

          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Depth:</span>
              <select
                value={depth} onChange={(e) => setDepth(Number(e.target.value))}
                style={{
                  background: "var(--bg-tertiary)", color: "var(--text-primary)", padding: "6px 12px",
                  borderRadius: 6, border: "var(--glass-border)", fontSize: 12, outline: "none"
                }}
              >
                <option value={3}>3 Hops</option>
                <option value={4}>4 Hops</option>
                <option value={5}>5 Hops</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Risk Profile:</span>
              <select
                value={risk} onChange={(e) => setRisk(e.target.value)}
                style={{
                  background: "var(--bg-tertiary)", color: "var(--text-primary)", padding: "6px 12px",
                  borderRadius: 6, border: "var(--glass-border)", fontSize: 12, outline: "none"
                }}
              >
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>

             <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Target Domain:</span>
              <input
                value={domain} onChange={(e) => setDomain(e.target.value)}
                placeholder="Any"
                style={{
                  background: "var(--bg-tertiary)", color: "var(--text-primary)", padding: "6px 12px", width: 120,
                  borderRadius: 6, border: "var(--glass-border)", fontSize: 12, outline: "none"
                }}
              />
            </div>
            
            <button
              onClick={runMission}
              disabled={loading || !goal.trim()}
              className="header-btn primary"
              style={{ marginLeft: "auto", fontSize: 13, padding: "8px 16px" }}
            >
              {loading ? "⏳ Exploring Graph..." : "🚀 Launch Mission"}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-card" style={{ borderColor: "rgba(239, 68, 68, 0.4)", color: "var(--accent-rose)" }}>
          {error}
        </div>
      )}

      {result && !loading && (
        <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Metadata Bar */}
          <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
            <div className="glass-card" style={{ padding: "8px 16px", borderRadius: 8 }}>
              🛤️ {result.metadata.total_paths_explored} paths evaluated
            </div>
            <div className="glass-card" style={{ padding: "8px 16px", borderRadius: 8 }}>
              ⏱️ {result.metadata.processing_time}s inference time
            </div>
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 600 }}>Optimal Paths & Opportunities</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {result.paths.map((path: MissionPath, idx: number) => (
              <div key={idx} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: 20, borderLeft: "4px solid var(--accent-emerald)", position: "relative" }}>
                
                {/* Visual Path Mapping */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", paddingBottom: 16, borderBottom: "1px solid var(--border-color)" }}>
                  {path.nodes.map((node, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="tech-badge" style={{ background: "rgba(59, 130, 246, 0.1)", color: "var(--accent-blue)", padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                        {node}
                      </span>
                      {i < path.nodes.length - 1 && <span style={{ color: "var(--text-muted)", fontSize: 18, opacity: 0.5 }}>→</span>}
                    </div>
                  ))}
                  
                  <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Conviction</div>
                      <div style={{ color: "var(--accent-emerald)", fontWeight: 700, fontSize: 18, fontFamily: "JetBrains Mono" }}>{(path.conviction.conviction_score * 100).toFixed(0)}%</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Causality</div>
                      <div style={{ color: "var(--accent-blue)", fontWeight: 700, fontSize: 18, fontFamily: "JetBrains Mono" }}>{(path.conviction.causality_score * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }}>
                  
                  {/* Left Column: Strategic Logic */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--accent-cyan)", fontWeight: 700, textTransform: "uppercase", marginBottom: 6, letterSpacing: "0.05em" }}>Strategic Intelligence</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "white", marginBottom: 6 }}>{path.insight}</div>
                      <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)" }}>{path.why_this_matters}</div>
                    </div>

                    <div style={{ padding: "14px", background: "rgba(245, 158, 11, 0.05)", borderRadius: 10, border: "1px solid rgba(245, 158, 11, 0.15)" }}>
                      <div style={{ fontSize: 10, color: "var(--accent-amber)", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Contrarian Edge</div>
                      <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text-primary)" }}>{path.contrarian}</div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div className="glass-card" style={{ padding: 12, background: "rgba(255,255,255,0.02)" }}>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Market Insight</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                          <div><span style={{ color: "var(--text-muted)" }}>TAM:</span> <span style={{ color: "white" }}>{path.market_insight.estimated_market_size}</span></div>
                          <div><span style={{ color: "var(--text-muted)" }}>Window:</span> <span style={{ color: "var(--accent-emerald)" }}>{path.market_insight.adoption_window}</span></div>
                          <div><span style={{ color: "var(--text-muted)" }}>Buyer:</span> <span style={{ color: "white" }}>{path.market_insight.buyer}</span></div>
                        </div>
                      </div>

                      <div className="glass-card" style={{ padding: 12, background: "rgba(255,255,255,0.02)" }}>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Why Others Miss</div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.4 }}>
                          "{path.why_others_miss_this}"
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                       <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg-tertiary)", padding: "4px 10px", borderRadius: 20 }}>Evidence Backed</span>
                       <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg-tertiary)", padding: "4px 10px", borderRadius: 20 }}>{path.data_sources_used.length} Sources</span>
                       <span style={{ fontSize: 11, color: "var(--text-muted)", background: "var(--bg-tertiary)", padding: "4px 10px", borderRadius: 20 }}>Timing: {(path.conviction.timing_score * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Right Column: Execution & Moat */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    
                    {/* Competitive Landscape */}
                    <div style={{ background: "rgba(168, 85, 247, 0.05)", padding: 16, borderRadius: 12, border: "1px solid rgba(168, 85, 247, 0.15)" }}>
                      <div style={{ fontSize: 10, color: "var(--accent-purple)", fontWeight: 700, textTransform: "uppercase", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                        <span>🛡️ Competitive Moat</span>
                        <span style={{ color: "var(--text-muted)" }}>{path.competition.funding_activity}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Existing Landscape</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {path.competition.existing_startups.map((s, i) => (
                              <span key={i} style={{ fontSize: 11, color: "white", border: "1px solid rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: 4 }}>{s}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>Competitor Blindspot</div>
                          <div style={{ fontSize: 12, color: "var(--accent-indigo)" }}>{path.competition.competitor_blindspot}</div>
                        </div>
                      </div>
                    </div>

                    {/* Execution Feasibility */}
                    <div style={{ background: "rgba(59, 130, 246, 0.05)", padding: 16, borderRadius: 12, border: "1px solid rgba(59, 130, 246, 0.15)" }}>
                      <div style={{ fontSize: 10, color: "var(--accent-blue)", fontWeight: 700, textTransform: "uppercase", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                        <span>🏗️ Execution Feasibility</span>
                        <span style={{ color: path.feasibility.build_complexity === "high" ? "var(--accent-rose)" : "var(--accent-emerald)" }}>{path.feasibility.build_complexity} complexity</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Talent Needed</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {path.feasibility.talent_requirements.map((t, i) => (
                              <div key={i} style={{ fontSize: 11, color: "var(--text-secondary)" }}>• {t}</div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Time to Market</div>
                          <div style={{ fontSize: 12, color: "white", fontWeight: 600 }}>{path.feasibility.time_to_market}</div>
                          <div style={{ marginTop: 8 }}>
                            <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4 }}>Core Stack</div>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {path.feasibility.tech_stack.slice(0, 2).map((s, i) => (
                                <span key={i} style={{ fontSize: 9, background: "var(--bg-tertiary)", padding: "2px 4px", borderRadius: 3 }}>{s}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Startup Idea Summary */}
                    <div style={{ padding: 14, background: "var(--bg-tertiary)", borderRadius: 10, border: "1px solid var(--border-color)", cursor: "pointer" }} onClick={() => {
                        api.submitFeedback({ mission_id: result.metadata.mission_id || "m1", path_id: path.id, rating: 1 });
                        alert("Added to saved opportunities!");
                    }}>
                        <div style={{ fontSize: 10, color: "var(--accent-emerald)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>💡 Core Venture Opportunity</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{path.startup_idea.startup_idea}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Click to save for deep-dive →</div>
                    </div>
                  </div>
                </div>

                {/* Footer Analysis */}
                <div style={{ display: "flex", gap: 16, paddingTop: 12, borderTop: "1px solid var(--border-color)", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 16 }}>
                        <div style={{ fontSize: 11 }}>
                            <span style={{ color: "var(--text-muted)" }}>Strongest Node:</span> <span style={{ color: "var(--accent-emerald)" }}>{path.path_analysis.strongest_node}</span>
                        </div>
                        <div style={{ fontSize: 11 }}>
                            <span style={{ color: "var(--text-muted)" }}>Weakest Link:</span> <span style={{ color: "var(--accent-rose)" }}>{path.path_analysis.weakest_link}</span>
                        </div>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
                        Conviction explanation: "{path.conviction.explanation}"
                    </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
