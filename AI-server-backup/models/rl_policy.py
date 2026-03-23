import torch
import torch.nn as nn
import torch.nn.functional as F

class PolicyNetwork(nn.Module):

    def __init__(self, state_size=5, action_size=3):
        super().__init__()

        self.fc1 = nn.Linear(state_size, 32)
        self.fc2 = nn.Linear(32, 32)
        self.fc3 = nn.Linear(32, action_size)

    def forward(self, x):

        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = self.fc3(x)

        return F.softmax(x, dim=-1)