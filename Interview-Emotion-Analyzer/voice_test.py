import speech_recognition as sr
from textblob import TextBlob
import time

recognizer = sr.Recognizer()

with sr.Microphone() as source:
    print("Speak something...")
    start_time = time.time()
    audio = recognizer.listen(source)
    end_time = time.time()

duration = end_time - start_time

try:
    text = recognizer.recognize_google(audio)
    print("You said:", text)

    # Sentiment analysis
    sentiment = TextBlob(text).sentiment.polarity

    if sentiment > 0:
        sentiment_label = "Positive"
    elif sentiment < 0:
        sentiment_label = "Negative"
    else:
        sentiment_label = "Neutral"

    print("Sentiment:", sentiment_label)

    # Speaking speed
    word_count = len(text.split())
    speed = word_count / duration

    print("Duration:", round(duration, 2), "seconds")
    print("Words spoken:", word_count)
    print("Speaking speed:", round(speed, 2), "words/sec")

except sr.UnknownValueError:
    print("Could not understand audio")
except sr.RequestError:
    print("Speech Recognition service error")