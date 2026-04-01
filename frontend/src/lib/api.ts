/**
 * Sanskriti API Client
 * Fix #9/#10/#11: Uses NEXT_PUBLIC_API_URL so dev (port 3000) reaches FastAPI (port 8010).
 * In production (both served from port 8010 via static export), API_BASE is empty → relative calls.
 */

// Priority 1: Environment Variable (for Vercel/Production)
// Priority 2: Localhost (for Local Dev)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Clean up endpoint to ensure no double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const res = await fetch(`${API_BASE}${cleanEndpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API Error ${res.status}: ${body || res.statusText}`);
  }

  return res.json();
}

  // ── Types ──────────────────────────────────────────────────────

  export interface SignalScore {
    novelty: number;
    velocity: number;
    credibility: number;
    adoption: number;
    cross_source: number;   // Fix #7: was missing
    composite: number;
  }

  export interface ScoredSignal {
    id: string;
    technology: string;
    title: string;
    content: string;
    domain: string;
    subdomain: string;       // Fix #19
    classification: 'signal' | 'weak_signal' | 'noise';
    score: SignalScore;
    maturity: string;
    explanation: string;
    evidence: string[];
    opportunity_score: number;
    risk_level: number;
    url: string;
    sources?: any[];
  }

  export interface RadarItem {
    id: string;
    name: string;
    quadrant: string;
    ring: string;
    score: number;
    is_new: boolean;
    moved: number;
  }

  export interface TechnologyProfile {
    name: string;
    domain: string;
    description?: string;
    readiness_score: number;
    signal_score: number;
    opportunity_score: number;
    risk_level: number;
    maturity: string;
    key_signals: string[];
  }

  export interface DomainSummary {
    domain: string;
    color: string;
    total_signals: number;
    top_technologies: TechnologyProfile[];
    avg_opportunity_score: number;
    avg_risk_level: number;
    trend_direction: string;
  }

  export interface AlertItem {
    id: string;
    type: string;
    title: string;
    message: string;
    technology: string;
    domain: string;
    severity: string;
    timestamp: string;
    read: boolean;
  }

  export interface TrendDataPoint {
    date: string;
    value: number;
    source_count: number;
  }

  export interface TrendForecast {
    id: string;
    technology: string;
    domain: string;
    historical: TrendDataPoint[];
    forecast: TrendDataPoint[];
    velocity: number;
    acceleration: number;
    breakout_detected: boolean;
    breakout_confidence: number;
  }

  export interface GraphNode {
    id: string;
    label: string;
    domain: string;
    node_type: string;
    signal_strength: number;
    metadata: Record<string, any>;
  }

  export interface GraphEdge {
    source: string;
    target: string;
    weight: number;
    relationship: string;
  }

  export interface RabbitHoleResult {
    start_node: string;
    nodes: GraphNode[];
    edges: GraphEdge[];
    max_depth_reached: number;
    total_nodes_explored: number;
    exploration_path: string[];
    insights: string[];
  }

  export interface MissionConstraints {
    domain: string | null;
    risk: string;
    depth: number;
  }

  export interface MissionRequest {
    goal: string;
    constraints?: Partial<MissionConstraints>;
  }

  export interface Opportunity {
    startup_idea: string;
    problem: string;
    solution: string;
    target_market: string;
    why_now: string;
    competition_level: string;
  }

  export interface ConvictionMetrics {
    conviction_score: number;
    confidence_score: number;
    timing_score: number;
    risk_score: number;
    causality_score: number;
    explanation: string;
  }

  export interface IdeaTechRequirement {
    category: string;
    stack: string[];
  }

  // Fix #12: Single canonical StartupIdea interface covering both /api/ideamela and /api/startup-ideas
  export interface StartupIdea {
    id: string;
    title: string;
    technology?: string;
    domain?: string;
    problem: string;
    solution: string;
    target_audience?: string;
    target_market?: string;
    market_gap?: string;
    unique_angle?: string;
    blue_ocean_ideas?: string[];
    technologies?: IdeaTechRequirement[];
    feasibility_score?: number;
    trend_relevance?: number;
    insight_tags?: string[];
    difficulty?: string;
    potential_score?: number;
    opportunity_score?: number;
    risk_factors?: string[];
    competitive_landscape?: string;
    estimated_tam?: string;
  }

  export interface DomainOption {
    tld: string;
    available: boolean;
    price: string;
    purchase_links: Record<string, string>;
  }

  export interface BrandName {
    name: string;
    meaning: string;
    category: string;
    domains: DomainOption[];
  }

  export interface RoadmapStep {
    phase: string;
    tasks: string[];
    timeline: string;
  }

  export interface StartupRoadmap {
    title: string;
    summary: string;
    prerequisites: Record<string, string[]>;
    tech_stack: Record<string, string[]>;
    roadmap: RoadmapStep[];
    architecture_suggestion: string;
    monetization: string[];
    common_mistakes: string[];
    growth_strategy: Record<string, string[]>;
    potential_score: number;
    difficulty: string;
  }

  export interface UserFeedback {
    mission_id: string;
    path_id: string;
    rating: number;
    comment?: string;
  }

  export interface PathScores {
    depth_score: number;
    novelty_score: number;
    risk_score: number;
    confidence_score: number;
  }

  export interface TrendEvolution {
    evolution: any[];
    predicted_next: string;
  }

  export interface UndervaluedSignal {
    undervalued: boolean;
    reason: string;
  }

  export interface MarketInsight {
    estimated_market_size: string;
    adoption_window: string;
    monetization_model: string;
    buyer: string;
  }

  export interface PathAnalysis {
    strongest_node: string;
    weakest_link: string;
    hidden_gem: string;
  }

  export interface PathComparison {
    path_id: string;
    novelty: string;
    risk: string;
    best_for: string;
  }

  export interface ExecutionFeasibility {
    build_complexity: string;
    talent_requirements: string[];
    time_to_market: string;
    tech_stack: string[];
  }

  export interface CompetitiveLandscape {
    existing_startups: string[];
    funding_activity: string;
    market_gaps: string[];
    competitor_blindspot: string;
  }

  export interface MissionPath {
    id: string;
    nodes: string[];
    insight: string;
    why_this_matters: string;
    real_world_scenario: string;
    startup_idea: Opportunity;
    market_insight: MarketInsight;
    why_others_miss_this: string;
    path_analysis: PathAnalysis;
    next_evolution: string;
    conviction: ConvictionMetrics;
    feasibility: ExecutionFeasibility;
    competition: CompetitiveLandscape;
    evidence_backed_reasoning: string;
    data_sources_used: string[];
    scores: PathScores;
    trend: TrendEvolution;
    contrarian: string;
    undervalued: UndervaluedSignal;
  }

  export interface MissionResponse {
    goal: string;
    paths: MissionPath[];
    comparison: PathComparison[];   // Fix #3
    metadata: Record<string, any>;
  }

  export interface DashboardState {
    radar_items: RadarItem[];
    top_signals: ScoredSignal[];
    domain_summaries: DomainSummary[];
    recent_alerts: AlertItem[];
    trend_forecasts: TrendForecast[];
    total_signals_tracked: number;
    total_technologies: number;
    last_updated: string;
  }

  // ── API Functions ────────────────────────────────────────────

  export const api = {
    getDashboard: () => fetchAPI<DashboardState>('/api/dashboard'),
    runPipeline: () => fetchAPI<any>('/api/pipeline/run', { method: 'POST' }),
    getPipelineStatus: () => fetchAPI<any>('/api/pipeline/status'),
    getSignals: (params?: Record<string, string>) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return fetchAPI<ScoredSignal[]>(`/api/signals${query}`);
    },
    getSignalDetail: (tech: string) =>
      fetchAPI<ScoredSignal>(`/api/signals/${encodeURIComponent(tech)}`),
    getRabbitHole: (tech: string, depth?: number) =>
      fetchAPI<RabbitHoleResult>(`/api/rabbit-hole/${encodeURIComponent(tech)}?max_depth=${depth ?? 3}`),
    runMission: (request: MissionRequest) =>
      fetchAPI<MissionResponse>('/api/rabbit-hole/mission', { method: 'POST', body: JSON.stringify(request) }),
    getKnowledgeGraph: () =>
      fetchAPI<{ nodes: any[]; edges: any[]; pagerank: Record<string, number>; communities: Record<string, number> }>('/api/knowledge-graph'),
    getDomains: () => fetchAPI<DomainSummary[]>('/api/domains'),
    getTrends: () => fetchAPI<TrendForecast[]>('/api/trends'),
    getAlerts: () => fetchAPI<AlertItem[]>('/api/alerts'),
    getStartupIdeas: () => fetchAPI<StartupIdea[]>('/api/startup-ideas'),
    // Fix #13: properly typed, no `as any` cast
    getIdeaMela: (params: { interests: string; skills?: string; domain?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return fetchAPI<StartupIdea[]>(`/api/ideamela?${query}`);
    },
    getNameIt: (idea: string) => fetchAPI<BrandName[]>(`/api/nameit?idea=${encodeURIComponent(idea)}`),
    getStartBuddyyy: (idea: string) => fetchAPI<StartupRoadmap>(`/api/startbuddyyy?idea=${encodeURIComponent(idea)}`),
    getUserStatus: () => fetchAPI<any>('/api/user/status'),
    subscribeRequest: () => fetchAPI<any>('/api/user/subscribe', { method: 'POST' }),
    getOntology: () => fetchAPI<any>('/api/ontology'),
    getHealth: () => fetchAPI<any>('/api/health'),
    submitFeedback: (feedback: UserFeedback) =>
      fetchAPI<any>('/api/feedback', { method: 'POST', body: JSON.stringify(feedback) }),
  };

  // ── Domain Helpers ────────────────────────────────────────────

  export const DOMAIN_COLORS: Record<string, string> = {
    'Artificial Intelligence': '#3b82f6',
    'Cybersecurity': '#ef4444',
    'AR/VR': '#a855f7',
    'Robotics': '#f59e0b',
    'IoT': '#10b981',
  };

  export const DOMAIN_ICONS: Record<string, string> = {
    'Artificial Intelligence': '🧠',
    'Cybersecurity': '🛡️',
    'AR/VR': '🥽',
    'Robotics': '🤖',
    'IoT': '📡',
  };

  export function getDomainClass(domain: string): string {
    const map: Record<string, string> = {
      'Artificial Intelligence': 'ai',
      'Cybersecurity': 'cybersecurity',
      'AR/VR': 'arvr',
      'Robotics': 'robotics',
      'IoT': 'iot',
    };
    return map[domain] || 'ai';
  }

  export function formatScore(score: number): string {
    return (score * 100).toFixed(0);
  }

  export function getScoreColor(score: number): string {
    if (score >= 0.7) return 'var(--accent-emerald)';
    if (score >= 0.5) return 'var(--accent-blue)';
    if (score >= 0.35) return 'var(--accent-amber)';
    return 'var(--accent-rose)';
  }
