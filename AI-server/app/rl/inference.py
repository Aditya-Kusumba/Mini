import torch
import numpy as np
from app.rl.agent import PolicyNetwork


class RLInference:
    def __init__(self):
        self.policy = PolicyNetwork()
        self.policy.load_state_dict(torch.load("policy.pth", map_location="cpu"))
        self.policy.eval()

        # 🔥 observed range from your training (can adjust later if needed)
        self.min_difficulty = 0.4
        self.max_difficulty = 0.55

    def _normalize(self, raw_difficulty):
        """
        Normalize RL output (0.2–0.45) → (0–1)
        """
        normalized = (raw_difficulty - self.min_difficulty) / (
            self.max_difficulty - self.min_difficulty
        )
        return float(np.clip(normalized, 0.0, 1.0))

    def _get_label(self, difficulty):
        """
        Convert difficulty score → label for LLM
        """
        if difficulty < 0.3:
            return "easy"
        elif difficulty < 0.7:
            return "medium"
        else:
            return "hard"

    def predict(self, state):
        """
        Input: state (5 features)
        Output:
            {
                raw_difficulty,
                difficulty_score (0–1),
                difficulty_label
            }
        """

        state = np.array(state, dtype=np.float32)
        state_tensor = torch.FloatTensor(state)

        with torch.no_grad():
            mean, std, _ = self.policy(state_tensor)

        difficulty = torch.sigmoid(mean).item()
        difficulty = float(np.clip(difficulty, 0.05, 0.95))

        return {
            "difficulty": difficulty
        }

rl_model = RLInference()