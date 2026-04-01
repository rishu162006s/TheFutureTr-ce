from typing import Dict, List, Any

class Settings:
    APP_NAME = "Sanskriti"
    APP_VERSION = "2.0.0"
    EMBEDDING_MODEL = "all-MiniLM-L6-v2"

settings = Settings()

DOMAINS = ["Artificial Intelligence", "Cybersecurity", "AR/VR", "Robotics", "IoT"]
DOMAIN_COLORS = {
    "Artificial Intelligence": "#3b82f6",
    "Cybersecurity": "#ef4444",
    "AR/VR": "#8b5cf6",
    "Robotics": "#f59e0b",
    "IoT": "#10b981",
}

TECHNOLOGY_ONTOLOGY = {
    "Artificial Intelligence": [
        "AI Agent", "RAG", "Vector Database", "Fine-tuning", "LLM Ops"
    ],
    "Cybersecurity": [
        "Zero Trust", "Confidential Computing", "Post-Quantum Cryptography"
    ],
    "Robotics": [
        "Autonomous Robot", "Soft Robotics", "Haptic Interface"
    ],
    "IoT": [
        "Digital Twin", "IOT Edge", "Swarm Intelligence"
    ],
    "AR/VR": [
        "Spatial Computing", "Gaussian Splatting"
    ]
}

MATURITY_SCORES = {
    "adopt": (0.8, 1.0),
    "trial": (0.6, 0.8),
    "assess": (0.4, 0.6),
    "hold": (0.0, 0.4),
}
