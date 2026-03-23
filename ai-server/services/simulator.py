import numpy as np
import pandas as pd

def sigmoid(x):
    return 1/(1+np.exp(-x))

def generate_dataset(students=100, problems=100):

    difficulty_map = {0:0.3,1:0.6,2:0.85}

    data=[]

    for s in range(students):

        ability=np.random.uniform(0.2,0.8)
        speed=np.random.uniform(0.4,1.0)
        learning_rate=np.random.uniform(0.01,0.05)

        for p in range(problems):

            difficulty_level=np.random.choice([0,1,2])
            difficulty=difficulty_map[difficulty_level]

            prob=sigmoid(ability-difficulty)
            correct=np.random.rand()<prob

            base_time=difficulty*200
            noise=np.random.normal(0,0.2)

            time_taken=base_time*(1+noise)/speed
            time_taken=max(20,time_taken)

            if correct:
                attempts=np.random.randint(1,3)
            else:
                attempts=np.random.randint(2,5)

            ability_before=ability

            ability+=learning_rate*difficulty
            ability=min(1,ability)

            data.append([
                s,p,difficulty_level,time_taken,attempts,int(correct),
                ability_before,ability
            ])

    df=pd.DataFrame(data,columns=[
        "student_id","problem_id","difficulty","time_taken",
        "attempts","correct","ability_before","ability_after"
    ])

    return df