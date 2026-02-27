import jwt
import hashlib
import json
import os
import sqlite3
from datetime import datetime, timedelta
from contextlib import contextmanager

SECRET_KEY = "interview_analyzer_secret_2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# SQLite DB lives next to this file — always the same location regardless of CWD
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "interview_analyzer.db")


# ── DB connection helper ──────────────────────────────
@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row          # rows behave like dicts
    conn.execute("PRAGMA journal_mode=WAL") # safe for concurrent writes
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ── Schema creation (runs on every startup, safe to re-run) ──
def init_db():
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                username     TEXT PRIMARY KEY,
                full_name    TEXT NOT NULL DEFAULT '',
                password_hash TEXT NOT NULL,
                created_at   TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                username         TEXT NOT NULL,
                emotion_result   TEXT NOT NULL,   -- JSON
                voice_result     TEXT,            -- JSON or NULL
                voice_confidence REAL NOT NULL DEFAULT 0,
                final_score      REAL NOT NULL DEFAULT 0,
                timestamp        TEXT NOT NULL,
                FOREIGN KEY (username) REFERENCES users(username)
            );

            CREATE INDEX IF NOT EXISTS idx_sessions_username
                ON sessions(username);
        """)


# initialise schema immediately on import
init_db()


# ── Password helpers ──────────────────────────────────
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


# ── JWT helpers ───────────────────────────────────────
def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


# ── User management ───────────────────────────────────
def register_user(username: str, password: str, full_name: str = "") -> dict:
    with get_db() as conn:
        existing = conn.execute(
            "SELECT username FROM users WHERE username = ?", (username,)
        ).fetchone()
        if existing:
            return {"success": False, "message": "Username already exists"}
        conn.execute(
            "INSERT INTO users (username, full_name, password_hash, created_at) VALUES (?, ?, ?, ?)",
            (username, full_name, hash_password(password), datetime.utcnow().isoformat())
        )
    return {"success": True, "message": "User registered successfully"}


def authenticate_user(username: str, password: str) -> dict | None:
    with get_db() as conn:
        row = conn.execute(
            "SELECT username, full_name, password_hash FROM users WHERE username = ?",
            (username,)
        ).fetchone()
    if not row:
        return None
    if row["password_hash"] != hash_password(password):
        return None
    return {"username": row["username"], "full_name": row["full_name"]}


# ── Session management ────────────────────────────────
def save_session(username: str, session_data: dict):
    """Save a completed interview session to the database."""
    timestamp = session_data.get("timestamp") or datetime.utcnow().isoformat()
    emotion_result = session_data.get("emotion_result", {})
    voice_result   = session_data.get("voice_result")

    with get_db() as conn:
        # Verify user exists
        if not conn.execute(
            "SELECT 1 FROM users WHERE username = ?", (username,)
        ).fetchone():
            return
        conn.execute(
            """INSERT INTO sessions
               (username, emotion_result, voice_result, voice_confidence, final_score, timestamp)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                username,
                json.dumps(emotion_result),
                json.dumps(voice_result) if voice_result is not None else None,
                session_data.get("voice_confidence", 0),
                session_data.get("final_score", 0),
                timestamp,
            )
        )


def get_user_sessions(username: str) -> list:
    """Return all sessions for a user, newest first."""
    with get_db() as conn:
        rows = conn.execute(
            """SELECT emotion_result, voice_result, voice_confidence, final_score, timestamp
               FROM sessions
               WHERE username = ?
               ORDER BY timestamp ASC""",
            (username,)
        ).fetchall()

    sessions = []
    for row in rows:
        sessions.append({
            "emotion_result":   json.loads(row["emotion_result"]),
            "voice_result":     json.loads(row["voice_result"]) if row["voice_result"] else None,
            "voice_confidence": row["voice_confidence"],
            "final_score":      row["final_score"],
            "timestamp":        row["timestamp"],
        })
    return sessions

