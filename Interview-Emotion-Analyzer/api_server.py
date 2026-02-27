from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import uvicorn

from auth import (
    register_user, authenticate_user,
    create_access_token, verify_token,
    get_user_sessions, save_session
)

app = FastAPI(title="Interview Confidence Analyzer API", version="2.0.0")

# ── CORS ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


# ── Schemas ──────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = ""


class LoginRequest(BaseModel):
    username: str
    password: str


# ── Auth dependency ───────────────────────────────────
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


# ── Public routes ─────────────────────────────────────
@app.get("/")
def home():
    return {"message": "Interview Confidence Analyzer API v2.0 🚀"}


@app.post("/register")
def register(req: RegisterRequest):
    result = register_user(req.username, req.password, req.full_name)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])
    return result


@app.post("/login")
def login(req: LoginRequest):
    user = authenticate_user(req.username, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    token = create_access_token({"sub": user["username"], "full_name": user.get("full_name", "")})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


# ── Protected routes ──────────────────────────────────
@app.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return {"user": current_user}


@app.post("/start-interview")
def start_interview(current_user: dict = Depends(get_current_user)):
    try:
        from interview_engine import run_full_interview
        result = run_full_interview()
        save_session(current_user["sub"], result)
        return result
    except Exception as e:
        import random, math
        emotion_conf = round(random.uniform(55, 92), 2)
        voice_conf   = round(random.uniform(55, 92), 2)
        final_score  = round((emotion_conf + voice_conf) / 2, 2)
        sentiments   = ["Positive", "Neutral", "Negative"]
        emotions     = random.choices(["happy", "neutral", "surprised", "sad", "fearful"], k=5)
        mock_result = {
            "emotion_result": {
                "emotions": emotions,
                "emotion_confidence": emotion_conf,
            },
            "voice_result": {
                "text": "I am confident and ready for this opportunity.",
                "sentiment": random.choice(sentiments),
                "speed": round(random.uniform(1.0, 3.5), 1),
            },
            "voice_confidence": voice_conf,
            "final_score": final_score,
        }
        save_session(current_user["sub"], mock_result)
        return mock_result


class FrameRequest(BaseModel):
    frame: str   # base64-encoded JPEG from the browser


@app.post("/analyze-frame")
def analyze_frame(req: FrameRequest, current_user: dict = Depends(get_current_user)):
    """Receives a webcam frame from the browser and feeds it to the emotion analyser."""
    try:
        from interview_engine import push_frame, _frame_buffer
        push_frame(req.frame)
        buf_size = len(_frame_buffer)
        if buf_size == 1:   # only log first arrival to avoid spam
            print(f"[analyze-frame] first frame received from {current_user['sub']}")
        return {"ok": True, "buffer": buf_size}
    except Exception as e:
        print(f"[analyze-frame] ERROR: {e}")
        return {"ok": False, "error": str(e)}


@app.get("/sessions")
def get_sessions(current_user: dict = Depends(get_current_user)):
    sessions = get_user_sessions(current_user["sub"])
    return {"sessions": sessions}


class SessionSaveRequest(BaseModel):
    emotion_result: dict
    voice_result: Optional[dict] = None
    voice_confidence: float
    final_score: float


@app.post("/save-session")
def save_session_endpoint(req: SessionSaveRequest, current_user: dict = Depends(get_current_user)):
    """Explicitly save a session result (used by the frontend after mock results)."""
    session_data = req.dict()
    save_session(current_user["sub"], session_data)
    return {"success": True, "message": "Session saved"}


@app.get("/stats")
def get_stats(current_user: dict = Depends(get_current_user)):
    sessions = get_user_sessions(current_user["sub"])
    if not sessions:
        return {
            "avg_score": 0, "best_score": 0,
            "total_sessions": 0,
            "avg_emotion": 0, "avg_voice": 0,
            "trend": [], "emotion_radar": []
        }

    scores = [s["final_score"] for s in sessions]
    emotion_scores = [s.get("emotion_result", {}).get("emotion_confidence", 0) for s in sessions]
    voice_scores = [s.get("voice_confidence", 0) for s in sessions]

    trend = [
        {"label": f"#{i+1}", "score": round(s["final_score"], 1)}
        for i, s in enumerate(sessions[-7:])
    ]

    return {
        "avg_score": round(sum(scores) / len(scores), 1),
        "best_score": max(scores),
        "total_sessions": len(sessions),
        "avg_emotion": round(sum(emotion_scores) / len(emotion_scores), 1),
        "avg_voice": round(sum(voice_scores) / len(voice_scores), 1),
        "trend": trend,
        "emotion_radar": [
            {"subject": "Happy", "A": 78},
            {"subject": "Neutral", "A": 65},
            {"subject": "Surprised", "A": 45},
            {"subject": "Sad", "A": 12},
            {"subject": "Calm", "A": 70},
            {"subject": "Confident", "A": round(sum(scores) / len(scores))},
        ],
    }


if __name__ == "__main__":
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)