from fastapi import FastAPI
from routes import student_routes, simulation_routes
from routes import rl_routes
from routes.rl_routes import router as data_router

app = FastAPI(title="AI Learning Engine")

app.include_router(rl_routes.router)
app.include_router(student_routes.router)
app.include_router(simulation_routes.router)
app.include_router(data_router)