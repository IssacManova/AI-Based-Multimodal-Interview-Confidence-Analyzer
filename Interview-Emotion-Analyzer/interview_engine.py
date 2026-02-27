import time
import threading
import base64
import cv2
import numpy as np
from collections import deque
from emotion_module import detect_emotion
from voice_module import run_voice_analysis


# ── Shared frame buffer ───────────────────────────────────────────────────────
# The browser sends webcam frames to /analyze-frame during the session.
# We keep the latest frame in this buffer for the emotion thread to read.
_frame_buffer = deque(maxlen=1)   # only latest frame matters
_buffer_lock  = threading.Lock()


def push_frame(jpeg_b64: str):
    """Called by the API when the browser sends a webcam frame."""
    try:
        img_bytes = base64.b64decode(jpeg_b64)
        arr = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if frame is not None:
            with _buffer_lock:
                _frame_buffer.appendleft(frame)
    except Exception as e:
        print(f"[interview_engine] frame decode error: {e}")


def _get_latest_frame():
    with _buffer_lock:
        return _frame_buffer[0] if _frame_buffer else None


# ── Emotion analysis (reads frames pushed by browser) ────────────────────────
def run_emotion_analysis(duration=30):
    emotion_history = []
    start_time = time.time()
    last_analysis = 0

    while time.time() - start_time < duration:
        now = time.time()
        # Analyse at most 4 frames/second to keep CPU sane
        if now - last_analysis < 0.25:
            time.sleep(0.05)
            continue

        frame = _get_latest_frame()
        if frame is not None:
            emotion = detect_emotion(frame)
            if emotion:
                emotion_history.append(emotion)
            last_analysis = now
        else:
            time.sleep(0.1)

    positive = emotion_history.count("happy") + emotion_history.count("neutral")
    total    = len(emotion_history)
    confidence = round((positive / total) * 100, 2) if total > 0 else 0

    return {
        "emotions": emotion_history,
        "emotion_confidence": confidence,
    }


# ── Full interview (emotion + voice in parallel) ──────────────────────────────
def run_full_interview():
    """
    Emotion analysis reads frames pushed from the browser via push_frame().
    Voice analysis records from the system microphone simultaneously.
    Both run in parallel threads.
    """
    emotion_result = None
    voice_result   = None

    def _emotion():
        nonlocal emotion_result
        emotion_result = run_emotion_analysis(duration=30)

    def _voice():
        nonlocal voice_result
        voice_result = run_voice_analysis()

    t_emotion = threading.Thread(target=_emotion, daemon=True)
    t_voice   = threading.Thread(target=_voice,   daemon=True)

    t_emotion.start()
    t_voice.start()

    t_emotion.join(timeout=35)
    t_voice.join(timeout=35)

    # Score voice confidence
    voice_confidence = 0
    if voice_result and voice_result.get("speed", 0) > 0:
        speed = voice_result["speed"]
        voice_confidence = 80 if 1 <= speed <= 3 else 50
    elif voice_result:
        voice_confidence = 30  # transcription attempted but speed=0

    final_score = round(
        (emotion_result["emotion_confidence"] + voice_confidence) / 2, 2
    )

    return {
        "emotion_result":   emotion_result,
        "voice_result":     voice_result,
        "voice_confidence": voice_confidence,
        "final_score":      final_score,
    }