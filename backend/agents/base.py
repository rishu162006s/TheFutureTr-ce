from typing import Any, Dict
from pydantic import BaseModel

class AgentResponse(BaseModel):
    success: bool
    data: Any = None
    error: str = ""

class BaseAgent:
    def __init__(self, name: str):
        self.name = name
    def log_action(self, action: str, **kwargs):
        print(f"[{self.name}] {action} {kwargs}")
