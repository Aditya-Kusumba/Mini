import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np

class Policy(nn.Module):

    def __init__(self):
        super().__init__()

        self.net = nn.Sequential(
            nn.Linear(5, 64),
            nn.ReLU(),
            nn.Linear(64, 64),
            nn.ReLU()
        )

        self.mean = nn.Linear(64, 1)
        self.log_std = nn.Parameter(torch.ones(1) * -1.0)

    def forward(self, x):
        x = self.net(x)
        mean = torch.sigmoid(self.mean(x))
        std = torch.exp(self.log_std)
        return mean, std


class Agent:

    def __init__(self):
        self.policy = Policy()
        self.optimizer = optim.Adam(self.policy.parameters(), lr=1e-3)

    def get_action(self, state):
        state = torch.tensor(state, dtype=torch.float32)

        mean, std = self.policy(state)
        dist = torch.distributions.Normal(mean, std)

        action = dist.sample()
        return action.clamp(0, 1), dist.log_prob(action)

    def update(self, log_probs, rewards):

        rewards = np.array(rewards)
        baseline = rewards.mean()

        loss = 0

        for log_prob, reward in zip(log_probs, rewards):
            advantage = reward - baseline
            loss += -log_prob * advantage

        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()