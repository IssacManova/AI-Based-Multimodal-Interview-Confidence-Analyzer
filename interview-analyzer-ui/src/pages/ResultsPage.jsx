import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend
} from 'recharts'
import { Award, TrendingUp, Mic, RefreshCw, LayoutDashboard, AlertCircle } from 'lucide-react'

const emotionColors = {
    happy: '#4ade80', neutral: '#60a5fa', surprised: '#fbbf24',
    sad: '#a78bfa', angry: '#f87171', fearful: '#fb923c', disgusted: '#34d399',
}

function ScoreGauge({ score, size = 160 }) {
    const r = (size - 16) / 2
    const circ = 2 * Math.PI * r
    const offset = circ - (score / 100) * circ
    const color = score >= 70 ? '#4ade80' : score >= 40 ? '#fbbf24' : '#f87171'
    const grad0 = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'
    const grad1 = score >= 70 ? '#4ade80' : score >= 40 ? '#fbbf24' : '#f87171'

    return (
        <div className="score-ring-container" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <defs>
                    <linearGradient id="finalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={grad0} />
                        <stop offset="100%" stopColor={grad1} />
                    </linearGradient>
                </defs>
                <circle className="score-ring-bg" cx={size / 2} cy={size / 2} r={r} strokeWidth={14} />
                <motion.circle
                    className="score-ring-fill"
                    cx={size / 2} cy={size / 2} r={r}
                    strokeWidth={14}
                    stroke="url(#finalGrad)"
                    strokeDasharray={circ}
                    strokeDashoffset={circ}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.6, ease: 'easeOut', delay: 0.4 }}
                />
            </svg>
            <div className="score-ring-value">
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: size * 0.2, color }}>{score}%</span>
                <span style={{ fontSize: size * 0.085, color: 'var(--text-muted)' }}>Final Score</span>
            </div>
        </div>
    )
}

const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
        return (
            <div className="custom-tooltip">
                <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{payload[0].payload.name}</div>
                <div style={{ color: payload[0].fill }}>Count: {payload[0].value}</div>
            </div>
        )
    }
    return null
}

