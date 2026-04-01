"use client";

import { useState } from "react";
import { api, StartupRoadmap } from "@/lib/api";

export default function StartBuddyView() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<StartupRoadmap | null>(null);

  const fetchRoadmap = async () => {
    if (!idea) return;
    setLoading(true);
    try {
      const result = await api.getStartBuddyyy(idea);
      setRoadmap(result);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Strategy Input */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>🤝 StartBuddy Strategist</h3>
        <div style={{ display: "flex", gap: 12 }}>
          <input type="text" className="nav-item" value={idea} onChange={e => setIdea(e.target.value)} 
            placeholder="What are you building? (e.g., decentralized cloud node)" style={{ flex: 1, background: "var(--page-bg)", border: "var(--glass-border)", color: "var(--text-heading)" }} />
          <button className="header-btn primary" onClick={fetchRoadmap} disabled={loading} style={{ height: 42, padding: "0 24px" }}>
            {loading ? "🔍 Strategizing..." : "🗺️ Generate Roadmap"}
          </button>
        </div>
      </div>

      {/* Results */}
      {roadmap && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: 24 }}>
           {/* Left Core Strategy */}
           <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div className="glass-card">
                 <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 12 }}>{roadmap.title}</h2>
                 <p style={{ color: "var(--text-body)", lineHeight: 1.6 }}>{roadmap.summary}</p>
                 
                 <div style={{ marginTop: 24, padding: 16, background: "rgba(59,130,246,0.05)", borderRadius: 12, border: "1px solid rgba(59,130,246,0.2)" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--accent-blue)", marginBottom: 8, textTransform: "uppercase" }}>🏗️ Architecture Suggestion</div>
                    <div style={{ fontSize: 14, color: "var(--text-heading)", fontWeight: 600 }}>{roadmap.architecture_suggestion}</div>
                 </div>
              </div>

              {/* Timeline Roadmap */}
              <div className="glass-card">
                 <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 20 }}>Timeline (12 Week Sync)</h3>
                 <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {roadmap.roadmap.map((step, i) => (
                      <div key={i} style={{ display: "flex", gap: 16, position: "relative" }}>
                         {i < roadmap.roadmap.length - 1 && (
                           <div style={{ position: "absolute", left: 16, top: 32, bottom: -16, width: 2, background: "var(--border-color)", borderLeft: "2px dashed var(--border-color)" }} />
                         )}
                         <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent-blue)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "white", flexShrink: 0, zIndex: 1 }}>{i + 1}</div>
                         <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                               <div style={{ fontWeight: 800 }}>{step.phase}</div>
                               <div style={{ fontSize: 11, color: "var(--text-muted)", background: "rgba(148,163,184,0.1)", padding: "2px 8px", borderRadius: 4 }}>{step.timeline}</div>
                            </div>
                            <div style={{ fontSize: 13, color: "var(--text-body)" }}>
                               {step.tasks.map((t, idx) => <span key={idx}>• {t} </span>)}
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Right Metadata */}
           <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div className="glass-card">
                 <div style={{ fontSize: 24, fontWeight: 900, color: "var(--accent-emerald)" }}>{(roadmap.potential_score).toFixed(1)}</div>
                 <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 16 }}>Startup Potential Score</div>
                 
                 <Section title="Prerequisites" items={roadmap.prerequisites.skills} icon="🛠️" />
                 <div style={{ height: 16 }} />
                 <Section title="Monetization" items={roadmap.monetization} icon="💰" />
              </div>

              <div className="glass-card">
                 <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>🛡️ Common Mistakes</h3>
                 <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {roadmap.common_mistakes.map((m, i) => (
                      <div key={i} style={{ fontSize: 12, color: "var(--accent-rose)", display: "flex", gap: 8 }}>
                         <span>🚫</span> <span>{m}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="glass-card">
                 <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>🚀 Growth Strategy</h3>
                 <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Early Users:</div>
                 <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                    {roadmap.growth_strategy.early_users.map(u => <span key={u} style={{ padding: "4px 10px", background: "rgba(148,163,184,0.1)", borderRadius: 6 }}>{u}</span>)}
                 </div>
                 <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Marketing:</div>
                 <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {roadmap.growth_strategy.marketing.map(m => <span key={m} style={{ padding: "4px 10px", background: "rgba(148,163,184,0.1)", borderRadius: 6 }}>{m}</span>)}
                 </div>
              </div>
           </div>
        </div>
      )}
      {!loading && !roadmap && (
          <div className="glass-card full-width" style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
            🤝 Describe your mission above to generate a high-fidelity execution roadmap.
          </div>
      )}
    </div>
  );
}

function Section({ icon, title, items }: { icon: string; title: string; items: string[] }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-heading)", marginBottom: 8 }}>{icon} {title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map(item => (
          <span key={item} style={{ fontSize: 11, padding: "4px 10px", background: "rgba(148,163,184,0.1)", borderRadius: 6, border: "1px solid rgba(148,163,184,0.15)" }}>{item}</span>
        ))}
      </div>
    </div>
  );
}
