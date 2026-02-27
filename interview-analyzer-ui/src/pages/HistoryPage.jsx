import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import {
    History, Video, ChevronDown, ChevronUp, Award, Mic,
    TrendingUp, Calendar, Search, Filter
} from 'lucide-react'
import { interviewAPI } from '../services/api'

const emotionColors = {
    happy: '#4ade80', neutral: '#60a5fa', surprised: '#fbbf24',
    sad: '#a78bfa', angry: '#f87171', fearful: '#fb923c', disgusted: '#34d399',
}

const mockSessions = [
    {
        timestamp: '2024-02-20T10:30:00Z',
        final_score: 82,
        emotion_result: { emotion_confidence: 85, emotions: ['happy', 'happy', 'neutral', 'happy', 'neutral', 'happy'] },
        voice_result: { text: 'I am excited to join your team and contribute.', sentiment: 'Positive', speed: 2.1 },
        voice_confidence: 80,
    },
    {
        timestamp: '2024-02-19T14:00:00Z',
        final_score: 74,
        emotion_result: { emotion_confidence: 72, emotions: ['neutral', 'happy', 'neutral', 'neutral'] },
        voice_result: { text: 'I have experience in this domain.', sentiment: 'Neutral', speed: 1.8 },
        voice_confidence: 76,
    },
    {
        timestamp: '2024-02-18T09:15:00Z',
        final_score: 67,
        emotion_result: { emotion_confidence: 60, emotions: ['neutral', 'sad', 'neutral', 'neutral'] },
        voice_result: { text: 'I can handle this type of challenge.', sentiment: 'Neutral', speed: 1.5 },
        voice_confidence: 74,
    },
    {
        timestamp: '2024-02-17T16:45:00Z',
        final_score: 55,
        emotion_result: { emotion_confidence: 50, emotions: ['sad', 'neutral', 'neutral', 'fearful'] },
        voice_result: { text: 'I am not sure about this particular question.', sentiment: 'Negative', speed: 1.2 },
        voice_confidence: 60,
    },
]

function SessionCard({ session, index }) {
    const [expanded, setExpanded] = useState(false)
    const date = new Date(session.timestamp)
    const dateStr = isNaN(date) ? 'Recent' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

    const getVerdict = (s) => {
        if (s >= 70) return { label: 'Excellent', cls: 'badge-green', color: 'var(--green-400)' }
        if (s >= 40) return { label: 'Moderate', cls: 'badge-amber', color: 'var(--amber-400)' }
        return { label: 'Low', cls: 'badge-red', color: 'var(--red-400)' }
    }
    const verdict = getVerdict(session.final_score)
    const emotions = session.emotion_result?.emotions || []
    const emotionSet = [...new Set(emotions)]

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.35 }}
        >
            <div className="glass-card" style={{ overflow: 'hidden', marginBottom: '0.75rem' }}>
                {/* Header row */}
                <div
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => setExpanded(!expanded)}
                >
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Video size={18} style={{ color: 'var(--purple-400)' }} />
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Session #{index + 1}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Calendar size={11} /> {dateStr}
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Emotion pills */}
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', maxWidth: 160 }}>
                            {emotionSet.slice(0, 3).map((e) => (
                                <span key={e} style={{
                                    fontSize: '0.68rem', fontWeight: 600, padding: '0.2rem 0.5rem',
                                    borderRadius: 12, background: `${emotionColors[e] || '#94a3b8'}15`,
                                    color: emotionColors[e] || '#94a3b8',
                                    border: `1px solid ${emotionColors[e] || '#94a3b8'}30`,
                                }}>{e}</span>
                            ))}
                        </div>
                        <span className={`badge ${verdict.cls}`}>{verdict.label}</span>
                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: verdict.color, minWidth: 50, textAlign: 'right' }}>
                            {session.final_score}%
                        </span>
                        <div style={{ color: 'var(--text-muted)' }}>
                            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                    </div>
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
                                <div style={{ height: '0.75rem' }} />
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                                    {[
                                        { icon: Award, label: 'Emotion Conf.', value: `${session.emotion_result?.emotion_confidence ?? 0}%`, color: 'var(--purple-400)' },
                                        { icon: Mic, label: 'Voice Conf.', value: `${session.voice_confidence}%`, color: 'var(--cyan-400)' },
                                        { icon: TrendingUp, label: 'Final Score', value: `${session.final_score}%`, color: verdict.color },
                                    ].map(({ icon: Icon, label, value, color }) => (
                                        <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem', textAlign: 'center' }}>
                                            <Icon size={14} style={{ color, marginBottom: 4 }} />
                                            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color }}>{value}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</div>
                                        </div>
                                    ))}
                                </div>

                                {session.voice_result && (
                                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.85rem' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>Transcription</div>
                                        <p style={{ fontSize: '0.85rem', fontStyle: 'italic', lineHeight: 1.5 }}>"{session.voice_result.text}"</p>
                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.6rem' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                Sentiment: <span style={{ color: session.voice_result.sentiment === 'Positive' ? 'var(--green-400)' : session.voice_result.sentiment === 'Negative' ? 'var(--red-400)' : 'var(--blue-400)', fontWeight: 600 }}>{session.voice_result.sentiment}</span>
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                Speed: <span style={{ color: 'var(--cyan-400)', fontWeight: 600 }}>{session.voice_result.speed} w/s</span>
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    )
}

