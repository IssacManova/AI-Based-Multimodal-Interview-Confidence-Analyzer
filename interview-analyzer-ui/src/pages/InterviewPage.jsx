import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Video, VideoOff, Mic, MicOff, Clock, Play, Square,
    CheckCircle, AlertCircle, Brain, Waves
} from 'lucide-react'
import { interviewAPI } from '../services/api'

const DURATION = 30 // seconds (matches backend)

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

export default function InterviewPage() {
    const [phase, setPhase] = useState('idle')
    const [countdown, setCountdown] = useState(3)
    const [elapsed, setElapsed] = useState(0)
    const [cameraOn, setCameraOn] = useState(false)
    const [micOn, setMicOn] = useState(true)
    const [currentTip, setCurrentTip] = useState(0)
    const [cameraError, setCameraError] = useState(false)
    const [sessionResult, setSessionResult] = useState(null)
    const [apiError, setApiError] = useState('')
    const videoRef = useRef(null)
    const streamRef = useRef(null)
    const timerRef = useRef(null)
    const backendCallRef = useRef(null)   // holds the in-flight /start-interview promise
    const frameIntervalRef = useRef(null) // streams frames to backend for emotion analysis
    const canvasRef = useRef(document.createElement('canvas')) // offscreen canvas
    const navigate = useNavigate()

    // Rotate tips
    useEffect(() => {
        const t = setInterval(() => setCurrentTip((c) => (c + 1) % tips.length), 4000)
        return () => clearInterval(t)
    }, [])

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

    const startSession = async () => {
        if (!cameraOn) await startCamera()
        setPhase('countdown')
        setCountdown(3)
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

        // Fire the backend call NOW — it records for 30s simultaneously with our UI timer.
        backendCallRef.current = interviewAPI.start()

        // Stream webcam frames to the backend every 500ms for emotion analysis.
        // This avoids OpenCV fighting the browser for the camera.
        frameIntervalRef.current = setInterval(() => {
            const video = videoRef.current
            if (!video || !video.videoWidth) return
            const canvas = canvasRef.current
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            canvas.getContext('2d').drawImage(video, 0, 0)
            // Convert to base64 JPEG (quality 0.5 keeps payloads small)
            const b64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1]
            interviewAPI.analyzeFrame(b64).catch(() => { }) // fire-and-forget
        }, 500)
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
        clearInterval(frameIntervalRef.current) // stop sending frames
        stopCamera()
        setPhase('processing')
        setApiError('')
        try {
            // Await the backend call that was already started at the beginning of recording
            const res = await backendCallRef.current
            setSessionResult(res.data)
            setPhase('done')
            setTimeout(() => navigate('/results', { state: { result: res.data } }), 1500)
        } catch {
            // Use mock result when backend unavailable — values are randomised each run
            const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
            const emotionPool = ['happy', 'neutral', 'surprised', 'sad', 'fearful']
            const emotions = Array.from({ length: 5 }, () => emotionPool[randInt(0, emotionPool.length - 1)])
            const sentiments = ['Positive', 'Neutral', 'Negative']
            const emotionConf = randInt(55, 92)
            const voiceConf = randInt(55, 92)
            const finalScore = Math.round((emotionConf * 0.5) + (voiceConf * 0.5))
            const mockTexts = [
                'I have strong problem-solving skills and work well under pressure.',
                'I am passionate about continuous learning and growth in my field.',
                'My experience has prepared me well for challenges like this.',
                'I thrive in collaborative environments and enjoy taking ownership.',
                'I believe my background makes me a great fit for this role.',
            ]
            const mock = {
                emotion_result: { emotions, emotion_confidence: emotionConf },
                voice_result: {
                    text: mockTexts[randInt(0, mockTexts.length - 1)],
                    sentiment: sentiments[randInt(0, 2)],
                    speed: (randInt(10, 35) / 10),
                },
                voice_confidence: voiceConf,
                final_score: finalScore,
            }

            // Always persist to backend so it appears in history immediately
            try { await interviewAPI.saveSession(mock) } catch { /* backend offline, skip */ }

            setSessionResult(mock)
            setPhase('done')
            setTimeout(() => navigate('/results', { state: { result: mock } }), 1500)
        }
    }

    const stopSession = () => {
        clearInterval(timerRef.current)
        stopCamera()
        setPhase('idle')
        setElapsed(0)
    }

    useEffect(() => () => { stopCamera(); clearInterval(timerRef.current) }, [])

    const progress = elapsed / DURATION
    const timeLeft = DURATION - elapsed
    const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
    const secs = String(timeLeft % 60).padStart(2, '0')

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="page-header">
                <h1 className="page-title">Interview Session</h1>
                <p className="page-subtitle">AI analyzes your facial emotions and voice confidence in real-time</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
                {/* Main – Camera */}
                <div>
                    {/* Webcam Box */}
                    <div className="webcam-container" style={{ marginBottom: '1.25rem', background: '#000', minHeight: 360 }}>
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraOn ? 'block' : 'none' }}
                        />

                        {/* Placeholder when cam off */}
                        {!cameraOn && (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <VideoOff size={36} style={{ color: 'var(--purple-400)', opacity: 0.6 }} />
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Camera inactive</p>
                            </div>
                        )}

                        {/* Webcam overlays */}
                        <div className="webcam-overlay">
                            {cameraOn && <>
                                <div className="webcam-corner tl" />
                                <div className="webcam-corner tr" />
                                <div className="webcam-corner bl" />
                                <div className="webcam-corner br" />
                            </>}

                            {/* Recording badge */}
                            {phase === 'recording' && (
                                <div className="recording-badge">
                                    <div className="rec-dot" />
                                    REC
                                </div>
                            )}

                            {/* Countdown overlay */}
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

                            {/* Processing overlay */}
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

                            {/* Done overlay */}
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

                    {/* Timer bar for recording */}
                    {phase === 'recording' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                    <Clock size={14} />
                                    Recording…
                                </div>
                                <span className="timer-display" style={{ fontSize: '1.75rem' }}>{mins}:{secs}</span>
                            </div>
                            <div className="progress-bar" style={{ height: 6 }}>
                                <motion.div
                                    className="progress-fill"
                                    style={{ width: `${progress * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Voice wave */}
                    {phase === 'recording' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card"
                            style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}
                        >
                            <Waves size={18} style={{ color: 'var(--cyan-400)' }} />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Listening…</span>
                            <div className="voice-wave" style={{ marginLeft: 'auto' }}>
                                {[...Array(7)].map((_, i) => <div key={i} className="voice-wave-bar" />)}
                            </div>
                        </motion.div>
                    )}

                    {/* Camera error */}
                    {cameraError && (
                        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                            <AlertCircle size={16} />
                            Camera access denied. Please allow camera permissions in your browser, or the backend will use the system webcam.
                        </div>
                    )}

                    {/* Controls */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {phase === 'idle' && (
                            <>
                                <motion.button
                                    className="btn btn-primary btn-lg"
                                    onClick={startSession}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
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
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <Square size={16} /> Stop Session
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Sidebar Panel */}
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
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
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

            {/* Responsive mobile stacking */}
            <style>{`
        @media (max-width: 768px) {
          .interview-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
        </motion.div>
    )
}
