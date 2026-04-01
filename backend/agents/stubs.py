from typing import Any
from agents.base import BaseAgent, AgentResponse

class ScoutAgent(BaseAgent):
    def __init__(self):
        super().__init__("ScoutAgent")
    async def process(self, data=None):
        return AgentResponse(success=True, data=[])

class AnalystAgent(BaseAgent):
    def __init__(self):
        super().__init__("AnalystAgent")
    def process_signals(self, data):
        return AgentResponse(success=True, data=[])

class StrategistAgent(BaseAgent):
    def __init__(self):
        super().__init__("StrategistAgent")

class MemoryAgent(BaseAgent):
    def __init__(self):
        super().__init__("MemoryAgent")
    async def set_session_cache(self, k, v):
        pass
