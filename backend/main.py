import asyncio
import structlog
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from core.config import settings
from core.models import (
    DashboardState, ScoredSignal, MissionRequest, MissionResponse, UserFeedback
)
from agents.orchestrator import SanskritiOrchestrator
from api.auth import router as auth_router

logger = structlog.get_logger()
orchestrator = SanskritiOrchestrator()

app = FastAPI(title="Sanskriti Intelligence Engine", version="2.0.0")

app.include_router(auth_router)

# Fix #9/#11: Permissive CORS so Next.js dev (port 3000) can reach FastAPI (port 8010)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.68.95:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    logger.info("Auto-priming intelligence engine on port 8010...")
    asyncio.create_task(orchestrator.run_pipeline())


# ── Health ────────────────────────────────────────────────────
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "port": 8010, "version": "2.0.0"}


# ── Dashboard ─────────────────────────────────────────────────
@app.get("/api/dashboard", response_model=DashboardState)
async def get_dashboard():
    try:
        return await orchestrator.get_dashboard_state()
    except Exception as e:
        import traceback
        err = traceback.format_exc()
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(str(err), status_code=500)


# ── Pipeline ──────────────────────────────────────────────────
@app.post("/api/pipeline/run")
async def run_pipeline():
    """Kick off a fresh pipeline sweep in background and return immediately."""
    if not orchestrator._running:
        asyncio.create_task(orchestrator.run_pipeline())
    return {"status": "started", "timestamp": datetime.utcnow()}

@app.get("/api/pipeline/status")
async def get_pipeline_status():
    return {"status": "running" if orchestrator._running else "idle"}


# ── Signals ───────────────────────────────────────────────────
@app.get("/api/signals")
async def get_signals():
    return await orchestrator.get_signals()

@app.get("/api/signals/{tech}")
async def get_signal_detail(tech: str):
    signals = await orchestrator.get_signals()
    for s in signals:
        if s.technology.lower() == tech.lower():
            return s
    raise HTTPException(status_code=404, detail="Signal not found")


# ── Rabbit Hole (Fix #15) — uses Knowledge Graph ──────────────
@app.get("/api/rabbit-hole/{tech}")
async def get_rabbit_hole(tech: str, max_depth: int = 3):
    subgraph = orchestrator.knowledge_graph.get_subgraph(tech, radius=max_depth)
    related = orchestrator.knowledge_graph.get_related_techs(tech, depth=max_depth)
    return {
        "start_node": tech,
        "nodes": subgraph.get("nodes", []),
        "edges": subgraph.get("edges", []),
        "max_depth_reached": max_depth,
        "total_nodes_explored": len(subgraph.get("nodes", [])),
        "exploration_path": [tech] + related[:5],
        "insights": [
            f"{tech} is connected to {len(related)} technologies in the knowledge graph.",
            f"Strongest domain link: {orchestrator.knowledge_graph.graph.nodes.get(tech, {}).get('domain', 'Unknown')}",
        ]
    }


# ── Agentic Mission ───────────────────────────────────────────
@app.post("/api/rabbit-hole/mission", response_model=MissionResponse)
@app.post("/api/mission", response_model=MissionResponse)
async def run_mission(request: MissionRequest):
    return await orchestrator.run_mission(request.goal, request.constraints)


# ── Domain & Trends ───────────────────────────────────────────
@app.get("/api/domains")
async def get_domains():
    return orchestrator.get_domains()

@app.get("/api/trends")
async def get_trends():
    return await orchestrator.get_trends()

@app.get("/api/alerts")
async def get_alerts():
    return orchestrator.get_alerts()

@app.get("/api/ontology")
async def get_ontology():
    return orchestrator.get_ontology()


# ── Knowledge Graph ───────────────────────────────────────────
@app.get("/api/knowledge-graph")
async def get_knowledge_graph():
    G = orchestrator.knowledge_graph.graph
    try:
        import networkx as nx
        pagerank = nx.pagerank(G, alpha=0.85)
        communities = {}
        for n, d in G.nodes(data=True):
            communities[n] = hash(d.get("domain", "Unknown")) % 10
    except Exception:
        pagerank = {n: 0.5 for n in G.nodes()}
        communities = {}
    return {
        "nodes": [{"id": n, **G.nodes[n]} for n in G.nodes()],
        "edges": [{"source": u, "target": v, **d} for u, v, d in G.edges(data=True)],
        "pagerank": pagerank,
        "communities": communities,
    }


# ── User / Subscription ───────────────────────────────────────
@app.get("/api/user/status")
async def get_user_status():
    return orchestrator.get_user_status()

@app.post("/api/user/subscribe")
async def upgrade_to_premium():
    return await orchestrator.upgrade_to_premium()


# ── IdeaMela / NameIt / StartBuddy ───────────────────────────
@app.get("/api/ideamela")
async def get_ideamela(interests: str, skills: str = "", domain: str = ""):
    return await orchestrator.startup.generate_ideas(interests, skills, domain)

@app.get("/api/nameit")
async def get_nameit(idea: str):
    return await orchestrator.startup.name_it(idea)

@app.get("/api/startbuddyyy")
@app.get("/api/startbuddy")
async def get_startbuddyyy(idea: str):
    return await orchestrator.startup.generate_roadmap(idea)


# ── Startup Ideas (dashboard feed) ───────────────────────────
@app.get("/api/startup-ideas")
async def get_startup_ideas():
    signals = await orchestrator.get_signals()
    ideas = []
    for s in signals:
        if s.opportunity_score > 0.55:
            ideas.append({
                "id": f"idea_{s.technology.lower().replace(' ', '_')}",
                "title": f"Next-Gen {s.technology} Platform",
                "technology": s.technology,
                "domain": s.domain,
                "problem": f"The {s.domain} sector lacks {s.technology} automation at scale.",
                "solution": f"An agentic {s.technology} platform with real-time signal integration.",
                "target_market": f"Enterprise {s.domain} teams and technical founders.",
                "opportunity_score": s.opportunity_score,
                "risk_factors": ["Early market", "Talent scarcity", "Regulatory unknowns"],
                "competitive_landscape": "Fragmented — large vendors are slow to adapt.",
                "estimated_tam": f"${round(s.opportunity_score * 8, 1)}B",
            })
    return ideas[:10]


# ── Feedback ──────────────────────────────────────────────────
@app.post("/api/feedback")
async def submit_feedback(feedback: UserFeedback):
    return await orchestrator.submit_feedback(feedback)


# ── Static Frontend (Production) ──────────────────────────────
# Serves Next.js static export — only mounts if the build exists
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "out")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
    logger.info("Serving static frontend", path=frontend_path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8010, reload=False)
