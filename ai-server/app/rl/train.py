import torch
import pandas as pd

from env import StudentEnv
from agent import Agent

agent = Agent()
env = StudentEnv()

data = []

EPISODES = 1500
STEPS = 50

for episode in range(EPISODES):

    state = env.reset()

    log_probs = []
    rewards = []
    raw_rewards = []

    for t in range(STEPS):

        action, log_prob = agent.get_action(state)
        next_state, reward, _, _ = env.step(action.item())

        data.append({
            "state": state.tolist(),
            "action": float(action.item()),
            "reward": float(reward),
            "next_state": next_state.tolist()
        })

        log_probs.append(log_prob)
        rewards.append(reward)
        raw_rewards.append(reward)

        state = next_state

    agent.update(log_probs, rewards)

    if episode % 100 == 0:
        print(f"episode: {episode} raw_reward: {sum(raw_rewards):.2f}")

torch.save(agent.policy.state_dict(), "rl_model.pt")

df = pd.DataFrame(data)
df.to_csv("rl_dataset.csv", index=False)

print("✅ training done + dataset saved")