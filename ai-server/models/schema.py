from pydantic import BaseModel
from typing import List


class Interaction(BaseModel):
    user_id: int
    problem_id: int
    difficulty: int
    topic: str
    time_taken: float
    attempts: int
    correct: int

from pydantic import BaseModel

class RLFeatures(BaseModel):

    recent_accuracy: float
    avg_time: float
    attempts_avg: float
    consistency: float
    performance_score: float


class RLRequest(BaseModel):

    features: RLFeatures
    current_difficulty: int

class StateRequest(BaseModel):
    state: List[float]