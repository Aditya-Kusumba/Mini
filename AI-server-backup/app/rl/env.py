import numpy as np

class StudentEnv:

    def __init__(self):
        self.reset()

    def reset(self):
        self.true_ability = np.random.uniform(0.3, 0.7)
        self.estimated_ability = 0.5
        self.difficulty = 0.1
        return self._get_state()

    def sigmoid(self, x):
        return 1 / (1 + np.exp(-x))

    def step(self, action):

        # smooth difficulty update
        difficulty = self.difficulty + 0.3 * (action - self.difficulty)
        difficulty = np.clip(difficulty, 0.1, 1.0)

        prob = self.sigmoid(self.true_ability - difficulty)
        correct = np.random.rand() < prob

        time_taken = max(20, (difficulty / self.true_ability) * 100)
        attempts = np.random.randint(1, 3) if correct else np.random.randint(2, 5)

        # update estimated ability
        lr = 0.1
        error = difficulty - self.estimated_ability

        if correct:
            self.estimated_ability += lr * error
        else:
            self.estimated_ability -= lr * abs(error)

        self.estimated_ability = np.clip(self.estimated_ability, 0, 1)

        # ===== CLEAN STABLE REWARD =====
        reward = 0

        # correctness
        reward += 1 if correct else -1

        # encourage challenge zone
        target = self.estimated_ability + 0.1
        reward -= abs(difficulty - target)

        # penalties
        reward -= 0.1 * attempts
        reward -= 0.05 * (time_taken / 100)

        # learning effect
        if correct:
            self.true_ability += 0.02 * difficulty

        self.true_ability = np.clip(self.true_ability, 0, 1)
        self.difficulty = difficulty

        return self._get_state(), reward, False, {}

    def _get_state(self):
        return np.array([
            self.estimated_ability,
            self.difficulty,
            0.5,
            0.5,
            0.5
        ])