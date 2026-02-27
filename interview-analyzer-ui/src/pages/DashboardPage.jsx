import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    BarChart3, TrendingUp, Award, Clock, Video, ChevronRight,
    Smile, Meh, Frown, Zap
} from 'lucide-react'
import { interviewAPI } from '../services/api'
import useAuthStore from '../store/authStore'
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts'

const emotionColors = {
    happy: '#4ade80', neutral: '#60a5fa', surprised: '#fbbf24',
    sad: '#a78bfa', angry: '#f87171', fearful: '#fb923c', disgusted: '#34d399',
}

const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

// ── Score Ring Component ─────────────────────────────
function ScoreRing({ score, size = 120, stroke = 10, label = 'Score', gradient = ['#6366f1', '#a855f7'] }) {
    const r = (size - stroke) / 2
    const circ = 2 * Math.PI * r
    const offset = circ - (score / 100) * circ

    return (
        <div className="score-ring-container" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <defs>
                    <linearGradient id={`rg-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={gradient[0]} />
                        <stop offset="100%" stopColor={gradient[1]} />
                    </linearGradient>
                </defs>
                <circle className="score-ring-bg" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
                <motion.circle
                    className="score-ring-fill"
                    cx={size / 2} cy={size / 2} r={r}
                    strokeWidth={stroke}
                    stroke={`url(#rg-${label})`}
                    strokeDasharray={circ}
                    strokeDashoffset={circ}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
                />
            </svg>
            <div className="score-ring-value">
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: size * 0.22 }}>
                    {score}%
                </span>
                <span style={{ fontSize: size * 0.09, color: 'var(--text-muted)', marginTop: 2 }}>{label}</span>
            </div>
        </div>
    )
}

export default function DashboardPage() {
    const { user } = useAuthStore()
    const location = useLocation()
    const [sessions, setSessions] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [backendError, setBackendError] = useState(false)

    useEffect(() => {
        const load = async () => {
            try {
                const [sessRes, statsRes] = await Promise.all([
                    interviewAPI.getSessions(),
                    interviewAPI.getStats(),
                ])
                setSessions(sessRes.data.sessions || [])
                setStats(statsRes.data)
                setBackendError(false)
            } catch {
                // Backend not running — show zeros, not fake data
                setBackendError(true)
                setSessions([])
                setStats(null)
            } finally {
                setLoading(false)
            }
        }
        load()
        // location.key changes on every navigation — forces a re-fetch each time the user arrives here
    }, [location.key])

    const emptyStats = {
        avg_score: 0, best_score: 0, total_sessions: 0,
        avg_emotion: 0, avg_voice: 0, trend: [], emotion_radar: [],
    }

    const d = stats || emptyStats
    const s = sessions


    const statCards = [
        { icon: Award, label: 'Avg Score', value: `${d.avg_score}%`, color: 'var(--purple-400)', grad: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.2)' },
        { icon: TrendingUp, label: 'Best Score', value: `${d.best_score}%`, color: 'var(--green-400)', grad: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)' },
        { icon: BarChart3, label: 'Sessions', value: d.total_sessions, color: 'var(--blue-400)', grad: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' },
        { icon: Zap, label: 'Voice Conf.', value: `${d.avg_voice}%`, color: 'var(--cyan-400)', grad: 'rgba(34,211,238,0.1)', border: 'rgba(34,211,238,0.2)' },
    ]

    const getScoreLabel = (score) => {
        if (score >= 70) return { label: 'Excellent', color: 'var(--green-400)', badge: 'badge-green' }
        if (score >= 40) return { label: 'Moderate', color: 'var(--amber-400)', badge: 'badge-amber' }
        return { label: 'Low', color: 'var(--red-400)', badge: 'badge-red' }
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload?.length) {
            return (
                <div className="custom-tooltip">
                    <div style={{ fontWeight: 600 }}>{label}</div>
                    <div style={{ color: 'var(--purple-400)' }}>Score: {payload[0].value}%</div>
                </div>
            )
        }
        return null
    }

    return (
        <motion.div initial="hidden" animate="visible" variants={stagger}>
            {/* Header */}
            <motion.div variants={fadeUp} className="page-header">
                <h1 className="page-title">
                    Welcome back, {user?.full_name?.split(' ')[0] || user?.username} 👋
                </h1>
                <p className="page-subtitle">Here's your interview performance overview</p>
            </motion.div>

            {/* Backend offline banner */}
            {backendError && (
                <motion.div variants={fadeUp}>
                    <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                        ⚠️ Backend is offline — start the API server to see your real session data.
                    </div>
                </motion.div>
            )}

            {/* Start CTA */}
            <motion.div variants={fadeUp}>
                <div className="glass-card-elevated" style={{ padding: '1.5rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Ready for your next session?</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>AI analyzes your emotions and voice in real-time</p>
                    </div>
                    <Link to="/interview" className="btn btn-primary btn-lg">
                        <Video size={18} />
                        Start Interview
                        <ChevronRight size={18} />
                    </Link>
                </div>
            </motion.div>

            {/* Stat Cards */}
            <motion.div variants={fadeUp} className="grid-4" style={{ marginBottom: '1.5rem' }}>
                {statCards.map(({ icon: Icon, label, value, color, grad, border }) => (
                    <motion.div
                        key={label}
                        className="glass-card stat-card"
                        whileHover={{ y: -3, transition: { duration: 0.2 } }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: grad, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={20} style={{ color }} />
                            </div>
                        </div>
                        <div className="stat-card-value" style={{ color }}>{value}</div>
                        <div className="stat-card-label">{label}</div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Charts Row */}
            <motion.div variants={fadeUp} className="grid-2" style={{ marginBottom: '1.5rem' }}>
                {/* Trend chart */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>Score Trend</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={d.trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} fill="url(#scoreGrad)" dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Radar chart */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem' }}>Emotion Profile</h3>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={d.emotion_radar}>
                                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                <Radar name="You" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </motion.div>

            {/* Score Summary */}
            <motion.div variants={fadeUp} className="grid-2" style={{ marginBottom: '1.5rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontWeight: 700, marginBottom: '1.5rem', fontSize: '1rem' }}>Latest Scores</h3>
                    <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <ScoreRing score={d.avg_emotion ?? 0} size={110} label="Emotion" gradient={['#6366f1', '#a855f7']} />
                        <ScoreRing score={d.avg_voice ?? 0} size={110} label="Voice" gradient={['#06b6d4', '#3b82f6']} />
                        <ScoreRing score={d.avg_score ?? 0} size={110} label="Overall" gradient={['#10b981', '#059669']} />
                    </div>
                </div>

                {/* Recent Sessions */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Recent Sessions</h3>
                        <Link to="/history" className="link" style={{ fontSize: '0.8rem' }}>View all →</Link>
                    </div>
                    <div className="session-list">
                        {s.slice(0, 3).map((session, i) => {
                            const meta = getScoreLabel(session.final_score)
                            const date = new Date(session.timestamp)
                            const dateStr = isNaN(date) ? 'Recent' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            return (
                                <motion.div
                                    key={i}
                                    className="session-item"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + i * 0.1 }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Video size={16} style={{ color: 'var(--purple-400)' }} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Session #{s.length - i}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dateStr}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span className={`badge ${meta.badge}`}>{meta.label}</span>
                                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.1rem', color: meta.color }}>
                                            {session.final_score}%
                                        </span>
                                    </div>
                                </motion.div>
                            )
                        })}
                        {s.length === 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '1rem' }}>
                                No sessions yet — start your first interview!
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
