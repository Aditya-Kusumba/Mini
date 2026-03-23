import torch
import torch.optim as optim
import pandas as pd
import numpy as np

from models.rl_policy import PolicyNetwork

policy = PolicyNetwork()

optimizer = optim.Adam(policy.parameters(), lr=0.001)

df = pd.read_csv("student_dataset.csv")

def compute_reward(row):

    reward = 0

    if row["correct"]:
        reward += 2
    else:
        reward -= 2

    if row["attempts"] > 2:
        reward -= 1

    if row["time_taken"] < 120:
        reward += 1

    return reward


def build_state(row):

    return torch.tensor([
        row["correct"],
        row["time_taken"],
        row["attempts"],
        row["difficulty"],
        row["ability_before"]
    ], dtype=torch.float32)


for epoch in range(10):

    total_loss = 0

    for _, row in df.iterrows():

        state = build_state(row)

        probs = policy(state)

        action = torch.multinomial(probs,1)

        reward = compute_reward(row)

        log_prob = torch.log(probs[action])

        loss = -log_prob * reward

        optimizer.zero_grad()

        loss.backward()

        optimizer.step()

        total_loss += loss.item()

    print("epoch:",epoch,"loss:",total_loss)

torch.save(policy.state_dict(),"rl_policy_trained.pt")

print("Training complete")