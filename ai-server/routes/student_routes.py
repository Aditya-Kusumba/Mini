from fastapi import APIRouter
from models.schema import Interaction
from services.feature_engineering import compute_features
import pandas as pd

router = APIRouter()

student_history = {}

@router.post("/student/update-interaction")
def update_interaction(data: Interaction):

    uid = data.user_id

    row = data.dict()

    if uid not in student_history:
        student_history[uid] = []

    student_history[uid].append(row)

    df = pd.DataFrame(student_history[uid])

    features = compute_features(df)

    return {
        "message": "interaction stored",
        "features": features
    }