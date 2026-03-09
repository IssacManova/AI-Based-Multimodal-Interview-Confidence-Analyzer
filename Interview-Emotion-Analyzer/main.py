import cv2
from fer import FER
import time
detector = FER(mtcnn=True)
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
emotion_history = []
start_time = time.time()
duration = 30
while True:
    ret, frame = cap.read()
    if not ret or frame is None:
        continue
    frame = cv2.resize(frame, (640, 480))
    try:
        result = detector.detect_emotions(frame)
        print("Faces detected:", len(result))
        for face in result:
            (x, y, w, h) = face["box"]
            emotions = face["emotions"]
            emotion_name = max(emotions, key=emotions.get)

            emotion_history.append(emotion_name)
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(frame, emotion_name, (x, y-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9,
                        (0, 255, 0), 2)

    except:
        pass

    remaining_time = int(duration - (time.time() - start_time))
    cv2.putText(frame, f"Time Left: {remaining_time}s", (20, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)

    cv2.imshow("Interview Emotion Analyzer", frame)

    # Stop after duration
    if time.time() - start_time > duration:
        break

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()

# Calculate confidence
positive = emotion_history.count("happy") + emotion_history.count("neutral")
total = len(emotion_history)

if total > 0:
    confidence = (positive / total) * 100
    print("\nConfidence Score: {:.2f}%".format(confidence))

    if confidence > 70:
        print("Excellent confidence during interview")
    elif confidence > 40:
        print("Moderate confidence, can improve")
    else:
        print("Low confidence, practice more")
else:
    print("No emotions detected.")