"use client";

import { useState } from "react";
import { api, StartupIdea, getScoreColor } from "@/lib/api";

export default function IdeaMelaView() {
  const [interests, setInterests] = useState("");
  const [skills, setSkills] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<StartupIdea[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generate = async () => {
    if (!interests.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      // Fix #13: no more `as any` cast — properly typed
      const results = await api.getIdeaMela({ interests, skills, domain });
      setIdeas(results);
    } catch (e: any) {
      setErrorMsg(e?.message ?? "Failed to generate ideas. Is the backend running?");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Search Bar */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>🎡 IdeaMela Catalyst</h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
          Enter your interests and skills — IdeaMela synthesises signal-grounded startup ideas from live tech trends.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>Interests *</div>
            <input
              type="text" className="nav-item" value={interests}
              onChange={e => setInterests(e.target.value)}
              onKeyDown={e => e.key === "Enter" && generate()}
              placeholder="e.g., ai, healthcare, robotics"
              style={{ width: "100%", background: "var(--page-bg)", border: "var(--glass-border)", color: "var(--text-heading)" }}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>Your Skills</div>
            <input
              type="text" className="nav-item" value={skills}
              onChange={e => setSkills(e.target.value)}
              placeholder="e.g., coding, UX design"
              style={{ width: "100%", background: "var(--page-bg)", border: "var(--glass-border)", color: "var(--text-heading)" }}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>Target Industry</div>
            <input
              type="text" className="nav-item" value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="e.g., Finance, Energy"
              style={{ width: "100%", background: "var(--page-bg)", border: "var(--glass-border)", color: "var(--text-heading)" }}
            />
          </div>
          <button className="header-btn primary" onClick={generate} disabled={loading} style={{ height: 42, padding: "0 24px" }}>
            {loading ? "🔍 Synthesizing..." : "🚀 Generate Ideas"}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="glass-card" style={{ borderColor: "rgba(239,68,68,0.3)", color: "var(--accent-rose)", padding: 16 }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Results */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 20 }}>
        {ideas.map((idea, i) => (
          <div key={idea.id ?? i} className="glass-card" style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "var(--accent-blue)" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>💡 {idea.title}</div>
                {/* Fix #12: optional chaining for fields that may not exist in simple startup-ideas response */}
                {idea.insight_tags && idea.insight_tags.length > 0 && (
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    {idea.insight_tags.map(tag => (
                      <span key={tag} style={{ fontSize: 10, padding: "2px 8px", background: "rgba(59,130,246,0.1)", color: "var(--accent-blue)", borderRadius: 4 }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              {idea.potential_score != null && (
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: getScoreColor(idea.potential_score / 10) }}>
                    {idea.potential_score.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase" }}>Potential</div>
                </div>
              )}
              {idea.opportunity_score != null && idea.potential_score == null && (
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: getScoreColor(idea.opportunity_score) }}>
                    {(idea.opportunity_score * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase" }}>Opportunity</div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Section icon="🎯" title="The Problem" text={idea.problem} />
              <Section icon="💡" title="The Solution" text={idea.solution} />
              <Section icon="👥" title="Target Audience" text={idea.target_audience ?? idea.target_market ?? ""} />

              {/* Blue Ocean Ideas */}
              {idea.blue_ocean_ideas && idea.blue_ocean_ideas.length > 0 && (
                <div style={{ padding: "12px", background: "rgba(16,185,129,0.05)", borderRadius: 8, border: "1px dashed rgba(16,185,129,0.2)" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--accent-emerald)", marginBottom: 4 }}>🏗️ Blue Ocean Idea</div>
                  {idea.blue_ocean_ideas.map((b, idx) => (
                    <div key={idx} style={{ fontSize: 12, color: "var(--text-heading)", marginBottom: 2 }}>• {b}</div>
                  ))}
                </div>
              )}

              {/* Technologies */}
              {idea.technologies && idea.technologies.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase" }}>Technologies Required</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {idea.technologies.map((t, idx) => (
                      <div key={idx} style={{ padding: "4px 10px", background: "rgba(148,163,184,0.08)", borderRadius: 6, fontSize: 11 }}>
                        <span style={{ fontWeight: 700, marginRight: 6 }}>{t.category}:</span>
                        {t.stack.join(", ")}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Simple risk_factors for /api/startup-ideas fallback */}
              {idea.risk_factors && idea.risk_factors.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase" }}>Risk Factors</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {idea.risk_factors.map((r, idx) => (
                      <span key={idx} style={{ padding: "3px 8px", background: "rgba(239,68,68,0.1)", color: "var(--accent-rose)", borderRadius: 4, fontSize: 11 }}>⚠️ {r}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
              {idea.difficulty && (
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Difficulty: <span style={{ color: "white" }}>{idea.difficulty}</span>
                </span>
              )}
              {idea.estimated_tam && (
                <span style={{ fontSize: 12, color: "var(--accent-emerald)", fontWeight: 700 }}>TAM: {idea.estimated_tam}</span>
              )}
            </div>
          </div>
        ))}
        {!loading && ideas.length === 0 && !errorMsg && (
          <div className="glass-card" style={{ textAlign: "center", padding: 60, color: "var(--text-muted)", gridColumn: "1 / -1" }}>
            🎡 Enter your interests above to synthesise signal-grounded startup ideas.
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ icon, title, text }: { icon: string; title: string; text: string }) {
  if (!text) return null;
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-heading)", marginBottom: 4 }}>{icon} {title}</div>
      <div style={{ fontSize: 13, color: "var(--text-body)", lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}
