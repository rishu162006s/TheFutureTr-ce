"use client";

import { useState } from "react";
import { api, BrandName } from "@/lib/api";

export default function NameItView() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [names, setNames] = useState<BrandName[]>([]);

  const fetchNames = async () => {
    if (!idea) return;
    setLoading(true);
    try {
      const results = await api.getNameIt(idea);
      setNames(results);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div className="animate-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Branding Input */}
      <div className="glass-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>🏷️ NameIt Identity Node</h3>
        <div style={{ display: "flex", gap: 12 }}>
          <input type="text" className="nav-item" value={idea} onChange={e => setIdea(e.target.value)} 
            placeholder="Describe your idea briefly (e.g., AI healthcare platform)" style={{ flex: 1, background: "var(--page-bg)", border: "var(--glass-border)", color: "var(--text-heading)" }} />
          <button className="header-btn primary" onClick={fetchNames} disabled={loading} style={{ height: 42, padding: "0 24px" }}>
            {loading ? "🔍 Searching..." : "🏷️ Find Names"}
          </button>
        </div>
      </div>

      {/* Results */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 20 }}>
        {names.map((brand, i) => (
          <div key={i} className="glass-card" style={{ position: "relative" }}>
             <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, color: "var(--accent-blue)" }}>{brand.name}</div>
             <div style={{ fontSize: 11, padding: "2px 8px", background: "rgba(245,158,11,0.1)", color: "var(--accent-amber)", borderRadius: 4, display: "inline-block", marginBottom: 16 }}>{brand.category}</div>
             
             <Section icon="📖" title="Meaning" text={brand.meaning} />

             <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12, textTransform: "uppercase" }}>Domain Availability</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                   {brand.domains.map((dom, idx) => (
                     <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(148,163,184,0.05)", borderRadius: 10 }}>
                        <div>
                          <span style={{ fontSize: 15, fontWeight: 800, marginRight: 8 }}>{brand.name.toLowerCase()}{dom.tld}</span>
                          <span style={{ fontSize: 10, color: dom.available ? "var(--accent-emerald)" : "var(--accent-rose)" }}>{dom.available ? "AVAILABLE" : "TAKEN"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                           <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700 }}>{dom.price}</span>
                           <div style={{ display: "flex", gap: 6 }}>
                              {Object.entries(dom.purchase_links).map(([provider, link]) => (
                                <a key={provider} href={link} target="_blank" rel="noopener noreferrer" className="header-btn" style={{ fontSize: 10, padding: "4px 8px" }}>
                                  Buy on {provider}
                                </a>
                              ))}
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        ))}
        {!loading && names.length === 0 && (
          <div className="glass-card full-width" style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>
            🏷️ Define your vision above to generate brandable identities and verify domains.
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-heading)", marginBottom: 4 }}>{icon} {title}</div>
      <div style={{ fontSize: 13, color: "var(--text-body)", lineHeight: 1.5 }}>{text}</div>
    </div>
  );
}