export default function ResultsPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const result = location.state?.result

    if (!result) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <AlertCircle size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                <h2 style={{ marginBottom: '0.5rem' }}>No Results Found</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Run an interview session first to see your results.</p>
                <Link to="/interview" className="btn btn-primary">Start Interview</Link>
            </div>
        )
    }

    const { emotion_result, voice_result, voice_confidence, final_score } = result
    const emotions = emotion_result?.emotions || []

    // Build emotion frequency chart
    const emotionCounts = emotions.reduce((acc, e) => {
        acc[e] = (acc[e] || 0) + 1
        return acc
    }, {})
    const emotionChartData = Object.entries(emotionCounts).map(([name, count]) => ({ name, count }))

    // Pie chart data
    const pieData = emotionChartData.map(({ name, count }) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: count,
        fill: emotionColors[name] || '#94a3b8',
    }))

    const getVerdict = (score) => {
        if (score >= 70) return { label: 'Excellent', color: 'var(--green-400)', badge: 'badge-green', msg: '🎉 Outstanding confidence! You\'re interview-ready.' }
        if (score >= 40) return { label: 'Moderate', color: 'var(--amber-400)', badge: 'badge-amber', msg: '💪 Good effort! With more practice you\'ll improve significantly.' }
        return { label: 'Needs Work', color: 'var(--red-400)', badge: 'badge-red', msg: '📚 Keep practicing! Focus on staying positive and speaking clearly.' }
    }

    const verdict = getVerdict(final_score)

    const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }
    const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

    return (
        <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} className="page-header">
                <h1 className="page-title">Session Results</h1>
                <p className="page-subtitle">Detailed breakdown of your interview performance</p>
            </motion.div>

            {/* Score Hero */}
            <motion.div variants={fadeUp}>
                <div className="glass-card-elevated" style={{ padding: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <ScoreGauge score={final_score} size={180} />
                        <div>
                            <span className={`badge ${verdict.badge}`} style={{ fontSize: '0.9rem', padding: '0.4rem 1.25rem', marginBottom: '0.75rem', display: 'inline-flex' }}>
                                {verdict.label}
                            </span>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: 420, margin: '0 auto' }}>
                                {verdict.msg}
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Score breakdown */}
            <motion.div variants={fadeUp} className="grid-2" style={{ marginBottom: '1.5rem' }}>
                {/* Emotion Card */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Award size={20} style={{ color: 'var(--purple-400)' }} />
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Emotion Analysis</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emotions.length} frames analyzed</p>
                        </div>
                        <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', color: 'var(--purple-400)' }}>
                            {emotion_result?.emotion_confidence ?? 0}%
                        </div>
                    </div>

                    {emotionChartData.length > 0 ? (
                        <div style={{ height: 200 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={emotionChartData} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                        {emotionChartData.map(({ name }) => (
                                            <Cell key={name} fill={emotionColors[name] || '#94a3b8'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>No emotion data captured</p>
                    )}

                    {/* Emotion chips */}
                    {Object.entries(emotionCounts).length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
                            {Object.entries(emotionCounts)
                                .sort((a, b) => b[1] - a[1])
                                .map(([name, count]) => (
                                    <div key={name} className="emotion-chip" style={{
                                        background: `${emotionColors[name] || '#94a3b8'}15`,
                                        borderColor: `${emotionColors[name] || '#94a3b8'}30`,
                                        color: emotionColors[name] || '#94a3b8',
                                    }}>
                                        {name} <span style={{ fontWeight: 800 }}>×{count}</span>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                {/* Voice Card */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Mic size={20} style={{ color: 'var(--cyan-400)' }} />
                        </div>
                        <div>
                            <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Voice Analysis</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Speech recognition + sentiment</p>
                        </div>
                        <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', color: 'var(--cyan-400)' }}>
                            {voice_confidence}%
                        </div>
                    </div>

                    {voice_result ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Transcription */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>Transcribed Text</div>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.6, fontStyle: 'italic' }}>
                                    "{voice_result.text}"
                                </p>
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                {[
                                    { label: 'Sentiment', value: voice_result.sentiment, color: voice_result.sentiment === 'Positive' ? 'var(--green-400)' : voice_result.sentiment === 'Negative' ? 'var(--red-400)' : 'var(--blue-400)' },
                                    { label: 'Speaking Speed', value: `${voice_result.speed} w/s`, color: 'var(--cyan-400)' },
                                ].map(({ label, value, color }) => (
                                    <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>{label}</div>
                                        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color }}>{value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Speed advice */}
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                {voice_result.speed >= 1 && voice_result.speed <= 3
                                    ? '✅ Speaking speed is ideal (1–3 words/sec).'
                                    : voice_result.speed > 3
                                        ? '⚡ Speaking too fast. Slow down for clarity.'
                                        : '🐢 Speaking too slowly. Try to pick up the pace.'}
                            </div>
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>Voice data not available</p>
                    )}
                </div>
            </motion.div>

            {/* Pie chart */}
            {pieData.length > 0 && (
                <motion.div variants={fadeUp}>
                    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>Emotion Distribution</h3>
                        <div style={{ height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                        {pieData.map(({ name, fill }) => <Cell key={name} fill={fill} />)}
                                    </Pie>
                                    <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-accent)', borderRadius: 8 }} />
                                    <Legend iconType="circle" formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Actions */}
            <motion.div variants={fadeUp} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link to="/interview" className="btn btn-primary btn-lg">
                    <RefreshCw size={16} /> Try Again
                </Link>
                <Link to="/dashboard" className="btn btn-ghost btn-lg">
                    <LayoutDashboard size={16} /> Dashboard
                </Link>
                <Link to="/history" className="btn btn-ghost btn-lg">
                    View History
                </Link>
            </motion.div>
        </motion.div>
    )
}
