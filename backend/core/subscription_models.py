from pydantic import BaseModel, Field

class UserStatus(BaseModel):
    credits: int = 100
    is_subscribed: bool = False
    subscription_plan: str = "Basic"
    total_usage: int = 0

class SubscriptionRequest(BaseModel):
    plan: str
    payment_method: str = "virtual"
