import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# ═══════════════════════════════════════════════════════════════
# IDEAMELA MODELS
# ═══════════════════════════════════════════════════════════════

class IdeaTechRequirement(BaseModel):
    category: str  # AI, Backend, Frontend, Infra, etc.
    stack: List[str]

class StartupIdea(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    title: str
    problem: str
    solution: str
    target_audience: str
    market_gap: str
    competitors: List[Dict[str, str]] = []  # [{"name": "...", "comparison": "..."}]
    unique_angle: str
    blue_ocean_ideas: List[str] = []
    technologies: List[IdeaTechRequirement] = []
    feasibility_score: int  # 1-10
    trend_relevance: float  # 0-1
    insight_tags: List[str] = []
    difficulty: str = "Intermediate"  # Beginner, Intermediate, Advanced
    potential_score: float = 0.0

# ═══════════════════════════════════════════════════════════════
# NAMEIT MODELS
# ═══════════════════════════════════════════════════════════════

class DomainOption(BaseModel):
    tld: str  # .com, .ai, .io, .tech
    available: bool
    price: str
    purchase_links: Dict[str, str] = {} # {"GoDaddy": "...", "Hostinger": "..."}

class BrandName(BaseModel):
    name: str
    meaning: str
    category: str  # Modern, Futuristic, Minimal, etc.
    domains: List[DomainOption] = []

# ═══════════════════════════════════════════════════════════════
# STARTBUDDYYY MODELS
# ═══════════════════════════════════════════════════════════════

class RoadmapStep(BaseModel):
    phase: str
    tasks: List[str]
    timeline: str

class StartupRoadmap(BaseModel):
    title: str
    summary: str
    prerequisites: Dict[str, List[str]] = {} # {"skills": [], "tools": []}
    tech_stack: Dict[str, List[str]] = {} # {"frontend": [], "backend": []}
    roadmap: List[RoadmapStep] = []
    architecture_suggestion: str
    monetization: List[str] = []
    common_mistakes: List[str] = []
    growth_strategy: Dict[str, List[str]] = {} # {"early_users": [], "marketing": []}
    potential_score: float = 0.0
    difficulty: str = "Intermediate"
