from fastapi import FastAPI
from pydantic import BaseModel
from app.rl.inference import rl_model

app = FastAPI()


class RLRequest(BaseModel):
    skill: float
    last_difficulty: float
    avg_time: float
    avg_attempts: float
    recent_accuracy: float


@app.get("/")
def home():
    return {"status": "RL API running"}


@app.post("/rl/next-difficulty")
def next_difficulty(data: RLRequest):
    state = [
        data.skill,
        data.last_difficulty,
        data.avg_time,
        data.avg_attempts,
        data.recent_accuracy
    ]

    difficulty = rl_model.predict(state)

    return {"difficulty": difficulty}