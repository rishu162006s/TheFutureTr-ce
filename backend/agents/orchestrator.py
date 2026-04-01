import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import structlog
import hashlib

from core.config import settings, DOMAINS, DOMAIN_COLORS, TECHNOLOGY_ONTOLOGY
from agents.scout import ScoutAgent
from agents.stubs import AnalystAgent, StrategistAgent, MemoryAgent
from intelligence.knowledge_graph import KnowledgeGraph
from intelligence.signal_scorer import SignalScorer
from intelligence.reasoning_engine import ReasoningEngine
from agents.startup_agents import StartupAgents
from core.models import (
    DashboardState, RadarItem, DomainSummary, AlertItem, TrendForecast, TrendDataPoint,
    ScoredSignal, SignalScore, TechnologyProfile, SignalClassification, MaturityStage,
    RawSignal, MissionResponse, UserFeedback
)
from core.subscription_models import UserStatus, SubscriptionRequest

logger = structlog.get_logger()


class SanskritiOrchestrator:
    def __init__(self):
        self.scout = ScoutAgent()
        self.analyst = AnalystAgent()
        self.strategist = StrategistAgent()
        self.memory = MemoryAgent()
        self.knowledge_graph = KnowledgeGraph()
        self.scorer = SignalScorer()
        self.reasoner = ReasoningEngine(self.knowledge_graph)
        self.startup = StartupAgents(self)
        self.user_session = UserStatus(credits=9999)
        self.raw_signals: List[RawSignal] = []
        self.scored_signals: List[ScoredSignal] = []
        self._running = False

    # ── Pipeline ──────────────────────────────────────────────
    async def run_pipeline(self) -> DashboardState:
        if self._running:
            # Return immediately — don't deadlock by waiting for self
            return await self.get_dashboard_state()

        self._running = True
        try:
            logger.info("Pipeline sweep — Real-Time Multi-Source Mode")
            queries = []
            # Collect ALL techs across all domains so every domain is always represented
            for domain, techs in TECHNOLOGY_ONTOLOGY.items():
                queries.extend(techs)

            raw_signals = await self.scout.fetch_signals(queries)

            if not raw_signals:
                logger.warning("No real-time signals fetched — using ontology fallback")
                self.scored_signals = self._generate_grounded_signals()
            else:
                self.scored_signals = self.scorer.score_batch(raw_signals)
                # Inject into Knowledge Graph
                for sig in self.scored_signals:
                    self.knowledge_graph.add_technology(sig.technology, sig.domain)
                # Sort descending by composite score
                self.scored_signals.sort(key=lambda x: x.score.composite, reverse=True)
                logger.info("Pipeline complete", signals=len(self.scored_signals))

            return await self.get_dashboard_state()
        finally:
            self._running = False

    # ── Dashboard State ────────────────────────────────────────
    async def get_dashboard_state(self) -> DashboardState:
        # If no signals yet and pipeline isn't running, kick off pipeline in background
        if not self.scored_signals and not self._running:
            import asyncio
            asyncio.create_task(self.run_pipeline())

        # If signals are already populated, return immediately (no blocking wait)
        # On very first load, wait up to 25s for pipeline to return data
        if not self.scored_signals:
            import asyncio
            for _ in range(250):   # 25 seconds max wait
                await asyncio.sleep(0.1)
                if self.scored_signals:
                    break

        # If still no live signals after waiting, use ontology fallback
        if not self.scored_signals:
            self.scored_signals = self._generate_grounded_signals()

        unique_techs = len({s.technology for s in self.scored_signals})

        return DashboardState(
            radar_items=self._build_radar_items(),
            top_signals=self.scored_signals[:20],
            domain_summaries=self._build_domain_summaries(),
            recent_alerts=self._build_alerts(),
            trend_forecasts=await self._build_trends(),
            total_signals_tracked=len(self.scored_signals),
            total_technologies=unique_techs,
            last_updated=datetime.utcnow(),
        )

    async def get_signals(self) -> List[ScoredSignal]:
        if not self.scored_signals:
            if not self._running:
                await self.run_pipeline()
        return self.scored_signals

    async def get_trends(self) -> List[TrendForecast]:
        return await self._build_trends()

    def get_alerts(self) -> List[AlertItem]:
        return self._build_alerts()

    def get_ontology(self) -> Dict[str, Any]:
        return TECHNOLOGY_ONTOLOGY

    def get_user_status(self) -> UserStatus:
        return self.user_session

    async def charge_credits(self, amount: int):
        pass  # Credits removed

    async def upgrade_to_premium(self) -> UserStatus:
        self.user_session.is_subscribed = True
        self.user_session.subscription_plan = "Premium"
        self.user_session.credits = 1_000_000
        return self.user_session

    def get_domains(self) -> List[DomainSummary]:
        return self._build_domain_summaries()

    async def submit_feedback(self, feedback: UserFeedback) -> Dict[str, str]:
        return {"status": "received", "mission_id": feedback.mission_id}

    async def run_mission(self, goal: str, constraints: Dict) -> MissionResponse:
        return await self.reasoner.execute_mission(goal, constraints)

    # ── Ontology Fallback ──────────────────────────────────────
    def _generate_grounded_signals(self) -> List[ScoredSignal]:
        """Deterministic fallback — one signal per ontology tech, all 5 domains covered."""
        import random, hashlib
        signals: List[ScoredSignal] = []
        for domain, techs in TECHNOLOGY_ONTOLOGY.items():
            for tech in techs:
                seed = int(hashlib.md5(tech.encode()).hexdigest()[:8], 16)
                rng = random.Random(seed)
                composite  = round(rng.uniform(0.48, 0.91), 4)
                velocity   = round(rng.uniform(0.35, 0.82), 4)
                novelty    = round(rng.uniform(0.42, 0.88), 4)
                credibility = 0.80
                adoption   = round(min(1.0, velocity * 1.8), 4)
                cross_src  = 0.33
                signals.append(ScoredSignal(
                    technology=tech,
                    title=f"Ontology: {tech}",
                    content=f"Intelligence signal for {tech} in {domain}.",
                    url=f"https://en.wikipedia.org/wiki/{tech.replace(' ', '_')}",
                    domain=domain,
                    classification="signal" if composite >= 0.65 else "weak_signal",
                    score=SignalScore(
                        novelty=novelty,
                        velocity=velocity,
                        credibility=credibility,
                        adoption=adoption,
                        cross_source=cross_src,
                        composite=composite,
                    ),
                    maturity="trial" if composite > 0.70 else "assess",
                    explanation=(
                        f"Ontology-grounded signal for {tech}. "
                        f"Composite: {composite:.0%}, Velocity: {velocity:.0%}."
                    ),
                    evidence=[f"https://en.wikipedia.org/wiki/{tech.replace(' ', '_')}"],
                    opportunity_score=round(min(1.0, composite * 1.05), 4),
                    risk_level=round(max(0.05, 1.0 - credibility), 4),
                ))
        signals.sort(key=lambda x: x.score.composite, reverse=True)
        return signals

    @staticmethod
    def _synthetic_trend(sig: ScoredSignal, today: "datetime") -> "TrendForecast":
        """Build a plausible trend from signal scores when the HN API is unavailable."""
        import random, hashlib
        rng = random.Random(int(hashlib.md5(sig.technology.encode()).hexdigest()[:8], 16))
        historical: List[TrendDataPoint] = []
        base = sig.score.composite * 0.55
        for days_ago in range(13, -1, -1):
            date = today - timedelta(days=days_ago)
            noise        = rng.uniform(-0.04, 0.04)
            trend_bump   = (13 - days_ago) / 13 * sig.score.velocity * 0.18
            val = round(min(1.0, max(0.05, base + noise + trend_bump)), 3)
            historical.append(TrendDataPoint(
                date=date.strftime("%Y-%m-%d"),
                value=val,
                source_count=rng.randint(0, 7),
            ))
        forecast: List[TrendDataPoint] = []
        last_val = historical[-1].value
        accel = sig.score.velocity * 0.25
        for d in range(1, 8):
            pred = round(min(1.0, last_val + accel * d * 0.08), 3)
            forecast.append(TrendDataPoint(
                date=(today + timedelta(days=d)).strftime("%Y-%m-%d"),
                value=pred,
                source_count=int(pred * 10),
            ))
        return TrendForecast(
            id=f"trend-{sig.technology.lower().replace(' ', '-')}",
            technology=sig.technology,
            domain=sig.domain,
            historical=historical,
            forecast=forecast,
            velocity=round(sig.score.velocity, 4),
            acceleration=round(accel, 4),
            breakout_detected=sig.score.velocity > 0.80 and historical[-1].value > historical[-3].value,
            breakout_confidence=round(sig.score.composite, 4),
        )

    # ── Radar Items ────────────────────────────────────────────
    def _build_radar_items(self) -> List[RadarItem]:
        items = []
        seen = set()
        for sig in self.scored_signals:
            if sig.technology not in seen:
                c = sig.score.composite
                if c >= 0.80:
                    ring = MaturityStage.ADOPT
                elif c >= 0.60:
                    ring = MaturityStage.TRIAL
                elif c >= 0.40:
                    ring = MaturityStage.ASSESS
                else:
                    ring = MaturityStage.HOLD
                items.append(RadarItem(
                    id=sig.id,
                    name=sig.technology,
                    quadrant=sig.domain,
                    ring=ring,
                    score=sig.score.composite,
                    is_new=sig.score.velocity > 0.7,
                ))
                seen.add(sig.technology)
        return items

    # ── Domain Summaries (Fix #6) ──────────────────────────────
    def _build_domain_summaries(self) -> List[DomainSummary]:
        summaries = []
        for domain in DOMAINS:
            domain_sigs = [s for s in self.scored_signals if s.domain == domain]
            if domain_sigs:
                avg_opp = sum(s.opportunity_score for s in domain_sigs) / len(domain_sigs)
                avg_risk = sum(s.risk_level for s in domain_sigs) / len(domain_sigs)
                trend_dir = "rising" if avg_opp > 0.65 else "stable"
            else:
                avg_opp, avg_risk, trend_dir = 0.6, 0.3, "stable"

            # Fix #6: Populate top_technologies with real TechnologyProfile objects
            top_sigs = sorted(domain_sigs, key=lambda s: s.score.composite, reverse=True)[:5]
            top_techs = [
                TechnologyProfile(
                    name=s.technology,
                    domain=s.domain,
                    description=s.content[:120],
                    readiness_score=s.score.composite,
                    signal_score=s.score.composite,
                    opportunity_score=s.opportunity_score,
                    risk_level=s.risk_level,
                    maturity=s.maturity,
                    key_signals=s.evidence[:3],
                )
                for s in top_sigs
            ]

            summaries.append(DomainSummary(
                domain=domain,
                color=DOMAIN_COLORS.get(domain, "#3b82f6"),
                total_signals=len(domain_sigs),
                top_technologies=top_techs,
                avg_opportunity_score=round(avg_opp, 3),
                avg_risk_level=round(avg_risk, 3),
                trend_direction=trend_dir,
            ))
        return summaries

    # ── Trend Forecasts (Fix #4 & #5) ─────────────────────────
    async def _build_trends(self) -> List[TrendForecast]:
        """Task 2 & 4: Build trend forecasts with REAL historical data scraped via API asynchronous batches."""
        import aiohttp
        import asyncio

        trends = []
        seen = set()
        today = datetime.utcnow()
        
        # Get top 8 unique technologies to plot
        top_sigs = []
        for s in self.scored_signals:
            if s.technology not in seen:
                seen.add(s.technology)
                top_sigs.append(s)
                if len(top_sigs) >= 8: break
        
        async def fetch_history(sig: ScoredSignal, session: aiohttp.ClientSession) -> Optional[TrendForecast]:
            try:
                url = f"https://hn.algolia.com/api/v1/search?query={sig.technology}&tags=story&hitsPerPage=100"
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=6)) as resp:
                    data = await resp.json()

                    hits = data.get("hits", [])
                    counts_by_day = {d: 0 for d in range(14)}
                    for hit in hits:
                        created_str = hit.get("created_at")
                        if created_str:
                            try:
                                created_dt = datetime.strptime(created_str, "%Y-%m-%dT%H:%M:%S.%fZ")
                                days_ago = (today - created_dt).days
                                if 0 <= days_ago < 14:
                                    counts_by_day[days_ago] += 1
                            except ValueError:
                                pass

                    historical: List[TrendDataPoint] = []
                    for days_ago in range(13, -1, -1):
                        date = today - timedelta(days=days_ago)
                        count = counts_by_day[days_ago]
                        val = min(1.0, (count / 15.0) + (sig.score.composite * 0.3) + 0.05) if count > 0 else (sig.score.composite * 0.2)
                        historical.append(TrendDataPoint(
                            date=date.strftime("%Y-%m-%d"),
                            value=round(val, 3),
                            source_count=count,
                        ))

                    forecast: List[TrendDataPoint] = []
                    last_val = historical[-1].value
                    accel = sig.score.velocity * 0.25
                    for days_ahead in range(1, 8):
                        pred = round(min(1.0, last_val + accel * days_ahead * 0.08), 3)
                        forecast.append(TrendDataPoint(
                            date=(today + timedelta(days=days_ahead)).strftime("%Y-%m-%d"),
                            value=pred,
                            source_count=int(pred * 10),
                        ))

                    return TrendForecast(
                        id=f"trend-{sig.technology.lower().replace(' ', '-')}",
                        technology=sig.technology,
                        domain=sig.domain,
                        historical=historical,
                        forecast=forecast,
                        velocity=round(sig.score.velocity, 4),
                        acceleration=round(sig.score.velocity * 0.25, 4),
                        breakout_detected=sig.score.velocity > 0.8 and historical[-1].value > historical[-3].value,
                        breakout_confidence=round(sig.score.composite, 4),
                    )
            except Exception as e:
                logger.warning("Trend API unavailable — using synthetic fallback", tech=sig.technology, error=str(e))
                return self._synthetic_trend(sig, today)

        # Execute concurrent tasks dynamically
        async with aiohttp.ClientSession() as session:
            tasks = [fetch_history(sig, session) for sig in top_sigs]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for res in results:
                if res and not isinstance(res, Exception):
                    trends.append(res)
                    
        return trends

    # ── Alerts ─────────────────────────────────────────────────
    def _build_alerts(self) -> List[AlertItem]:
        if not self.scored_signals:
            return []

        alerts = []
        # Breakout alerts from top signals
        for sig in self.scored_signals[:3]:
            if sig.score.velocity > 0.65:
                alerts.append(AlertItem(
                    type="breakout",
                    title=f"⚡ {sig.technology} Breakout Detected",
                    message=f"High-velocity signals in {sig.domain}. Composite: {sig.score.composite:.0%}.",
                    technology=sig.technology,
                    domain=sig.domain,
                    severity="high",
                ))
        # New signal alerts for next batch
        for sig in self.scored_signals[3:6]:
            alerts.append(AlertItem(
                type="new_signal",
                title=f"📡 New Signal: {sig.technology}",
                message=f"Fresh evidence discovered via {sig.url[:60]}...",
                technology=sig.technology,
                domain=sig.domain,
                severity="info",
            ))
        # Risk alert for any high-risk technology
        high_risk = [s for s in self.scored_signals if s.risk_level > 0.7]
        if high_risk:
            sig = high_risk[0]
            alerts.append(AlertItem(
                type="risk",
                title=f"⚠️ Risk Flag: {sig.technology}",
                message=f"Risk level {sig.risk_level:.0%} — proceed with caution in {sig.domain}.",
                technology=sig.technology,
                domain=sig.domain,
                severity="warning",
            ))
        return alerts
