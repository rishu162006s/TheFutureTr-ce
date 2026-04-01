from typing import List, Dict, Any
from datetime import datetime, timedelta
import structlog
from core.models import RawSignal, ScoredSignal, SignalScore, SignalClassification, MaturityStage

logger = structlog.get_logger()

class SignalScorer:
    def __init__(self):
        self.source_weights = {
            "github":     1.2,
            "arxiv":      1.5,
            "hackernews": 0.9,
            "reddit":     0.7,
            "ontology":   1.0,
        }

    def score_signal(self, raw: RawSignal) -> ScoredSignal:
        """Compute weighted scores for a raw intelligence signal."""
        meta = raw.metadata

        novelty     = float(meta.get("novelty", 0.5))
        velocity    = float(meta.get("velocity", 0.3))
        src_weight  = self.source_weights.get(raw.source, 1.0)
        credibility = min(0.97, src_weight * raw.raw_score)

        # Adoption: proportional to velocity, decays with age
        age_days = max(0, (datetime.utcnow() - raw.timestamp).days)
        adoption = min(1.0, velocity * 1.8 / (age_days + 1))

        # Fix #7: cross_source score — proxy = appears in multiple sources
        cross_source_hits = int(meta.get("cross_source_count", 1))
        cross_source = min(0.96, cross_source_hits / 5.0 + 0.1)

        composite = min(1.0, (
            novelty     * 0.30 +
            velocity    * 0.25 +
            credibility * 0.25 +
            adoption    * 0.10 +
            cross_source * 0.10
        ))

        score_obj = SignalScore(
            novelty=round(min(1.0, novelty), 4),
            velocity=round(min(1.0, velocity), 4),
            credibility=round(credibility, 4),
            adoption=round(min(1.0, adoption), 4),
            cross_source=round(cross_source, 4),
            composite=round(composite, 4),
        )

        # Fix #8: use "signal" / "weak_signal" (matches frontend filter)
        if composite >= 0.65:
            classification = SignalClassification.SIGNAL
        elif composite >= 0.35:
            classification = SignalClassification.WEAK
        else:
            classification = SignalClassification.NOISE

        maturity = MaturityStage.TRIAL if adoption > 0.5 else MaturityStage.ASSESS

        return ScoredSignal(
            id=raw.id,
            technology=meta.get("technology", raw.title[:30]),
            title=raw.title,
            content=raw.content,
            url=raw.url,
            classification=classification,
            score=score_obj,
            domain=meta.get("domain", "Artificial Intelligence"),
            subdomain=meta.get("subdomain", ""),
            maturity=maturity,
            explanation=(
                f"Signal validated via {raw.source} — composite score {composite:.0%}. "
                f"Velocity: {velocity:.0%}, Credibility: {credibility:.0%}."
            ),
            evidence=[raw.url],
            opportunity_score=round(min(1.0, composite * 1.05), 4),
            risk_level=round(max(0.05, 1.0 - credibility), 4),
            timestamp=datetime.utcnow(),
            metadata=meta,
        )

    def score_batch(self, signals: List[RawSignal]) -> List[ScoredSignal]:
        """Score and deduplicate by technology — keep highest composite per tech."""
        scored = [self.score_signal(s) for s in signals]
        # Merge cross-source: aggregate same technology signals
        best: Dict[str, ScoredSignal] = {}
        counts: Dict[str, int] = {}
        for s in scored:
            key = s.technology.lower()
            counts[key] = counts.get(key, 0) + 1
            if key not in best or s.score.composite > best[key].score.composite:
                best[key] = s
        # Boost cross_source score for technologies seen in multiple fetches
        result = []
        for key, sig in best.items():
            n = counts[key]
            if n > 1:
                cs = min(0.98, sig.score.cross_source + (n - 1) * 0.08)
                # Recalculate composite with boosted cross_source
                new_composite = min(1.0, (
                    sig.score.novelty * 0.30 +
                    sig.score.velocity * 0.25 +
                    sig.score.credibility * 0.25 +
                    sig.score.adoption * 0.10 +
                    cs * 0.10
                ))
                sig.score.cross_source = round(cs, 4)
                sig.score.composite = round(new_composite, 4)
                sig.opportunity_score = round(min(1.0, new_composite * 1.05), 4)
            result.append(sig)
        return result
