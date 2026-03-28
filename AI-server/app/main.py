from fastapi import FastAPI
from app.routes import student_routes, simulation_routes

app = FastAPI(title="AI Learning Engine")

app.include_router(student_routes.router)
app.include_router(simulation_routes.router)