# app/rl/trainer.py

import torch
import numpy as np
from torch.distributions import Normal
from env import StudentEnv
from agent import PolicyNetwork
from metrics import compute_returns, compute_alignment

def train():
    env = StudentEnv()
    policy = PolicyNetwork()

    optimizer = torch.optim.Adam(policy.parameters(), lr=1e-3)

    EPISODES = 6000
    GAMMA = 0.99

    reward_history = []
    alignment_scores = []

    for episode in range(EPISODES):
        state = env.reset()

        log_probs = []
        rewards = []
        alignments = []

        for step in range(50):
            state_tensor = torch.FloatTensor(state)

            mean, std = policy(state_tensor)
            dist = Normal(mean, std)

            action = dist.sample()
            log_prob = dist.log_prob(action)

            difficulty = torch.sigmoid(action).item()

            next_state, reward = env.step(difficulty)

            # alignment tracking
            skill = state[0]
            alignments.append(compute_alignment(skill, difficulty))

            log_probs.append(log_prob)
            rewards.append(reward)

            state = next_state

        returns = compute_returns(rewards, GAMMA)
        returns = torch.FloatTensor(returns)

        log_probs = torch.stack(log_probs).squeeze()

        # normalize returns (stability)
        returns = (returns - returns.mean()) / (returns.std() + 1e-8)

        entropy = dist.entropy().mean()
        loss = -(log_probs * returns).mean() - 0.01 * entropy

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        reward_history.append(np.sum(rewards))
        alignment_scores.append(np.mean(alignments))

        if episode % 200 == 0:
            print(f"Episode {episode}")
            print(f"Avg Reward: {np.mean(reward_history[-100:]):.3f}")
            print(f"Alignment: {np.mean(alignment_scores[-100:]):.3f}")
            print("------")

    torch.save(policy.state_dict(), "policy.pth")
    print("Model saved!")

if __name__ == "__main__":
    train()