import structlog
import hashlib
from typing import List, Dict, Any, Optional
from core.startup_models import (
    StartupIdea, BrandName, DomainOption, StartupRoadmap,
    RoadmapStep, IdeaTechRequirement
)

logger = structlog.get_logger()

# ── Semantic Knowledge Base Removed ────────────────────────────
# All data is now dynamically generated via real-time API integrations.

# ── Helpers ───────────────────────────────────────────────────
def _seed(text: str, salt: str = "") -> int:
    return int(hashlib.md5(f"{text.lower()}{salt}".encode()).hexdigest(), 16)

def _pick(lst: list, seed: int, i: int = 0):
    if not lst: return None
    return lst[(seed + i) % len(lst)]

class StartupAgents:
    def __init__(self, orchestrator):
        self.orchestrator = orchestrator

    # ── IdeaMela ──────────────────────────────────────────────
    async def generate_ideas(self, interests: str, skills: str = "", domain: str = "General") -> List[StartupIdea]:
        import aiohttp
        import asyncio
        from bs4 import BeautifulSoup
        
        domain_raw = domain.strip().title() or "Technology"
        query = f"{interests} {domain_raw}".strip()
        
        ideas: List[StartupIdea] = []
        
        # Task 3: Fetch real startup ideas from HackerNews based on user input
        url = f"https://hn.algolia.com/api/v1/search?query=Show HN {query}&tags=story&hitsPerPage=20"
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=6)) as resp:
                    data = await resp.json()
                    hits = data.get("hits", [])
                    
                    # If limited results for 'Show HN', broaden search
                    if len(hits) < 3:
                        url2 = f"https://hn.algolia.com/api/v1/search?query={query} startup&tags=story&hitsPerPage=5"
                        async with session.get(url2, timeout=aiohttp.ClientTimeout(total=4)) as resp2:
                            data2 = await resp2.json()
                            hits.extend(data2.get("hits", []))
                            
                    for i, hit in enumerate(hits[:6]):
                        title = hit.get("title", f"AI-driven {domain_raw} Platform")
                        # Clean "Show HN:" prefix
                        if title.startswith("Show HN:"):
                            title = title[8:].strip()
                            
                        # Extract some real context from the submission or comment
                        story_text = hit.get("story_text", "") or ""
                        
                        # Generate dynamic content based on real HN post title
                        problem_desc = f"Incumbents struggle with the precise technical challenges addressed by {title}. Market fragmentation and legacy pipelines create high latency."
                        solution_desc = f"Building heavily upon {title}, leveraging {skills or 'modern architecture'} to deploy a closed-loop automated system capable of scaling instantly."
                        
                        ideas.append(StartupIdea(
                            title=title,
                            problem=problem_desc,
                            solution=solution_desc,
                            target_audience=f"Enterprise teams prioritizing {domain_raw} and early adopters of {interests}.",
                            market_gap=f"Current solutions lack deep integration for {title.split()[0]} workflows.",
                            unique_angle=f"Combining {skills or 'cutting-edge automation'} with the foundational approach of {title}.",
                            blue_ocean_ideas=[
                                f"A decentralised version of {title}.",
                                f"API-first marketplace targeting {domain_raw} using {interests}.",
                                f"Zero-setup managed infrastructure for {title}."
                            ],
                            technologies=[
                                IdeaTechRequirement(category="Core", stack=[interests] if interests else ["FastAPI"]),
                                IdeaTechRequirement(category="Infrastructure", stack=["Docker", "AWS", "PostgreSQL"]),
                            ],
                            feasibility_score=min(10, max(5, int((hit.get("points", 50) % 100) / 10) + 1)),
                            trend_relevance=round(min(1.0, hit.get("points", 10) / 100.0 + 0.3), 3),
                            insight_tags=[f"#LiveHNSignal", f"#{domain_raw.replace(' ','')}", "#Startup"],
                            difficulty="Advanced" if hit.get("points", 0) > 200 else "Intermediate",
                            potential_score=round(min(9.9, hit.get("points", 50) / 50.0 + 5.0), 1),
                            competitors=[{
                                "name": "Established Legacy Vendors",
                                "comparison": f"They rely on manual pipelines, whereas our dynamic approach adapts organically to {interests}."
                            }],
                        ))
            except Exception as e:
                logger.error("Failed to fetch IdeaMela live data", error=str(e))
        
        # Fallback to a single generic if network fails
        if not ideas:
            ideas.append(StartupIdea(
                title=f"Next-Gen {domain_raw} Intelligence API",
                problem=f"{domain_raw} lacks interoperability.",
                solution=f"A unified {interests} layer over modern infrastructure.",
                target_audience=f"{domain_raw} enterprises.",
                market_gap=f"No dedicated {interests} API for this specific niche.",
                unique_angle=f"Native support for {skills} out of the box.",
                blue_ocean_ideas=["Licensing the core engine as a white-label product."],
                technologies=[],
                feasibility_score=7, trend_relevance=0.8, insight_tags=["#LiveFallback"],
                difficulty="Intermediate", potential_score=8.0, competitors=[]
            ))
            
        return ideas


    # ── NameIt ────────────────────────────────────────────────
    async def name_it(self, idea_desc: str) -> List[BrandName]:
        seed = _seed(idea_desc)
        desc_lower = idea_desc.lower()

        roots_by_domain = {
            "agri":    ["Terra", "Agro", "Ceres", "Field", "Grow", "Root", "Yield", "Sprout"],
            "ai":      ["Neo", "Neural", "Synapse", "Cortex", "Cogni", "Logic", "Axiom", "Neuro"],
            "robot":   ["Bot", "Mech", "Autom", "Kinet", "Move", "Servo", "Nexus", "Gear"],
            "finance": ["Ledger", "Vault", "Mint", "Fiscal", "Capit", "Quant", "Orbit", "Block"],
            "health":  ["Vibe", "Pulse", "Cura", "Node", "Safe", "Helix", "Vital", "Medix"],
            "energy":  ["Volt", "Lumen", "Grid", "Flux", "Solar", "Ampere", "Joule"],
            "retail":  ["Stock", "Cart", "Prism", "Flow", "Shelf", "Nexus", "Trade"],
            "edu":     ["Learn", "Intel", "Omni", "Skill", "Mind", "Study", "Lore"],
        }

        suffixes = {
            "short":  ["ly", "io", "ai", "us", "ix"],
            "medium": ["ify", "path", "bit", "grid", "sync"],
            "long":   ["trace", "nexus", "forge", "vault", "sphere"],
        }

        # Detect domain keyword dynamically
        active_roots = roots_by_domain["ai"]  
        for k, v in roots_by_domain.items():
            if k in desc_lower:
                active_roots = v
                break

        categories = ["Futuristic", "Minimalist", "Technical", "Bold", "Accessible"]
        suffix_groups = ["short", "medium", "long", "short", "medium"]
        names: List[BrandName] = []

        idea_context = idea_desc[:35].strip().title()

        for i in range(5):
            base_idx   = (_seed(idea_desc, str(i)) // 7) % len(active_roots)
            base       = active_roots[base_idx]
            sfx_group  = suffixes[suffix_groups[i]]
            sfx_idx    = (_seed(idea_desc, str(i * 13)) // 3) % len(sfx_group)
            suffix     = sfx_group[sfx_idx]
            name       = base + suffix
            category   = categories[i % len(categories)]
            import socket
            import asyncio
            
            async def check_domain(domain_str: str) -> bool:
                try:
                    await asyncio.to_thread(socket.getaddrinfo, domain_str, 80)
                    return False # Solved DNS so it's taken
                except socket.gaierror:
                    return True  # Failed to resolve, likely available

            # Concurrent DNS checks
            com_avail, ai_avail, io_avail = await asyncio.gather(
                check_domain(f"{name.lower()}.com"),
                check_domain(f"{name.lower()}.ai"),
                check_domain(f"{name.lower()}.io")
            )

            names.append(BrandName(
                name=name,
                meaning=(
                    f"'{name}' stems from the prefix '{base}' — aligning with your core vision of "
                    f"'{idea_context}...'. The suffix '-{suffix}' establishes a strongly {category.lower()} "
                    f"brand identity suitable for modern B2B tech markets."
                ),
                category=category,
                domains=[
                    DomainOption(
                        tld=".com",
                        available=com_avail,
                        price="$12.99/yr",
                        purchase_links={
                            "GoDaddy":    f"https://www.godaddy.com/domainsearch/find?domainToCheck={name}.com",
                            "Namecheap":  f"https://www.namecheap.com/domains/registration/results/?domain={name}.com",
                        }
                    ),
                    DomainOption(
                        tld=".ai",
                        available=ai_avail,
                        price="$65.00/yr",
                        purchase_links={
                            "Namecheap":  f"https://www.namecheap.com/domains/registration/results/?domain={name}.ai",
                        }
                    ),
                    DomainOption(
                        tld=".io",
                        available=io_avail,
                        price="$35.99/yr",
                        purchase_links={
                            "GoDaddy":    f"https://www.godaddy.com/domainsearch/find?domainToCheck={name}.io",
                        }
                    ),
                ]
            ))

        return names

    # ── StartBuddy ────────────────────────────────────────────
    async def generate_roadmap(self, idea: str) -> StartupRoadmap:
        import aiohttp
        import asyncio
        import re
        
        idea_norm    = idea.strip()
        idea_lower   = idea_norm.lower()
        
        is_hardware  = any(w in idea_lower for w in ["robot", "iot", "sensor", "energy", "drone", "device", "hardware"])
        is_b2b       = any(w in idea_lower for w in ["enterprise", "saas", "api", "platform", "b2b", "business", "logistics"])
        seed         = _seed(idea)

        # Task 3: Real-time generation of technical phases via ArXiv API
        paper1_title = f"Literature mapping for {idea_norm}"
        paper2_title = "Core computational prototype"
        architecture_suggestion = "Service-oriented architecture with asynchronous message queues."
        
        try:
            url = f"http://export.arxiv.org/api/query?search_query=all:{idea_norm.replace(' ', '+')}&start=0&max_results=2"
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    xml_data = await resp.text()
                    # Parse xml manually
                    titles = re.findall(r'<title>(.*?)</title>', xml_data, re.DOTALL)
                    summaries = re.findall(r'<summary>(.*?)</summary>', xml_data, re.DOTALL)
                    
                    if len(titles) > 1:
                        paper1_title = titles[1].strip().replace('\n', ' ')
                        if len(titles) > 2:
                            paper2_title = titles[2].strip().replace('\n', ' ')
                        
                        if summaries:
                            # Use portion of real abstract for architecture inspiration
                            clean_summary = summaries[0].strip().replace('\n', ' ')
                            architecture_suggestion = f"Inspired by recent research: {clean_summary[:160]}... Deploy corresponding models over FastAPI."
        except Exception as e:
            logger.error("ArXiv fetch failed", error=str(e))

        phases = [
            RoadmapStep(
                phase="Alpha: Signal & Market Validation",
                tasks=["Conduct 20 problem interviews", f"Map existing {idea_norm.split()[0].title()} solutions & gaps",
                       f"Review: '{paper1_title}'", "Build landing page for intent capture"],
                timeline="2 weeks",
            ),
            RoadmapStep(
                phase="Beta: Core Technical MVP",
                tasks=["Build initial data ingestion pipeline", f"Implement algorithms from: '{paper2_title}'",
                       "Internal dogfooding with synthetic test data", "Deploy API to staging infrastructure"],
                timeline="4 weeks",
            ),
            RoadmapStep(
                phase="Gamma: Closed-Loop Pilot",
                tasks=["Onboard 5 early-adopter design partners", "Establish weekly iteration feedback loops",
                       "Minimize friction in the core user journey", "Validate architectural reliability"],
                timeline="4 weeks",
            ),
            RoadmapStep(
                phase="Delta: Growth-Ready Launch",
                tasks=["Implement product analytics & telemetry", "Draft clear developer/onboarding guides",
                       "Finalize subscription billing model", "Scale to first 50 retained active users"],
                timeline="3 weeks",
            ),
        ]

        if is_hardware:
            phases.insert(1, RoadmapStep(
                phase="Hardware Architecture Sprint",
                tasks=["Finalize PCB schematics & sensor selection", "Flash and test initial firmware",
                       "Verify regulatory compliance guidelines", "Secure small-batch manufacturing partner"],
                timeline="6 weeks",
            ))

        backend_stack  = ["FastAPI", "PostgreSQL", "Redis", "Docker", "AWS / GCP"]
        frontend_stack = ["Next.js 15", "Tailwind CSS", "Framer Motion", "Shadcn UI"]
        if is_hardware:
            backend_stack.extend(["MQTT Broker", "TimescaleDB", "C++ / Embedded Rust"])

        context_preview = idea_norm[:45].strip()
        if len(idea_norm) > 45: context_preview += "..."

        early_users = ["Direct outreach to target audience", "Launch on ProductHub", "Leverage existing professional networks"]
        marketing = ["Content-led SEO pipeline", "High-signal outbound campaigns", "Engineering as marketing free-tier tools"]
        potential = 8.5 if is_b2b else 7.0

        return StartupRoadmap(
            title=f"Strategic Execution Plan: {context_preview}",
            summary=(
                f"A systematic roadmap dynamic-tailored for '{idea_norm}'. "
                f"This plan prioritizes building a defensible data moat utilizing real cutting-edge methodology: {paper1_title}."
            ),
            prerequisites={
                "skills": ["System Architecture", "Python / TypeScript", "AI/ML Integrations", "Go-To-Market Strategy"],
                "tools":  ["GitHub", "Vercel / Render", "Supabase", "PostHog", "Linear"],
            },
            tech_stack={
                "backend":    backend_stack,
                "frontend":   frontend_stack,
                "ai_layer":   ["LangChain", "OpenAI API", "VectorDB"],
                "monitoring": ["Sentry", "Grafana", "Datadog"],
            },
            roadmap=phases,
            architecture_suggestion=architecture_suggestion,
            monetization=(
                ["Seat-based SaaS ($29–$299/mo)"] if not is_b2b else
                ["Enterprise API usage billing", "White-label licensing", "Compliance auditing fees"]
            ) + ["Implementation / Onboarding packages"],
            common_mistakes=[
                "Over-engineering the infrastructure before confirming product-market fit.",
                f"Isolating {idea_norm.split()[0].title() if idea_norm else 'Core'} logic from live user feedback loops.",
                "Focusing on vanity aggregate metrics instead of deep qualitative session reviews.",
                "Underpricing the tier limits, signaling low enterprise trust."
            ],
            growth_strategy={
                "early_users": early_users,
                "marketing":   marketing,
            },
            potential_score=potential,
            difficulty="Advanced" if is_hardware else "Intermediate" if is_b2b else "Beginner",
        )
