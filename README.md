# FutureTr@ce: Sanskriti Intelligence Platform

FutureTr@ce is a next-generation **Agentic Discovery Engine** designed for venture capitalists, industry analysts, and technology scouts. It transforms passive data into "decision-grade intelligence" by using multi-hop graph reasoning to uncover hidden technology intersections and market opportunities.

---

## 🚀 Key Features

### 1. Agentic Mission Control
Replace standard search with goal-driven missions. State a goal like *"Find low-competition startup opportunities in AI for petroleum logistics"*, and the engine will autonomously crawl the technology ontology to find valid paths.

### 2. Deep "Rabbit Hole" Exploration
Unlike standard graph traversal, FutureTr@ce performs multi-hop reasoning. It doesn't just show related nodes; it finds logical sequences (e.g., *Zero Trust Security → Swarm Intelligence → Digital Twins*) and explains the synergy between them.

### 3. Venture Intelligence Layer
Every discovered path is accompanied by a deep-dive analysis including:
- **Real-World Scenarios**: Concrete examples of how the technology combination is used (e.g., on an offshore rig or hospital network).
- **Startup Opportunities**: Framed as Problem/Solution/Why Now/Target Market.
- **Market Heuristics**: Estimated TAM, predicted buyer, and suggested monetization models.
- **"Insider Edge"**: Analysis of why competitors are missing the current opportunity.
- **Path Analysis**: Identification of the "hidden gem" nodes and "weakest link" dependencies.

### 4. Interactive Radar & Signals
- **Technology Radar**: Real-time visualization of technology maturity using curated ontology stages (Early, Emerging, Scaling, Saturated).
- **Signal Aggregator**: Tracking high-velocity signals from GitHub, HackerNews, ArXiv, and Reddit.
- **Trend Forecasting**: Predictive evolution paths for emerging technology stacks.

---

## 🛠️ Technology Stack

### Backend (Python / FastAPI)
- **Engine**: [FastAPI](https://fastapi.tiangolo.com/) for high-performance asynchronous API management.
- **Reasoning**: [NetworkX](https://networkx.org/) for complex graph theory operations and multi-hop pathfinding.
- **Embeddings**: [Sentence Transformers](https://www.sbert.net/) for semantic goal interpretation and knowledge mapping.
- **Storage**: [SQLAlchemy](https://www.sqlalchemy.org/) with SQLite/AioSQLite for persistence.
- **Observability**: [Structlog](https://www.structlog.org/) for structured, traceable system logs.
- **Scheduling**: [APScheduler](https://apscheduler.readthedocs.io/) for background data harvesting pipelines.

### Frontend (Next.js / React)
- **Framework**: [Next.js 16](https://nextjs.org/) with [App Router](https://nextjs.org/docs/app) and [TypeScript](https://www.typescriptlang.org/).
- **Visualizations**: 
  - [D3.js](https://d3js.org/) & [Cytoscape.js](https://js.cytoscape.org/) for high-fidelity graph rendering.
  - [Recharts](https://recharts.org/) for dashboard analytics and radar views.
- **Animation**: [Framer Motion](https://www.framer.com/motion/) for smooth, state-driven UI transitions.
- **Styling**: Premium Glassmorphic UI built with Vanilla CSS variables and modern layout paradigms.

---

## 🧠 System Workflow

1. **Input Interpretation**: The `AgenticExplorer` receives a natural language mission goal. It uses semantic embeddings to map the intent to the most relevant "seed nodes" in the Technology Ontology.
2. **Graph Traversal**: The engine executes multi-hop reasoning across the `KnowledgeGraph`, filtering paths based on risk constraints, depth requirements, and cross-domain novelty.
3. **Intelligence Synthesis**: Candidates are passed to the **Insight Generator**, which synthesizes 10+ layers of intelligence (Market, Strategy, Scenario) for every path.
4. **Scoring & Ranking**: Paths are ranked based on a weighted score of **Novelty**, **Confidence**, and **Structural Integrity**.
5. **Interactive Delivery**: Results are rendered via a dynamic dashboard allowing users to drill down into specific opportunities and visualize the forecasted evolution.

---

## ⚙️ Setup & Installation

### Backend
1. `cd backend`
2. `pip install -r requirements.txt`
3. `python main.py` (Runs on `localhost:8000`)

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev` (Runs on `localhost:3000`)

---

## 🎯 Our Mission
FutureTr@ce aims to remove the "noise" from global technology trends, providing structural clarity on where the next trillion-dollar industries will emerge before they become consensus.
