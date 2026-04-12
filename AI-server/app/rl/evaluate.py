# app/rl/evaluate.py

import torch
import numpy as np
from agent import PolicyNetwork
from env import StudentEnv


def run_rl(env, steps=100):
    policy = PolicyNetwork()
    policy.load_state_dict(torch.load("policy.pth", map_location="cpu"))
    policy.eval()

    state = env.reset()

    for _ in range(steps):
        state_tensor = torch.FloatTensor(state)

        with torch.no_grad():
            mean, _ = policy(state_tensor)

        difficulty = torch.sigmoid(mean).item()
        difficulty = np.clip(difficulty, 0.05, 0.95)

        state, _ = env.step(difficulty)

    return env.estimated_skill


def run_random(env, steps=100):
    state = env.reset()

    for _ in range(steps):
        difficulty = np.random.uniform(0, 1)
        state, _ = env.step(difficulty)

    return env.estimated_skill


def run_fixed(env, steps=100):
    state = env.reset()

    for _ in range(steps):
        state, _ = env.step(0.5)

    return env.estimated_skill


def evaluate(runs=20, steps=100):
    rl_gains = []
    random_gains = []
    fixed_gains = []

    for _ in range(runs):
        base_env = StudentEnv()
        base_env.reset()

        true_skill = base_env.true_skill
        initial_skill = base_env.estimated_skill

        # RL
        rl_env = StudentEnv()
        rl_env.reset()
        rl_env.true_skill = true_skill
        rl_env.estimated_skill = initial_skill

        rl_gains.append(run_rl(rl_env, steps) - initial_skill)

        # Random
        rand_env = StudentEnv()
        rand_env.reset()
        rand_env.true_skill = true_skill
        rand_env.estimated_skill = initial_skill

        random_gains.append(run_random(rand_env, steps) - initial_skill)

        # Fixed
        fixed_env = StudentEnv()
        fixed_env.reset()
        fixed_env.true_skill = true_skill
        fixed_env.estimated_skill = initial_skill

        fixed_gains.append(run_fixed(fixed_env, steps) - initial_skill)

    return {
        "rl": np.mean(rl_gains),
        "random": np.mean(random_gains),
        "fixed": np.mean(fixed_gains),
    }


if __name__ == "__main__":
    print("Running evaluation...\n")

    results = evaluate()

    print("===== FINAL RESULTS =====")
    print(f"RL Gain:      {results['rl']:.4f}")
    print(f"Random Gain:  {results['random']:.4f}")
    print(f"Fixed Gain:   {results['fixed']:.4f}")