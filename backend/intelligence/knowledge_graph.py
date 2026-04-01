import networkx as nx
from typing import List, Dict, Any, Optional
import structlog
from core.config import TECHNOLOGY_ONTOLOGY

logger = structlog.get_logger()

class KnowledgeGraph:
    def __init__(self):
        self.graph = nx.DiGraph()
        self._initialize_from_ontology()

    def _initialize_from_ontology(self):
        """Build the base graph from the predefined ontology."""
        for domain, technologies in TECHNOLOGY_ONTOLOGY.items():
            domain_node = f"domain:{domain}"
            self.graph.add_node(domain_node, type="domain", name=domain)
            
            for tech in technologies:
                tech_node = tech
                self.graph.add_node(tech_node, type="technology", name=tech, domain=domain)
                self.graph.add_edge(domain_node, tech_node, relation="contains")
        
        # Add predefined cross-domain causal links (Synthetic Intelligence)
        causal_links = [
            ("Generative Agents", "Synthetic Memory", "enables"),
            ("Synthetic Memory", "Digital Twins", "powers"),
            ("Quantum Sensing", "Edge AI", "improves"),
            ("Zero Knowledge Proofs", "Decentralized ID", "secures"),
            ("Neuro-symbolic AI", "Reasoning Engine", "underpins")
        ]
        for src, dst, rel in causal_links:
            if src in self.graph and dst in self.graph:
                self.graph.add_edge(src, dst, relation=rel, weight=0.8)
        
        logger.info("Knowledge Graph initialized", nodes=self.graph.number_of_nodes(), edges=self.graph.number_of_edges())

    def get_related_techs(self, tech: str, depth: int = 2) -> List[str]:
        if tech not in self.graph:
            return []
        
        related = set()
        for _, neighbor in nx.bfs_edges(self.graph, tech, depth_limit=depth):
            if self.graph.nodes[neighbor].get("type") == "technology":
                related.add(neighbor)
        return list(related)

    def find_path(self, start: str, end: str) -> Optional[List[str]]:
        try:
            return nx.shortest_path(self.graph, start, end)
        except (nx.NodeNotFound, nx.NetworkXNoPath):
            return None

    def get_subgraph(self, center_node: str, radius: int = 2) -> Dict[str, Any]:
        if center_node not in self.graph:
            return {"nodes": [], "edges": []}
        
        nodes = nx.ego_graph(self.graph, center_node, radius=radius)
        return {
            "nodes": [{"id": n, **self.graph.nodes[n]} for n in nodes],
            "edges": [{"source": u, "target": v, "relation": d.get("relation", "link")} for u, v, d in nodes.edges(data=True)]
        }

    def add_technology(self, name: str, domain: str):
        """Dynamically add a newly discovered technology to the graph."""
        if name not in self.graph:
            self.graph.add_node(name, type="technology", name=name, domain=domain)
            domain_node = f"domain:{domain}"
            if domain_node not in self.graph:
                self.graph.add_node(domain_node, type="domain", name=domain)
            self.graph.add_edge(domain_node, name, relation="contains")
            
            # Connect to related nodes in same domain
            techs_in_domain = [n for n, d in self.graph.nodes(data=True) 
                              if d.get("type") == "technology" and d.get("domain") == domain and n != name]
            
            import random
            if techs_in_domain:
                for _ in range(min(2, len(techs_in_domain))):
                    target = random.choice(techs_in_domain)
                    self.graph.add_edge(name, target, relation="related", weight=random.random())
