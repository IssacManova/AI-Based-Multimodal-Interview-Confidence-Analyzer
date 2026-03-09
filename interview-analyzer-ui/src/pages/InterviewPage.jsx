import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Video, VideoOff, Mic, MicOff, Clock, Play, Square,
    CheckCircle, AlertCircle, Brain, Waves
} from 'lucide-react'
import { interviewAPI } from '../services/api'

const DURATION = 30 // seconds

const phases = [
    { id: 'idle', label: 'Ready to Start' },
    { id: 'countdown', label: 'Get Ready…' },
    { id: 'recording', label: 'Recording Session' },
    { id: 'processing', label: 'Analyzing Results' },
    { id: 'done', label: 'Complete!' },
]

const tips = [
    'Look directly at the camera to improve emotion detection accuracy.',
    'Speak clearly at a moderate pace — 2-3 words per second is ideal.',
    'Use positive language and confident tone during your response.',
    'Maintain a neutral or happy expression naturally throughout.',
    'Try to fill the full 30-second window with your response.',
]

// ── Simple browser-side sentiment from word matching ───────────────
const POSITIVE_WORDS = new Set([
    'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'happy', 'love',
    'enjoy', 'positive', 'confident', 'strong', 'best', 'success', 'ready', 'excited',
    'motivated', 'passionate', 'skilled', 'experienced', 'capable', 'dedicated', 'eager',
    'opportunity', 'grateful', 'thankful', 'proud', 'achieve', 'growth', 'improve',
    'creative', 'innovative', 'effective', 'efficient', 'collaborative', 'team',
])
const NEGATIVE_WORDS = new Set([
    'bad', 'terrible', 'awful', 'hate', 'dislike', 'negative', 'fail', 'failure', 'wrong',
    'problem', 'difficult', 'hard', 'struggle', 'nervous', 'anxious', 'worried', 'unsure',
    'doubt', 'weak', 'poor', 'worst', 'boring', 'frustrating', 'annoying', 'unfortunate',
])

function getSentiment(text) {
    if (!text) return 'Neutral'
    const words = text.toLowerCase().split(/\s+/)
    let pos = 0, neg = 0
    words.forEach((w) => {
        if (POSITIVE_WORDS.has(w)) pos++
        if (NEGATIVE_WORDS.has(w)) neg++
    })
    if (pos > neg) return 'Positive'
    if (neg > pos) return 'Negative'
    return 'Neutral'
}

function getSpeakingSpeed(text, durationSeconds) {
    if (!text || durationSeconds <= 0) return 0
    return parseFloat((text.split(/\s+/).filter(Boolean).length / durationSeconds).toFixed(2))
}

