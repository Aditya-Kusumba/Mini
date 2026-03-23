import torch
from models.rl_policy import PolicyNetwork

policy = PolicyNetwork()

def choose_action(state):

    state_tensor = torch.tensor(state, dtype=torch.float32)

    probs = policy(state_tensor)

    action = torch.multinomial(probs,1).item()

    return action, probs.detach().numpy()

def difficulty_from_action(action,current_difficulty):

    if action == 0:
        return max(0,current_difficulty-1)

    if action == 1:
        return current_difficulty

    if action == 2:
        return min(2,current_difficulty+1)