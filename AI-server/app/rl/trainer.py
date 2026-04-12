import torch
import numpy as np
from torch.distributions import Normal
from env import StudentEnv
from agent import PolicyNetwork
import torch.nn.functional as F


def compute_returns(rewards, gamma=0.99):
    returns = []
    G = 0
    for r in reversed(rewards):
        G = r + gamma * G
        returns.insert(0, G)
    return returns


from torch.distributions import Normal

def train():
    env = StudentEnv()
    policy = PolicyNetwork()

    optimizer = torch.optim.Adam(policy.parameters(), lr=1e-3)

    EPISODES = 4000
    GAMMA = 0.99

    for episode in range(EPISODES):
        state = env.reset()

        log_probs = []
        rewards = []
        values = []

        for step in range(50):
            state_tensor = torch.FloatTensor(state)

            mean, std, value = policy(state_tensor)
            dist = Normal(mean, std)

            action = dist.sample()
            log_prob = dist.log_prob(action)

            difficulty = torch.sigmoid(action).item()

            next_state, reward = env.step(difficulty)

            log_probs.append(log_prob)
            rewards.append(reward)
            values.append(value)

            state = next_state

        returns = []
        G = 0
        for r in reversed(rewards):
            G = r + GAMMA * G
            returns.insert(0, G)

        returns = torch.FloatTensor(returns)
        values = torch.stack(values).squeeze()

        # 🔥 ADVANTAGE (KEY)
        advantage = returns - values.detach()

        log_probs = torch.stack(log_probs).squeeze()

        # 🎯 actor loss
        actor_loss = -(log_probs * advantage).mean()

        # 🎯 critic loss
        critic_loss = F.mse_loss(values, returns)

        loss = actor_loss + 0.5 * critic_loss

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        if episode % 200 == 0:
            print(f"Episode {episode}, Reward: {sum(rewards):.2f}")

    torch.save(policy.state_dict(), "policy.pth")


if __name__ == "__main__":
    train()