import asyncio
import aiohttp
import math
import structlog
from datetime import datetime
from typing import List, Dict, Any
from core.models import RawSignal
from agents.base import BaseAgent

logger = structlog.get_logger()

class ScoutAgent(BaseAgent):
    def __init__(self):
        super().__init__("ScoutAgent")
        self.sources = {
            "github": "https://api.github.com/search/repositories?q={query}&sort=stars&order=desc&per_page=5",
            "hackernews": "https://hn.algolia.com/api/v1/search?query={query}&tags=story&hitsPerPage=5",
            "arxiv": "http://export.arxiv.org/api/query?search_query=all:{query}&start=0&max_results=3",
        }

    async def fetch_signals(self, queries: List[str]) -> List[RawSignal]:
        signals = []
        # Use all unique queries — limit to 15 to avoid rate limit abuse
        priority_queries = list(dict.fromkeys(queries))[:15]

        # GitHub semaphore: max 5 concurrent, no artificial sleep needed
        # — unauthenticated limit = 10 req/min, we batch 15 queries
        github_sem = asyncio.Semaphore(3)
        hn_sem = asyncio.Semaphore(5)

        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=20),
            headers={"User-Agent": "Sanskriti-Intelligence/2.0"}
        ) as session:
            tasks = []
            for query in priority_queries:
                tasks.append(self._scout_github_with_sem(session, query, github_sem))
                tasks.append(self._scout_hn_with_sem(session, query, hn_sem))
            # Arxiv for first 5 queries (high-signal quality)
            for query in priority_queries[:5]:
                tasks.append(self._scout_arxiv(session, query))

            results = await asyncio.gather(*tasks, return_exceptions=True)
            for res in results:
                if isinstance(res, list):
                    signals.extend(res)
                # silently drop exceptions so partial failures don't kill pipeline

        return signals

    async def _scout_github_with_sem(self, session, query, sem) -> List[RawSignal]:
        async with sem:
            result = await self._scout_github(session, query)
            # Small polite delay — 3 slots, ~5 queries/slot = ~15 total, well under 10/min with delay
            await asyncio.sleep(1.2)
            return result

    async def _scout_hn_with_sem(self, session, query, hn_sem) -> List[RawSignal]:
        async with hn_sem:
            return await self._scout_hn(session, query)

    async def _scout_github(self, session, query: str) -> List[RawSignal]:
        signals = []
        try:
            url = self.sources["github"].format(query=query.replace(" ", "+"))
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=8)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    for item in data.get("items", [])[:5]:
                        stars = item.get("stargazers_count", 0)
                        # velocity: normalize stars (log scale)
                        velocity = min(0.97, (math.log1p(stars) / 14.0) + 0.12)
                        signals.append(RawSignal(
                            source="github",
                            title=item["full_name"],
                            content=item.get("description") or f"GitHub repository for {query}",
                            url=item["html_url"],
                            raw_score=0.85,
                            timestamp=datetime.utcnow(),
                            metadata={
                                "technology": query,
                                "stars": stars,
                                "domain": _infer_domain(query),
                                "novelty": min(0.95, (math.log1p(item.get("open_issues_count", 0)) / 8.0) + 0.15),
                                "velocity": velocity,
                                "cross_source_count": 1,
                            }
                        ))
                elif resp.status == 403:
                    logger.warning("GitHub rate limit hit", query=query)
                elif resp.status == 422:
                    logger.warning("GitHub query invalid", query=query)
        except asyncio.TimeoutError:
            logger.warning("GitHub timeout", query=query)
        except Exception as e:
            logger.error("Scout GitHub error", error=str(e), query=query)
        return signals

    async def _scout_hn(self, session, query: str) -> List[RawSignal]:
        signals = []
        try:
            url = self.sources["hackernews"].format(query=query.replace(" ", "+"))
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=6)) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    for item in data.get("hits", [])[:5]:
                        points = item.get("points") or 0
                        comments = item.get("num_comments") or 0
                        velocity = min(0.96, (math.log1p(points) + math.log1p(comments)*0.5) / 12.0 + 0.05)
                        signals.append(RawSignal(
                            source="hackernews",
                            title=item.get("title", f"HN: {query}"),
                            content=f"HN discussion with {points} points and {comments} comments.",
                            url=f"https://news.ycombinator.com/item?id={item.get('objectID', '')}",
                            raw_score=0.75,
                            timestamp=datetime.utcnow(),
                            metadata={
                                "technology": query,
                                "points": points,
                                "domain": _infer_domain(query),
                                "novelty": min(0.98, math.log1p(comments) / 8.0 + 0.1),
                                "velocity": velocity,
                                "cross_source_count": 1,
                            }
                        ))
        except asyncio.TimeoutError:
            logger.warning("HackerNews timeout", query=query)
        except Exception as e:
            logger.error("Scout HN error", error=str(e), query=query)
        return signals

    async def _scout_arxiv(self, session, query: str) -> List[RawSignal]:
        signals = []
        try:
            url = self.sources["arxiv"].format(query=query.replace(" ", "+"))
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=8)) as resp:
                if resp.status == 200:
                    text = await resp.text()
                    import re
                    entries = re.findall(r'<entry>(.*?)</entry>', text, re.DOTALL)
                    for entry in entries[:3]:
                        title_match = re.search(r'<title>(.*?)</title>', entry, re.DOTALL)
                        link_match = re.search(r'<id>(.*?)</id>', entry)
                        title = title_match.group(1).strip() if title_match else f"arXiv paper on {query}"
                        link = link_match.group(1).strip() if link_match else "https://arxiv.org"
                        signals.append(RawSignal(
                            source="arxiv",
                            title=title,
                            content=f"Peer-reviewed academic research: {title}",
                            url=link,
                            raw_score=0.95,
                            timestamp=datetime.utcnow(),
                            metadata={
                                "technology": query,
                                "domain": _infer_domain(query),
                                "novelty": 0.9,
                                "velocity": 0.6,
                                "cross_source_count": 1,
                            }
                        ))
        except asyncio.TimeoutError:
            logger.warning("arXiv timeout", query=query)
        except Exception as e:
            logger.error("Scout arXiv error", error=str(e), query=query)
        return signals


def _infer_domain(query: str) -> str:
    """Infer a domain from a query keyword."""
    q = query.lower()
    # Cybersecurity checked before AI because 'crypto' could overlap
    if any(w in q for w in ["zero trust", "cryptography", "crypto", "quantum crypt",
                             "cybersec", "privacy", "confiden", "post-quantum",
                             "ransomware", "firewall", "intrusion"]):
        return "Cybersecurity"
    if any(w in q for w in ["ai agent", "llm", "rag", "agent", "gpt", "neural",
                             "fine-tun", "fine tuning", "vector database",
                             "embedding", "llm ops", "generative ai"]):
        return "Artificial Intelligence"
    if any(w in q for w in ["robot", "haptic", "autonomous robot", "soft robot",
                             "robotics", "actuator", "servo"]):
        return "Robotics"
    if any(w in q for w in ["iot", "digital twin", "iot edge", "swarm intelligence",
                             "swarm", "edge computing", "sensor mesh"]):
        return "IoT"
    if any(w in q for w in ["ar/vr", "spatial computing", "gaussian splatting",
                             "vr", "xr", "metaverse", "mixed reality",
                             "augmented reality", "virtual reality", "holographic"]):
        return "AR/VR"
    # Broad fallback catches generic terms like 'ai', 'ar' substrings last
    if any(w in q for w in ["ai ", "ai-", "ml ", "deep learning"]):
        return "Artificial Intelligence"
    return "Artificial Intelligence"
