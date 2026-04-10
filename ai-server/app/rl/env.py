# app/rl/env.py

import numpy as np

class StudentEnv:
    def __init__(self):
        self.reset()

    def reset(self):
        self.true_skill = np.random.uniform(0.2, 0.8)
        self.estimated_skill = 0.5
        self.last_difficulty = 0.5

        self.history = []
        return self._get_state()

    def _get_state(self):
        avg_time = np.mean([h['time'] for h in self.history]) if self.history else 0.5
        avg_attempts = np.mean([h['attempts'] for h in self.history]) if self.history else 0.5
        recent_acc = np.mean([h['correct'] for h in self.history[-5:]]) if self.history else 0.5

        return np.array([
            self.estimated_skill,
            self.last_difficulty,
            avg_time,
            avg_attempts,
            recent_acc
        ], dtype=np.float32)

    def step(self, difficulty):
        # probability of correct (IRT style)
        prob = 1 / (1 + np.exp(5 * (difficulty - self.true_skill)))
        correct = np.random.rand() < prob

        # realistic time
        time_taken = np.random.normal(
            loc=1 + (difficulty - self.true_skill),
            scale=0.2
        )
        time_taken = np.clip(time_taken, 0.2, 2.5)

        # attempts
        attempts = 1 if correct else np.random.randint(2, 4)

        # update estimated skill (ELO style)
        expected = prob
        actual = 1 if correct else 0
        self.estimated_skill += 0.1 * (actual - expected)
        self.estimated_skill = np.clip(self.estimated_skill, 0, 1)

        # reward
        reward = self._compute_reward(correct, time_taken, attempts, difficulty)

        # update history
        self.history.append({
            "time": time_taken,
            "attempts": attempts,
            "correct": correct
        })

        self.last_difficulty = difficulty

        return self._get_state(), reward

    def _compute_reward(self, correct, time_taken, attempts, difficulty):
        # correctness
        base = 1 if correct else -1

        # challenge alignment (STRONG)
        target = self.estimated_skill + 0.1
        alignment_error = abs(difficulty - target)

        # penalties
        struggle_penalty = 0.3 * time_taken + 0.3 * (attempts - 1)

        # FINAL (IMPORTANT BALANCE)
        reward = (
            1.0 * base
            - 1.2 * alignment_error     # 🔥 MUCH STRONGER
            - 0.5 * struggle_penalty
        )

        return reward