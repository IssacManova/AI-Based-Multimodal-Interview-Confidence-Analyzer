"""
One-time migration script: copies all users and sessions from users_db.json
into the new SQLite database (interview_analyzer.db).

Run once:
    python migrate_to_sqlite.py
"""
import json
import os
import sys

# Windows-safe output
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Add the parent directory so we can import auth
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from auth import get_db, hash_password, DB_PATH

JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "users_db.json")

if not os.path.exists(JSON_PATH):
    print("No users_db.json found -- nothing to migrate.")
    sys.exit(0)

with open(JSON_PATH, "r") as f:
    users = json.load(f)

migrated_users = 0
migrated_sessions = 0

with get_db() as conn:
    for username, user_data in users.items():
        # Insert user (skip if already exists)
        existing = conn.execute(
            "SELECT 1 FROM users WHERE username = ?", (username,)
        ).fetchone()

        if not existing:
            conn.execute(
                "INSERT INTO users (username, full_name, password_hash, created_at) VALUES (?, ?, ?, ?)",
                (
                    username,
                    user_data.get("full_name", ""),
                    user_data.get("password_hash", hash_password("changeme")),
                    user_data.get("created_at", "2026-01-01T00:00:00"),
                )
            )
            migrated_users += 1
            print(f"  [OK] User migrated: {username}")
        else:
            print(f"  [SKIP] User already exists: {username}")

        # Insert sessions
        for session in user_data.get("sessions", []):
            emotion_result = session.get("emotion_result", {})
            voice_result   = session.get("voice_result")
            conn.execute(
                """INSERT INTO sessions
                   (username, emotion_result, voice_result, voice_confidence, final_score, timestamp)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    username,
                    json.dumps(emotion_result),
                    json.dumps(voice_result) if voice_result is not None else None,
                    session.get("voice_confidence", 0),
                    session.get("final_score", 0),
                    session.get("timestamp", "2026-01-01T00:00:00"),
                )
            )
            migrated_sessions += 1

print(f"\n[DONE] Migration complete!")
print(f"   Users migrated:    {migrated_users}")
print(f"   Sessions migrated: {migrated_sessions}")
print(f"   SQLite DB:         {DB_PATH}")
