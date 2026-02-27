from fer import FER

detector = FER(mtcnn=False)

def detect_emotion(frame):
    results = detector.detect_emotions(frame)

    if results:
        emotions = results[0]["emotions"]
        emotion_name = max(emotions, key=emotions.get)
        return emotion_name
    return None