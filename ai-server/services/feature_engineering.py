import pandas as pd

def compute_features(df):

    last5 = df.tail(5)

    recent_accuracy = last5["correct"].mean()

    avg_time = last5["time_taken"].mean()

    attempts_avg = last5["attempts"].mean()

    consistency = 1 - last5["correct"].std()

    performance_score = (
        0.4 * recent_accuracy +
        0.3 * (1/(1+avg_time)) +
        0.2 * consistency +
        0.1 * (1/(1+attempts_avg))
    )

    return {
        "recent_accuracy": recent_accuracy,
        "avg_time": avg_time,
        "attempts_avg": attempts_avg,
        "consistency": consistency,
        "performance_score": performance_score
    }