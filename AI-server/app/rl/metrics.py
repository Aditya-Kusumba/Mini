# app/rl/metrics.py

import numpy as np

def compute_alignment(skill, difficulty):
    target = skill + 0.1
    return 1 - abs(difficulty - target)

def compute_returns(rewards, gamma=0.99):
    returns = []
    G = 0
    for r in reversed(rewards):
        G = r + gamma * G
        returns.insert(0, G)
    return returns