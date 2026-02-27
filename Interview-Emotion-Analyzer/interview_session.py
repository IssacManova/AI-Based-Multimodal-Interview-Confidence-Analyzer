import threading

def start_interview():
    emotion_thread = threading.Thread(target=run_emotion_detection)
    voice_thread = threading.Thread(target=run_voice_analysis)

    emotion_thread.start()
    voice_thread.start()

    emotion_thread.join()
    voice_thread.join()