"""
voice_module.py  –  High-accuracy, offline voice analysis using OpenAI Whisper.

Why Whisper?
  • Runs fully offline — no Google API rate-limits or network errors.
  • Dramatically more accurate than SpeechRecognition on noisy / accented audio.
  • The "base" model (~150 MB) loads once per Python process and is reused.

Fallback chain:
  1. Whisper (offline, best accuracy)
  2. Google Web Speech API  (requires internet)
  3. Graceful error result so the session is never blocked.
"""

import io
import time
import tempfile
import os

import numpy as np

# ── Optional heavy imports — guarded so the module still loads even if a
#    library is missing (the fallback chain covers that case).
try:
    import whisper as _whisper
    _whisper_model = _whisper.load_model("base")   # load once at import time
    WHISPER_AVAILABLE = True
    print("[voice_module] Whisper 'base' model loaded successfully.")
except Exception as _e:
    WHISPER_AVAILABLE = False
    _whisper_model   = None
    print(f"[voice_module] Whisper unavailable ({_e}). Will fall back to Google SR.")

try:
    import speech_recognition as sr
    SR_AVAILABLE = True
except ImportError:
    SR_AVAILABLE = False

try:
    from textblob import TextBlob
    TB_AVAILABLE = True
except ImportError:
    TB_AVAILABLE = False


# ── Sentiment helper ──────────────────────────────────────────────────────────
def _sentiment(text: str) -> str:
    """Map TextBlob polarity → Positive / Neutral / Negative label."""
    if not text or not TB_AVAILABLE:
        return "Neutral"
    score = TextBlob(text).sentiment.polarity
    if score > 0.05:
        return "Positive"
    if score < -0.05:
        return "Negative"
    return "Neutral"


# ── Whisper transcription ─────────────────────────────────────────────────────
def _transcribe_whisper(audio_np: np.ndarray, sample_rate: int = 16_000) -> str:
    """
    Transcribe a float32 numpy audio array with the pre-loaded Whisper model.
    Whisper expects mono float32 audio normalised to [-1, 1] at 16 kHz.
    """
    if _whisper_model is None:
        raise RuntimeError("Whisper model not loaded")

    # Resample to 16 kHz if needed (SpeechRecognition captures at 16 kHz by default)
    audio_float = audio_np.astype(np.float32)
    if audio_float.max() > 1.0:
        audio_float /= 32768.0   # int16 → float32

    result = _whisper_model.transcribe(audio_float, language="en", fp16=False)
    return result["text"].strip()


# ── Google SR fallback ────────────────────────────────────────────────────────
def _transcribe_google(recognizer, audio) -> str:
    return recognizer.recognize_google(audio, language="en-US")


# ── Main public function ──────────────────────────────────────────────────────
def run_voice_analysis() -> dict:
    """
    Record from the system microphone for up to 30 seconds and return:
      {
        "text":      str,   # full transcription
        "sentiment": str,   # Positive / Neutral / Negative
        "speed":     float, # words per second
      }
    """
    if not SR_AVAILABLE:
        return {
            "text":      "[SpeechRecognition library not installed]",
            "sentiment": "Neutral",
            "speed":     0.0,
        }

    recognizer = sr.Recognizer()
    recognizer.energy_threshold       = 250    # lower = more sensitive
    recognizer.dynamic_energy_threshold = True
    recognizer.pause_threshold        = 1.0    # seconds of silence that ends phrase

    text = ""
    phrase_start = time.time()

    try:
        with sr.Microphone(sample_rate=16_000) as source:
            print("[voice_module] Calibrating for ambient noise…")
            recognizer.adjust_for_ambient_noise(source, duration=1.0)
            print("[voice_module] Listening (up to 28 s)…")
            audio = recognizer.listen(source, phrase_time_limit=28)

        phrase_end  = time.time()
        duration    = max(phrase_end - phrase_start, 1.0)

        # ── Attempt 1: Whisper (offline) ──────────────────────────────────
        if WHISPER_AVAILABLE:
            try:
                # Convert SpeechRecognition AudioData → raw int16 numpy array
                raw_bytes  = audio.get_raw_data(convert_rate=16_000, convert_width=2)
                audio_np   = np.frombuffer(raw_bytes, dtype=np.int16)
                text       = _transcribe_whisper(audio_np, sample_rate=16_000)
                print(f'[voice_module] Whisper: "{text}"')
            except Exception as e:
                print(f"[voice_module] Whisper failed ({e}), trying Google SR…")
                text = ""

        # ── Attempt 2: Google Web Speech API ─────────────────────────────
        if not text and SR_AVAILABLE:
            try:
                text = _transcribe_google(recognizer, audio)
                print(f'[voice_module] Google SR: "{text}"')
            except sr.UnknownValueError:
                print("[voice_module] Google SR could not understand audio.")
            except sr.RequestError as e:
                print(f"[voice_module] Google SR API error: {e}")

        # ── Nothing recognised ────────────────────────────────────────────
        if not text:
            return {
                "text":      "[Could not transcribe speech — speak louder or check mic]",
                "sentiment": "Neutral",
                "speed":     0.0,
            }

        word_count     = len(text.split())
        speaking_speed = round(word_count / duration, 2)

        return {
            "text":      text,
            "sentiment": _sentiment(text),
            "speed":     speaking_speed,
        }

    except Exception as e:
        print(f"[voice_module] Unexpected error: {e}")
        return {
            "text":      "[Voice analysis error — check microphone]",
            "sentiment": "Neutral",
            "speed":     0.0,
        }