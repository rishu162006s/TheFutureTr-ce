import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

# ═══════════════════════════════════════════════════════════════
# CORE DATA MODELS
# ═══════════════════════════════════════════════════════════════

class SourceType:
    GITHUB = "github"
    HACKERNEWS = "hackernews"
    ARXIV = "arxiv"
    REDDIT = "reddit"
    ONTOLOGY = "ontology"

class SignalClassification:
    SIGNAL = "signal"
    WEAK = "weak_signal"   # Fix #8: was "weak" — must match frontend filter
    NOISE = "noise"

class MaturityStage:
    ADOPT = "adopt"
    TRIAL = "trial"
    ASSESS = "assess"
    HOLD = "hold"

class RawSignal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source: str
    title: str
    content: str
    url: str
    raw_score: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class SignalScore(BaseModel):
    novelty: float
    velocity: float
    credibility: float
    adoption: float
    cross_source: float = 0.0   # Fix #7: add missing cross_source field
    composite: float

class ScoredSignal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    technology: str
    title: str
    content: str
    url: str
    subdomain: str = ""         # Fix #19: add subdomain field
    classification: str
    score: SignalScore
    domain: str
    maturity: str = "trial"
    explanation: str = "Evidence suggests a significant breakthrough."
    evidence: List[str] = Field(default_factory=list)
    opportunity_score: float = 0.0
    risk_level: float = 0.0
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class TechnologyProfile(BaseModel):
    name: str
    domain: str
    description: str = ""
    readiness_score: float = 0.0
    signal_score: float = 0.0
    opportunity_score: float = 0.0
    risk_level: float = 0.0
    key_signals: List[str] = []
    market_momentum: str = "stable"
    maturity: str = "assess"
    active_players: List[str] = []
    last_signal_date: Optional[datetime] = None

class RadarItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    quadrant: str
    ring: str
    score: float
    is_new: bool = False
    moved: int = 0

class DomainSummary(BaseModel):
    domain: str
    color: str
    total_signals: int = 0
    top_technologies: List[TechnologyProfile] = []
    avg_opportunity_score: float = 0.0
    avg_risk_level: float = 0.0
    trend_direction: str = "stable"
    heatmap_data: List[Dict[str, Any]] = []

class AlertItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    title: str
    message: str
    technology: str = ""
    domain: str = ""
    severity: str = "info"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False

class TrendDataPoint(BaseModel):
    date: str
    value: float
    source_count: int = 0

class TrendForecast(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    technology: str
    domain: str
    historical: List[TrendDataPoint] = []
    forecast: List[TrendDataPoint] = []
    velocity: float = 0.0
    acceleration: float = 0.0
    breakout_detected: bool = False
    breakout_confidence: float = 0.0

class DashboardState(BaseModel):
    radar_items: List[RadarItem] = []
    top_signals: List[ScoredSignal] = []
    domain_summaries: List[DomainSummary] = []
    recent_alerts: List[AlertItem] = []
    trend_forecasts: List[TrendForecast] = []
    total_signals_tracked: int = 0
    total_technologies: int = 0
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class Opportunity(BaseModel):
    startup_idea: str
    problem: str
    solution: str
    target_market: str
    why_now: str
    competition_level: str = "medium"

class MarketInsight(BaseModel):
    estimated_market_size: str
    adoption_window: str
    monetization_model: str
    buyer: str

class PathAnalysis(BaseModel):
    strongest_node: str
    weakest_link: str
    hidden_gem: str

class ConvictionMetrics(BaseModel):
    conviction_score: float
    confidence_score: float
    timing_score: float
    risk_score: float
    causality_score: float
    explanation: str

class ExecutionFeasibility(BaseModel):
    build_complexity: str
    talent_requirements: List[str]
    time_to_market: str
    tech_stack: List[str]

class CompetitiveLandscape(BaseModel):
    existing_startups: List[str]
    funding_activity: str
    market_gaps: List[str]
    competitor_blindspot: str

class PathScores(BaseModel):
    depth_score: float
    novelty_score: float
    risk_score: float
    confidence_score: float

class TrendEvolution(BaseModel):
    evolution: List[Dict[str, Any]] = []
    predicted_next: str

class UndervaluedSignal(BaseModel):
    undervalued: bool
    reason: str

# Fix #3: PathComparison model for MissionResponse
class PathComparison(BaseModel):
    path_id: str
    novelty: str
    risk: str
    best_for: str

class MissionPath(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    nodes: List[str]
    insight: str
    why_this_matters: str
    real_world_scenario: str
    startup_idea: Opportunity
    market_insight: MarketInsight
    why_others_miss_this: str
    path_analysis: PathAnalysis
    next_evolution: str
    conviction: ConvictionMetrics
    feasibility: ExecutionFeasibility
    competition: CompetitiveLandscape
    evidence_backed_reasoning: str
    data_sources_used: List[str]
    scores: PathScores
    trend: TrendEvolution
    contrarian: str
    undervalued: UndervaluedSignal

class MissionResponse(BaseModel):
    goal: str
    paths: List[MissionPath] = []
    comparison: List[PathComparison] = []   # Fix #3: was missing
    metadata: Dict[str, Any] = Field(default_factory=dict)

class MissionRequest(BaseModel):
    goal: str
    constraints: Dict[str, Any] = Field(default_factory=dict)

class UserFeedback(BaseModel):
    mission_id: str
    path_id: str
    rating: int
    comment: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
