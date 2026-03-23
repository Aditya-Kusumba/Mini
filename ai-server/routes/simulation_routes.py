from fastapi import APIRouter
from services.simulator import generate_dataset

router = APIRouter()

@router.post("/simulation/generate-dataset")
def simulate():

    df = generate_dataset()

    path="student_dataset.csv"
    df.to_csv(path,index=False)

    return {
        "message":"dataset generated",
        "rows":len(df),
        "file":path
    }