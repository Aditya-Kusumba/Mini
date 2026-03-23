from fastapi import APIRouter
import torch

from app.rl.agent import Policy
from models.schema import StateRequest

router = APIRouter()

policy = Policy()
policy.load_state_dict(torch.load("rl_model.pt"))
policy.eval()


@router.post("/next-question")
def next_question(request: StateRequest):

    state = torch.tensor(request.state, dtype=torch.float32)

    mean, _ = policy(state)
    ability = request.state[0]

    # amplify ability influence
    difficulty = 0.3 * difficulty + 0.7 * ability

    # push into challenge zone
    difficulty += 0.1

    difficulty = max(0.1, min(1.0, difficulty))

    difficulty = max(0.1, min(1.0, difficulty))

    return {
        "difficulty": difficulty
    }