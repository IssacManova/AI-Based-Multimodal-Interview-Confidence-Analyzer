# 🎯 AI-Based Multimodal Interview Confidence Analyzer

> A deep learning-powered system that evaluates candidate confidence during interviews by analyzing facial expressions and voice inputs in real time.

![Python](https://img.shields.io/badge/Python-3.8%2B-blue?style=flat-square&logo=python)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=flat-square&logo=javascript)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=flat-square&logo=react)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## 📌 Overview

The **AI-Based Multimodal Interview Confidence Analyzer** is a full-stack AI application that helps candidates and interviewers assess confidence levels during mock or live interviews. By combining **facial emotion recognition**, **speech-to-text transcription**, and **sentiment analysis**, the system generates a comprehensive real-time confidence score based on multimodal signals.

Whether you're preparing for a job interview or evaluating candidates, this tool gives actionable, data-driven feedback grounded in AI.

---

## ✨ Features

- 🎭 **Facial Emotion Recognition** — Detects emotions (happy, nervous, confused, confident, etc.) via webcam using deep learning
- 🎙️ **Speech-to-Text Processing** — Converts spoken interview responses into text for analysis
- 💬 **Sentiment Analysis** — Evaluates the tone, positivity, and assertiveness of spoken content
- 📊 **Real-Time Confidence Score** — Aggregates visual and audio signals into a live confidence metric
- 🖥️ **Modern Web UI** — Clean, interactive React-based frontend for a seamless experience
- ⚡ **One-Click Launch** — Start the full stack with a single `start.bat` script (Windows)

---

## 🏗️ Architecture

```
AI-Based-Multimodal-Interview-Confidence-Analyzer/
│
├── Interview-Emotion-Analyzer/     # Python backend (Flask/FastAPI)
│   ├── emotion detection model
│   ├── speech-to-text engine
│   └── sentiment analysis pipeline
│
├── interview-analyzer-ui/          # React frontend
│   ├── webcam + audio capture
│   ├── confidence score dashboard
│   └── real-time feedback display
│
└── start.bat                       # Windows launcher script
```

**Stack Breakdown:**

| Layer | Technology |
|---|---|
| Frontend | JavaScript / React / CSS |
| Backend | Python (Flask or FastAPI) |
| Emotion Detection | Deep Learning (CNN / FER) |
| Speech Processing | Whisper / SpeechRecognition |
| Sentiment Analysis | NLP model (VADER / Transformers) |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Python 3.8+](https://www.python.org/downloads/)
- [Node.js 16+](https://nodejs.org/)
- A webcam and microphone
- (Windows) Git Bash or Command Prompt

---

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/IssacManova/AI-Based-Multimodal-Interview-Confidence-Analyzer.git
cd AI-Based-Multimodal-Interview-Confidence-Analyzer
```

**2. Set up the Python backend**

```bash
cd Interview-Emotion-Analyzer
pip install -r requirements.txt
```

**3. Set up the React frontend**

```bash
cd ../interview-analyzer-ui
npm install
```

---

### Running the App

#### Option A — Windows (Recommended)

Simply double-click or run:

```bat
start.bat
```

This launches both the backend server and the frontend UI automatically.

#### Option B — Manual Launch

**Terminal 1 – Start the backend:**

```bash
cd Interview-Emotion-Analyzer
python app.py
```

**Terminal 2 – Start the frontend:**

```bash
cd interview-analyzer-ui
npm start
```

Then open your browser and navigate to `http://localhost:3000`.

---

## 🖼️ How It Works

1. **Start a Session** — The user activates their webcam and microphone through the web interface.
2. **Facial Analysis** — The backend continuously processes webcam frames to detect facial emotions using a trained deep learning model.
3. **Voice Analysis** — Audio input is transcribed in real time and analyzed for sentiment (positive/negative tone, assertiveness, filler words).
4. **Confidence Score** — Both signals are fused into a single confidence score displayed live on the dashboard.
5. **Feedback Report** — At the end of the session, a summary report is generated with emotion trends, sentiment breakdown, and improvement suggestions.

---

## 📊 Confidence Score Breakdown

| Signal | Weight | What It Measures |
|---|---|---|
| Facial Emotion | ~50% | Expressions of confidence, nervousness, engagement |
| Speech Sentiment | ~30% | Positive framing, assertive language |
| Speech Clarity | ~20% | Filler words, hesitation, speech pace |

---

## 🛠️ Configuration

You can tune the system by editing config files in the backend:

- **Model paths** — Swap in a custom emotion detection model
- **Scoring weights** — Adjust how facial vs. voice signals are weighted
- **Sentiment thresholds** — Configure what constitutes "positive" or "confident" language
- **API port** — Default is `5000` for the backend; configurable in `app.py`

---

## 📦 Dependencies

**Python (Backend)**

```
flask / fastapi
opencv-python
deepface / fer
SpeechRecognition / openai-whisper
transformers / vaderSentiment
numpy, pandas
```

**JavaScript (Frontend)**

```
react
axios
webcam / media stream APIs
chart.js / recharts (for score visualization)
```

---

## 🔮 Roadmap

- [ ] Support for live video call integration (Zoom / Google Meet)
- [ ] Post-session PDF report export
- [ ] Multi-language speech support
- [ ] Interview question bank with auto-prompting
- [ ] Historical session tracking and progress dashboard
- [ ] Mobile-responsive UI

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please make sure your code is clean, documented, and tested before submitting a PR.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Issac Manova**

- GitHub: [@IssacManova](https://github.com/IssacManova)

---

## ⭐ Support

If you find this project useful, please consider giving it a ⭐ on GitHub — it helps others discover it and motivates continued development!

---

*Built with ❤️ using deep learning, computer vision, and NLP to make interview preparation smarter.*