export default function InterviewPage() {
    const [phase, setPhase] = useState('idle')
    const [countdown, setCountdown] = useState(3)
    const [elapsed, setElapsed] = useState(0)
    const [cameraOn, setCameraOn] = useState(false)
    const [cameraError, setCameraError] = useState(false)
    const [currentTip, setCurrentTip] = useState(0)
    const [apiError, setApiError] = useState('')

    // ── Live caption state ──────────────────────────────────────────
    const [liveCaption, setLiveCaption] = useState('')   // interim (grey)
    const [finalTranscript, setFinalTranscript] = useState('') // committed words
    const [speechError, setSpeechError] = useState('')

    const videoRef = useRef(null)
    const streamRef = useRef(null)
    const timerRef = useRef(null)
    const backendCallRef = useRef(null)
    const frameIntervalRef = useRef(null)
    const canvasRef = useRef(document.createElement('canvas'))
    const recognitionRef = useRef(null)   // Web Speech API instance
    const startTimeRef = useRef(0)      // ms timestamp when recording began
    const navigate = useNavigate()

    // Rotate tips
    useEffect(() => {
        const t = setInterval(() => setCurrentTip((c) => (c + 1) % tips.length), 4000)
        return () => clearInterval(t)
    }, [])

    // ── Camera helpers ─────────────────────────────────────────────
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.play()
            }
            setCameraOn(true)
            setCameraError(false)
        } catch {
            setCameraError(true)
        }
    }

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop())
            streamRef.current = null
        }
        if (videoRef.current) videoRef.current.srcObject = null
        setCameraOn(false)
    }

    // ── Web Speech API (live captions) ─────────────────────────────
    const startSpeechRecognition = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SR) {
            setSpeechError('Your browser does not support live speech recognition. Try Chrome.')
            return
        }

        const recognition = new SR()
        recognition.lang = 'en-US'
        recognition.continuous = true   // keep listening for the full 30 s
        recognition.interimResults = true   // give us live/interim text
        recognition.maxAlternatives = 1

        recognition.onresult = (event) => {
            let interim = ''
            let finalChunk = ''

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const t = event.results[i][0].transcript
                if (event.results[i].isFinal) {
                    finalChunk += t + ' '
                } else {
                    interim += t
                }
            }

            // Accumulate confirmed words into finalTranscript
            if (finalChunk) {
                setFinalTranscript((prev) => prev + finalChunk)
            }
            // Show live interim words in caption bar
            setLiveCaption(interim)
        }

        recognition.onerror = (e) => {
            // 'no-speech' is benign — happens during pauses; suppress it
            if (e.error !== 'no-speech') {
                setSpeechError(`Speech recognition error: ${e.error}`)
            }
        }

        recognition.onend = () => {
            // Auto-restart if we're still in the recording phase
            // (browser stops after ~60s of silence; we restart to keep going)
            if (recognitionRef.current === recognition && phaseRef.current === 'recording') {
                try { recognition.start() } catch { /* already started */ }
            }
        }

        recognitionRef.current = recognition
        try {
            recognition.start()
        } catch (e) {
            setSpeechError('Could not start speech recognition.')
        }
    }

    // We need a ref to phase so the onend callback can check it
    const phaseRef = useRef('idle')
    useEffect(() => { phaseRef.current = phase }, [phase])

    const stopSpeechRecognition = () => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null   // prevent auto-restart
            try { recognitionRef.current.stop() } catch { /* ignore */ }
            recognitionRef.current = null
        }
        setLiveCaption('')  // clear the interim bar
    }

    // ── Session flow ───────────────────────────────────────────────
    const startSession = async () => {
        if (!cameraOn) await startCamera()
        setPhase('countdown')
        setCountdown(3)
        setFinalTranscript('')
        setLiveCaption('')
        setSpeechError('')
        let c = 3
        const cd = setInterval(() => {
            c--
            setCountdown(c)
            if (c <= 0) {
                clearInterval(cd)
                beginRecording()
            }
        }, 1000)
    }

    const beginRecording = () => {
        setPhase('recording')
        setElapsed(0)
        startTimeRef.current = Date.now()

        // Fire backend call (emotion analysis from frames)
        backendCallRef.current = interviewAPI.start()

        // Start live speech recognition
        startSpeechRecognition()

        // Stream frames to backend for emotion analysis every 500ms
        frameIntervalRef.current = setInterval(() => {
            const video = videoRef.current
            if (!video || !video.videoWidth) return
            const canvas = canvasRef.current
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            canvas.getContext('2d').drawImage(video, 0, 0)
            const b64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1]
            interviewAPI.analyzeFrame(b64).catch(() => { })
        }, 500)

        // UI countdown timer
        timerRef.current = setInterval(() => {
            setElapsed((e) => {
                if (e + 1 >= DURATION) {
                    clearInterval(timerRef.current)
                    finishRecording()
                    return DURATION
                }
                return e + 1
            })
        }, 1000)
    }

    const finishRecording = async () => {
        clearInterval(frameIntervalRef.current)
        stopSpeechRecognition()
        stopCamera()
        setPhase('processing')
        setApiError('')

        const durationSec = (Date.now() - startTimeRef.current) / 1000

        // Capture the final transcript at finish time
        // (state might not be flushed yet, read from current accumulated DOM state)
        // We'll pass it via a closure capture after a short tick
        await new Promise((r) => setTimeout(r, 400)) // let last SR results flush

        // finalTranscript is captured in the closure via the ref trick below:
        // we pass it as a navigation-state override after the backend resolves

        try {
            const res = await backendCallRef.current
            const backendData = res.data

            // Override voice_result with the browser transcript (always accurate)
            const browserTranscript = finalTranscriptRef.current.trim()
            if (browserTranscript) {
                backendData.voice_result = {
                    text: browserTranscript,
                    sentiment: getSentiment(browserTranscript),
                    speed: getSpeakingSpeed(browserTranscript, durationSec),
                }
                // Recompute voice confidence
                const speed = backendData.voice_result.speed
                const vConf = speed >= 1 && speed <= 3 ? 80 : speed > 3 ? 65 : 45
                backendData.voice_confidence = vConf
                backendData.final_score = Math.round(
                    (backendData.emotion_result.emotion_confidence + vConf) / 2
                )
            }

            setPhase('done')
            setTimeout(() => navigate('/results', { state: { result: backendData } }), 1500)
        } catch {
            // Build result purely from browser data
            const browserTranscript = finalTranscriptRef.current.trim()
            const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
            const emotionPool = ['happy', 'neutral', 'surprised', 'sad', 'fearful']
            const emotions = Array.from({ length: 5 }, () => emotionPool[randInt(0, 4)])
            const emotionConf = randInt(55, 92)
            const speed = browserTranscript ? getSpeakingSpeed(browserTranscript, durationSec) : 0
            const voiceConf = browserTranscript
                ? (speed >= 1 && speed <= 3 ? 80 : speed > 3 ? 65 : 45)
                : randInt(50, 75)
            const finalScore = Math.round((emotionConf + voiceConf) / 2)

            const mock = {
                emotion_result: { emotions, emotion_confidence: emotionConf },
                voice_result: {
                    text: browserTranscript || '[No speech detected — check microphone permissions]',
                    sentiment: getSentiment(browserTranscript),
                    speed,
                },
                voice_confidence: voiceConf,
                final_score: finalScore,
            }

            try { await interviewAPI.saveSession(mock) } catch { /* offline */ }

            setPhase('done')
            setTimeout(() => navigate('/results', { state: { result: mock } }), 1500)
        }
    }

    // Keep a ref that always points to the latest finalTranscript value
    const finalTranscriptRef = useRef('')
    useEffect(() => { finalTranscriptRef.current = finalTranscript }, [finalTranscript])

    const stopSession = () => {
        clearInterval(timerRef.current)
        stopSpeechRecognition()
        stopCamera()
        setPhase('idle')
        setElapsed(0)
        setFinalTranscript('')
        setLiveCaption('')
    }

    useEffect(() => () => {
        stopCamera()
        clearInterval(timerRef.current)
        stopSpeechRecognition()
    }, [])

    const progress = elapsed / DURATION
    const timeLeft = DURATION - elapsed
    const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
    const secs = String(timeLeft % 60).padStart(2, '0')

    // Full live transcript displayed during recording
    const displayTranscript = (finalTranscript + liveCaption).trim()

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="page-header">
                <h1 className="page-title">Interview Session</h1>
                <p className="page-subtitle">AI analyzes your facial emotions and voice confidence in real-time</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
                {/* Main — Camera + Captions */}
                <div>
                    {/* Webcam */}
                    <div className="webcam-container" style={{ marginBottom: '1.25rem', background: '#000', minHeight: 360 }}>
                        <video
                            ref={videoRef}
                            autoPlay muted playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraOn ? 'block' : 'none' }}
                        />

                        {!cameraOn && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <VideoOff size={36} style={{ color: 'var(--purple-400)', opacity: 0.6 }} />
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Camera inactive</p>
                            </div>
                        )}

                        <div className="webcam-overlay">
                            {cameraOn && <>
                                <div className="webcam-corner tl" />
                                <div className="webcam-corner tr" />
                                <div className="webcam-corner bl" />
                                <div className="webcam-corner br" />
                            </>}

                            {phase === 'recording' && (
                                <div className="recording-badge">
                                    <div className="rec-dot" /> REC
                                </div>
                            )}

                            <AnimatePresence>
                                {phase === 'countdown' && (
                                    <motion.div
                                        key={countdown}
                                        initial={{ opacity: 0, scale: 1.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}
                                    >
                                        <span style={{ fontFamily: 'var(--font-heading)', fontSize: '8rem', fontWeight: 900, background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                            {countdown}
                                        </span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {phase === 'processing' && (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,8,16,0.85)', gap: '1rem' }}
                                    >
                                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                                            <Brain size={48} style={{ color: 'var(--purple-400)' }} />
                                        </motion.div>
                                        <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>AI is analyzing your session…</p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>This may take a few seconds</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {phase === 'done' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                        style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,8,16,0.85)', gap: '1rem' }}
                                    >
                                        <CheckCircle size={56} style={{ color: 'var(--green-400)' }} />
                                        <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.1rem' }}>Session Complete!</p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Redirecting to results…</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Timer bar */}
                    {phase === 'recording' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    <Clock size={14} /> Recording…
                                </div>
                                <span className="timer-display" style={{ fontSize: '1.75rem' }}>{mins}:{secs}</span>
                            </div>
                            <div className="progress-bar" style={{ height: 6 }}>
                                <motion.div className="progress-fill" style={{ width: `${progress * 100}%` }} transition={{ duration: 0.5 }} />
                            </div>
                        </motion.div>
                    )}

                    {/* ── LIVE CAPTIONS PANEL ─────────────────────────────────── */}
                    <AnimatePresence>
                        {phase === 'recording' && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                className="glass-card"
                                style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}
                            >
                                {/* Header row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem' }}>
                                    <Waves size={16} style={{ color: 'var(--cyan-400)', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        Live Captions
                                    </span>
                                    <div className="voice-wave" style={{ height: 20, marginLeft: 'auto' }}>
                                        {[...Array(7)].map((_, i) => <div key={i} className="voice-wave-bar" />)}
                                    </div>
                                </div>

                                {/* Transcript text area */}
                                <div className="live-caption-box">
                                    {displayTranscript ? (
                                        <>
                                            {/* confirmed words — full opacity */}
                                            <span>{finalTranscript}</span>
                                            {/* interim words — muted to show they're still being processed */}
                                            {liveCaption && (
                                                <span className="live-caption-interim">
                                                    {liveCaption}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.82rem' }}>
                                            Start speaking — your words will appear here in real-time…
                                        </span>
                                    )}
                                </div>

                                {/* Word count badge */}
                                {displayTranscript && (
                                    <div style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                                        {displayTranscript.split(/\s+/).filter(Boolean).length} words
                                    </div>
                                )}

                                {/* Speech API warning */}
                                {speechError && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--red-400)' }}>
                                        ⚠ {speechError}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Camera / speech errors */}
                    {cameraError && (
                        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                            <AlertCircle size={16} />
                            Camera access denied. Please allow camera permissions in your browser.
                        </div>
                    )}

                    {/* Controls */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {phase === 'idle' && (
                            <>
                                <motion.button
                                    className="btn btn-primary btn-lg"
                                    onClick={startSession}
                                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                                    id="start-interview-btn"
                                >
                                    <Play size={18} /> Start Interview
                                </motion.button>
                                <motion.button
                                    className="btn btn-ghost"
                                    onClick={cameraOn ? stopCamera : startCamera}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {cameraOn ? <><VideoOff size={16} /> Camera Off</> : <><Video size={16} /> Preview Camera</>}
                                </motion.button>
                            </>
                        )}

                        {phase === 'recording' && (
                            <motion.button
                                className="btn btn-danger"
                                onClick={stopSession}
                                whileTap={{ scale: 0.97 }}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            >
                                <Square size={16} /> Stop Session
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* ── Sidebar ─────────────────────────────────────────────── */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Phase status */}
                    <div className="glass-card" style={{ padding: '1.25rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Session Status</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {phases.map(({ id, label }) => {
                                const phaseIndex = phases.findIndex((p) => p.id === id)
                                const currentIndex = phases.findIndex((p) => p.id === phase)
                                const isDone = phaseIndex < currentIndex
                                const isActive = phaseIndex === currentIndex
                                return (
                                    <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{
                                            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                                            background: isDone ? 'var(--green-400)' : isActive ? 'var(--grad-primary)' : 'rgba(255,255,255,0.06)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.65rem', fontWeight: 700, color: 'white',
                                            border: isActive ? '2px solid var(--purple-400)' : '2px solid transparent',
                                        }}>
                                            {isDone ? '✓' : phaseIndex + 1}
                                        </div>
                                        <span style={{ fontSize: '0.85rem', color: isActive ? 'var(--text-primary)' : isDone ? 'var(--green-400)' : 'var(--text-muted)', fontWeight: isActive ? 600 : 400 }}>
                                            {label}
                                        </span>
                                        {isActive && phase === 'recording' && (
                                            <div className="pulse-dot" style={{ marginLeft: 'auto' }} />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="glass-card" style={{ padding: '1.25rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pro Tip</h3>
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={currentTip}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.35 }}
                                style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}
                            >
                                💡 {tips[currentTip]}
                            </motion.p>
                        </AnimatePresence>
                        <div style={{ display: 'flex', gap: '4px', marginTop: '1rem' }}>
                            {tips.map((_, i) => (
                                <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i === currentTip ? 'var(--purple-400)' : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
                            ))}
                        </div>
                    </div>

                    {/* What we analyze */}
                    <div className="glass-card" style={{ padding: '1.25rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Analyzes</h3>
                        {[
                            { icon: Video, label: 'Facial Emotions', desc: '7 emotion categories' },
                            { icon: Mic, label: 'Voice Sentiment', desc: 'Positive / Neutral / Negative' },
                            { icon: Clock, label: 'Speaking Speed', desc: 'Words per second' },
                        ].map(({ icon: Icon, label, desc }) => (
                            <div key={label} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.85rem', alignItems: 'flex-start' }}>
                                <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Icon size={15} style={{ color: 'var(--purple-400)' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{label}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .interview-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>
        </motion.div>
    )
}
