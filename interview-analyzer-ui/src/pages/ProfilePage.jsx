import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    User, Mail, Calendar, Shield, Award, BarChart3,
    Clock, Edit3, Save, X, CheckCircle, TrendingUp,
    Zap, Camera, LogOut
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import { interviewAPI } from '../services/api'
import { useNavigate, useLocation } from 'react-router-dom'

const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function ProfilePage() {
    const { user, updateUser, logout } = useAuthStore()
    const navigate = useNavigate()
    const location = useLocation()

    const [stats, setStats] = useState(null)
    const [sessions, setSessions] = useState([])
    const [editing, setEditing] = useState(false)
    const [saved, setSaved] = useState(false)
    const [backendError, setBackendError] = useState(false)
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
    })

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
                setBackendError(true)
                setSessions([])
                setStats(null)
            }
        }
        load()
        // location.key changes on every navigation — forces a re-fetch each time the user arrives here
    }, [location.key])

    const initials = user?.full_name
        ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : user?.username?.[0]?.toUpperCase() || 'U'

    const joinDate = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A'

    const handleSave = () => {
        updateUser(formData)
        setEditing(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
    }

    const handleCancel = () => {
        setFormData({ full_name: user?.full_name || '', email: user?.email || '' })
        setEditing(false)
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const d = stats || { avg_score: 0, best_score: 0, total_sessions: 0, avg_voice: 0 }

    const statCards = [
        { icon: BarChart3, label: 'Total Sessions', value: d.total_sessions, color: 'var(--blue-400)', bg: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)' },
        { icon: Award, label: 'Best Score', value: `${d.best_score}%`, color: 'var(--green-400)', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)' },
        { icon: TrendingUp, label: 'Avg Score', value: `${d.avg_score}%`, color: 'var(--purple-400)', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.2)' },
        { icon: Zap, label: 'Voice Conf.', value: `${d.avg_voice}%`, color: 'var(--cyan-400)', bg: 'rgba(34,211,238,0.1)', border: 'rgba(34,211,238,0.2)' },
    ]

    const getLevel = (sessions) => {
        if (sessions >= 20) return { label: 'Expert', color: '#fbbf24', emoji: '🏆' }
        if (sessions >= 10) return { label: 'Advanced', color: '#a78bfa', emoji: '⭐' }
        if (sessions >= 5) return { label: 'Intermediate', color: '#60a5fa', emoji: '🎯' }
        return { label: 'Beginner', color: '#4ade80', emoji: '🌱' }
    }
    const level = getLevel(d.total_sessions)

    return (
        <motion.div initial="hidden" animate="visible" variants={stagger}>
            {/* Page Header */}
            <motion.div variants={fadeUp} className="page-header">
                <h1 className="page-title">Your Profile</h1>
                <p className="page-subtitle">Manage your account and view your performance</p>
            </motion.div>

            {/* Backend offline banner */}
            {backendError && (
                <motion.div variants={fadeUp}>
                    <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                        ⚠️ Backend is offline — start the API server to see your real session stats.
                    </div>
                </motion.div>
            )}

            {/* Top Row: Avatar Card + Stats */}
            <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'start' }}>

                {/* Avatar / Identity Card */}
                <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', position: 'relative' }}>
                    {/* Avatar */}
                    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.25rem' }}>
                        <div style={{
                            width: 96, height: 96, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', fontWeight: 800, color: '#fff',
                            margin: '0 auto',
                            boxShadow: '0 0 0 4px rgba(99,102,241,0.25)',
                        }}>
                            {initials}
                        </div>
                        <div style={{
                            position: 'absolute', bottom: 0, right: 0,
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'var(--bg-card)', border: '2px solid var(--border-subtle)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                        }} title="Change avatar (coming soon)">
                            <Camera size={13} style={{ color: 'var(--text-muted)' }} />
                        </div>
                    </div>

                    {/* Name */}
                    <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.25rem' }}>
                        {user?.full_name || user?.username}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        @{user?.username}
                    </div>

                    {/* Level badge */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.3rem 0.9rem', borderRadius: '999px',
                        background: `${level.color}18`,
                        border: `1px solid ${level.color}44`,
                        color: level.color, fontSize: '0.8rem', fontWeight: 700,
                        marginBottom: '1.25rem',
                    }}>
                        {level.emoji} {level.label}
                    </div>

                    {/* Meta info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <User size={14} style={{ color: 'var(--purple-400)', flexShrink: 0 }} />
                            <span>{user?.username}</span>
                        </div>
                        {user?.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                <Mail size={14} style={{ color: 'var(--blue-400)', flexShrink: 0 }} />
                                <span>{user.email}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <Calendar size={14} style={{ color: 'var(--green-400)', flexShrink: 0 }} />
                            <span>Joined {joinDate}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <Shield size={14} style={{ color: 'var(--cyan-400)', flexShrink: 0 }} />
                            <span>Standard Account</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <Clock size={14} style={{ color: 'var(--amber-400)', flexShrink: 0 }} />
                            <span>{d.total_sessions} interview{d.total_sessions !== 1 ? 's' : ''} completed</span>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {statCards.map(({ icon: Icon, label, value, color, bg, border }) => (
                            <motion.div
                                key={label}
                                className="glass-card stat-card"
                                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                                style={{ padding: '1.25rem' }}
                            >
                                <div style={{
                                    width: 40, height: 40, borderRadius: 'var(--radius-md)',
                                    background: bg, border: `1px solid ${border}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: '0.75rem',
                                }}>
                                    <Icon size={18} style={{ color }} />
                                </div>
                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>
                                    {value}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    {label}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Progress bar card */}
                    <div className="glass-card" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Overall Performance</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Based on {d.total_sessions} session{d.total_sessions !== 1 ? 's' : ''}</span>
                        </div>
                        {[
                            { label: 'Avg Confidence Score', value: d.avg_score, color: '#6366f1' },
                            { label: 'Best Performance', value: d.best_score, color: '#10b981' },
                            { label: 'Voice Confidence', value: d.avg_voice, color: '#06b6d4' },
                        ].map(({ label, value, color }) => (
                            <div key={label} style={{ marginBottom: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{label}</span>
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color }}>{value}%</span>
                                </div>
                                <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${value}%` }}
                                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                                        style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${color}, ${color}99)` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Edit Profile + Danger Zone Row */}
            <motion.div variants={fadeUp} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

                {/* Edit Profile */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Edit Profile</h3>
                        {!editing ? (
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setEditing(true)}
                                style={{ gap: '0.4rem', display: 'flex', alignItems: 'center' }}
                            >
                                <Edit3 size={14} /> Edit
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-ghost btn-sm" onClick={handleCancel}>
                                    <X size={14} />
                                </button>
                                <button className="btn btn-primary btn-sm" onClick={handleSave}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Save size={14} /> Save
                                </button>
                            </div>
                        )}
                    </div>

                    {saved && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.6rem 0.9rem', borderRadius: 'var(--radius-md)',
                            background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)',
                            color: 'var(--green-400)', fontSize: '0.8rem', marginBottom: '1rem',
                        }}>
                            <CheckCircle size={14} /> Profile saved!
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                                Full Name
                            </label>
                            <input
                                className="form-input"
                                value={formData.full_name}
                                onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))}
                                disabled={!editing}
                                placeholder="Your full name"
                                style={{ width: '100%', opacity: editing ? 1 : 0.7 }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                                Username
                            </label>
                            <input
                                className="form-input"
                                value={user?.username || ''}
                                disabled
                                style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed' }}
                            />
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Username cannot be changed
                            </p>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                                Email <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                            </label>
                            <input
                                className="form-input"
                                value={formData.email}
                                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                                disabled={!editing}
                                placeholder="your@email.com"
                                type="email"
                                style={{ width: '100%', opacity: editing ? 1 : 0.7 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Account Info + Danger Zone */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Account Info */}
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Account Info</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                            {[
                                { label: 'Account Type', value: 'Standard', icon: Shield, color: 'var(--cyan-400)' },
                                { label: 'Member Since', value: joinDate, icon: Calendar, color: 'var(--green-400)' },
                                { label: 'Sessions Done', value: `${d.total_sessions}`, icon: Clock, color: 'var(--amber-400)' },
                                { label: 'Skill Level', value: `${level.emoji} ${level.label}`, icon: Award, color: level.color },
                            ].map(({ label, value, icon: Icon, color }) => (
                                <div key={label} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        <Icon size={13} style={{ color }} />
                                        {label}
                                    </div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(248,113,113,0.2)' }}>
                        <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--red-400)' }}>
                            Danger Zone
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            Actions here cannot be undone.
                        </p>
                        <button
                            className="btn btn-sm"
                            onClick={handleLogout}
                            style={{
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '0.5rem', background: 'rgba(248,113,113,0.1)',
                                border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red-400)',
                                borderRadius: 'var(--radius-md)', padding: '0.6rem',
                                cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                            }}
                        >
                            <LogOut size={15} /> Sign Out of Account
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Achievement Row */}
            <motion.div variants={fadeUp}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>🏅 Achievements</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {[
                            { emoji: '🌱', label: 'First Interview', desc: 'Complete your first session', unlocked: d.total_sessions >= 1 },
                            { emoji: '🎯', label: '5 Sessions', desc: 'Complete 5 interviews', unlocked: d.total_sessions >= 5 },
                            { emoji: '🔥', label: '10 Sessions', desc: 'Complete 10 interviews', unlocked: d.total_sessions >= 10 },
                            { emoji: '⭐', label: 'High Scorer', desc: 'Score above 80%', unlocked: d.best_score >= 80 },
                            { emoji: '🏆', label: 'Expert', desc: 'Score above 90%', unlocked: d.best_score >= 90 },
                            { emoji: '💎', label: 'Consistent', desc: 'Average score above 75%', unlocked: d.avg_score >= 75 },
                        ].map(({ emoji, label, desc, unlocked }) => (
                            <div key={label} style={{
                                flex: '1 1 140px', padding: '1rem', borderRadius: 'var(--radius-md)',
                                background: unlocked ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${unlocked ? 'rgba(139,92,246,0.3)' : 'var(--border-subtle)'}`,
                                textAlign: 'center', opacity: unlocked ? 1 : 0.45,
                                transition: 'all 0.2s',
                            }}>
                                <div style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>{emoji}</div>
                                <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.2rem' }}>{label}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{desc}</div>
                                {unlocked && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--purple-400)', fontWeight: 600 }}>
                                        ✓ Unlocked
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
