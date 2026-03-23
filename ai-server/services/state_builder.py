import numpy as np

def build_state(features):

    state = np.array([
        features["recent_accuracy"],
        features["avg_time"],
        features["attempts_avg"],
        features["consistency"],
        features["performance_score"]
    ])

    return state