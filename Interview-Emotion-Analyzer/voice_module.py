import speech_recognition as sr
from textblob import TextBlob
import time

def run_voice_analysis():
    recognizer = sr.Recognizer()

    # Tweak recognizer sensitivity for cleaner captures
    recognizer.energy_threshold = 300        # minimum mic energy to count as speech
    recognizer.dynamic_energy_threshold = True
    recognizer.pause_threshold = 0.8         # seconds of silence that ends a phrase

    with sr.Microphone() as source:
        # Calibrate against ambient noise for ~1 second before recording
        recognizer.adjust_for_ambient_noise(source, duration=1)

        phrase_start = time.time()
        # phrase_time_limit keeps us within the 30-second interview window
        audio = recognizer.listen(source, phrase_time_limit=28)
        phrase_end = time.time()

    # Use actual speech duration (capped to a minimum of 1s to avoid division by zero)
    duration = max(phrase_end - phrase_start, 1.0)

    try:
        # Use Google Web Speech API for transcription
        text = recognizer.recognize_google(audio, language="en-US")

        # Sentiment via TextBlob
        sentiment_score = TextBlob(text).sentiment.polarity
        if sentiment_score > 0.05:
            sentiment = "Positive"
        elif sentiment_score < -0.05:
            sentiment = "Negative"
        else:
            sentiment = "Neutral"

        word_count = len(text.split())
        speaking_speed = round(word_count / duration, 2)

        return {
            "text": text,
            "sentiment": sentiment,
            "speed": speaking_speed,
        }

    except sr.UnknownValueError:
        # Google could not understand the audio
        print("[voice_module] Speech not recognised — audio may be too quiet or unclear.")
        return {
            "text": "[Could not transcribe speech]",
            "sentiment": "Neutral",
            "speed": 0.0,
        }
    except sr.RequestError as e:
        # Network / API error
        print(f"[voice_module] Google Speech API error: {e}")
        return {
            "text": "[Speech API unavailable]",
            "sentiment": "Neutral",
            "speed": 0.0,
        }
    except Exception as e:
        print(f"[voice_module] Unexpected error: {e}")
        return None