export default function HistoryPage() {
    const location = useLocation()
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all')
    const [error, setError] = useState(false)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const res = await interviewAPI.getSessions()
                setSessions(res.data.sessions || [])
                setError(false)
            } catch {
                setError(true)
                setSessions([])
            } finally {
                setLoading(false)
            }
        }
        load()
        // location.key changes on every navigation — forces a re-fetch each time the user arrives here
    }, [location.key])


    const filtered = sessions.filter((s) => {
        const matchFilter = filter === 'all'
            || (filter === 'excellent' && s.final_score >= 70)
            || (filter === 'moderate' && s.final_score >= 40 && s.final_score < 70)
            || (filter === 'low' && s.final_score < 40)
        return matchFilter
    })

    const avg = sessions.length ? Math.round(sessions.reduce((a, s) => a + s.final_score, 0) / sessions.length) : 0
    const best = sessions.length ? Math.max(...sessions.map((s) => s.final_score)) : 0

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="page-header">
                <h1 className="page-title">Session History</h1>
                <p className="page-subtitle">{sessions.length} session{sessions.length !== 1 ? 's' : ''} recorded</p>
            </div>

            {/* Backend offline banner */}
            {error && (
                <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                    ⚠️ Could not connect to the backend — make sure the API server is running. Showing 0 real sessions.
                </div>
            )}

            {/* Summary row */}
            <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Sessions', value: sessions.length, color: 'var(--purple-400)' },
                    { label: 'Average Score', value: `${avg}%`, color: 'var(--blue-400)' },
                    { label: 'Best Score', value: `${best}%`, color: 'var(--green-400)' },
                ].map(({ label, value, color }) => (
                    <div key={label} className="glass-card stat-card" style={{ padding: '1.25rem' }}>
                        <div className="stat-card-value" style={{ color, fontSize: '2rem' }}>{value}</div>
                        <div className="stat-card-label">{label}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="input-wrapper" style={{ flex: 1, minWidth: 200 }}>
                    <Search size={15} className="input-icon" />
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Search sessions…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ fontSize: '0.875rem' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[['all', 'All'], ['excellent', '✅ Excellent'], ['moderate', '⚡ Moderate'], ['low', '📚 Needs Work']].map(([val, label]) => (
                        <button
                            key={val}
                            className={`btn btn-sm ${filter === val ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => setFilter(val)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Session List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <History size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
                    <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                        {sessions.length === 0 ? 'No interviews yet' : 'No sessions match'}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.875rem' }}>
                        {sessions.length === 0
                            ? 'Complete your first interview and it will appear here.'
                            : 'Try a different filter or start a new interview.'}
                    </p>
                    <Link to="/interview" className="btn btn-primary">Start Interview</Link>
                </div>
            ) : (
                <div>
                    {filtered.map((session, i) => (
                        <SessionCard key={i} session={session} index={i} />
                    ))}
                </div>
            )}
        </motion.div>
    )
}
