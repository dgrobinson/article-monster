from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.database import engine, Base
from app.routers import articles, newsletters, health, email, testing, archive

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Article Monster",
    description="Enhanced article and newsletter management system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v1")
app.include_router(articles.router, prefix="/api/v1")
app.include_router(newsletters.router, prefix="/api/v1")
app.include_router(email.router, prefix="/api/v1")
app.include_router(testing.router, prefix="/api/v1")
app.include_router(archive.router, prefix="/api/v1")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return {"message": "Article Monster API", "version": "1.0.0"}

@app.get("/dashboard")
async def dashboard():
    """Serve the web dashboard"""
    return FileResponse('static/index.html')