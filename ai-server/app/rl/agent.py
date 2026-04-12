import torch
import torch.nn as nn
import torch.nn.functional as F


class PolicyNetwork(nn.Module):
    def __init__(self):
        super().__init__()

        self.shared = nn.Sequential(
            nn.Linear(5, 64),
            nn.ReLU(),
            nn.Linear(64, 64),
            nn.ReLU()
        )

        # 🎯 actor (mean + std)
        self.mean = nn.Linear(64, 1)
        self.log_std = nn.Parameter(torch.ones(1) * -1.0)

        # 🎯 critic (value)
        self.value = nn.Linear(64, 1)

    def forward(self, x):
        x = self.shared(x)

        mean = self.mean(x)
        std = torch.exp(self.log_std)

        value = self.value(x)

        return mean, std, value