import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Sun, Moon } from 'lucide-react'
import MicLogoSVG from '../components/MicLogoSVG'
import useThemeStore from '../store/themeStore'
import { authAPI } from '../services/api'

export default function RegisterPage() {
    const [form, setForm] = useState({ username: '', full_name: '', password: '', confirm: '' })
    const [showPwd, setShowPwd] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const { theme, toggleTheme } = useThemeStore()
    const isDark = theme === 'dark'
    const navigate = useNavigate()

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
        setError('')
    }

    const passwordStrength = (pwd) => {
        if (!pwd) return 0
        let s = 0
        if (pwd.length >= 8) s++
        if (/[A-Z]/.test(pwd)) s++
        if (/[0-9]/.test(pwd)) s++
        if (/[^A-Za-z0-9]/.test(pwd)) s++
        return s
    }

    const strength = passwordStrength(form.password)
    const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']
    const strengthColors = ['', 'var(--red-400)', 'var(--amber-400)', 'var(--blue-400)', 'var(--green-400)']

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.username || !form.password || !form.confirm) {
            setError('Please fill in all required fields')
            return
        }
        if (form.password !== form.confirm) {
            setError('Passwords do not match')
            return
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }
        setLoading(true)
        try {
            await authAPI.register({
                username: form.username,
                password: form.password,
                full_name: form.full_name,
            })
            setSuccess(true)
            setTimeout(() => navigate('/login'), 2000)
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Try a different username.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            {/* Floating theme toggle */}
            <motion.button
                className="theme-toggle"
                onClick={toggleTheme}
                whileTap={{ scale: 0.88, rotate: 15 }}
                whileHover={{ scale: 1.08 }}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                style={{ position: 'fixed', top: '1.25rem', right: '1.5rem', zIndex: 200 }}
            >
                <motion.div
                    key={theme}
                    initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    transition={{ duration: 0.25 }}
                >
                    {isDark ? <Sun size={17} /> : <Moon size={17} />}
                </motion.div>
            </motion.button>
            <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        style={{
                            position: 'absolute',
                            borderRadius: '50%',
                            background: i % 2 === 0
                                ? 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)'
                                : 'radial-gradient(circle, rgba(236,72,153,0.07) 0%, transparent 70%)',
                            width: `${180 + i * 100}px`,
                            height: `${180 + i * 100}px`,
                            top: `${5 + i * 18}%`,
                            right: `${3 + i * 15}%`,
                        }}
                        animate={{ x: [0, -20, 15, 0], y: [0, 12, -8, 0] }}
                        transition={{ duration: 9 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 1.2 }}
                    />
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="auth-card glass-card-elevated"
                style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}
            >
                <div className="auth-logo">
                    <motion.div
                        whileHover={{ rotate: -10, scale: 1.08 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <MicLogoSVG size={46} />
                    </motion.div>
                    <span className="nav-logo-text" style={{ fontSize: '1.3rem' }}>
                        InterviewAI
                    </span>
                </div>

                <h1 className="auth-title gradient-text">Create account</h1>
                <p className="auth-subtitle">Start your AI-powered interview journey</p>

                {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                        className="alert alert-error" style={{ marginBottom: '1rem' }}>
                        <AlertCircle size={16} /> {error}
                    </motion.div>
                )}

                {success && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="alert alert-success" style={{ marginBottom: '1rem' }}>
                        <CheckCircle size={16} /> Account created! Redirecting to login…
                    </motion.div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Full Name <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
                        <div className="input-wrapper">
                            <User size={16} className="input-icon" />
                            <input id="reg-fullname" type="text" name="full_name" value={form.full_name}
                                onChange={handleChange} className="input-field" placeholder="Jane Smith" />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Username <span style={{ color: 'var(--red-400)' }}>*</span></label>
                        <div className="input-wrapper">
                            <User size={16} className="input-icon" />
                            <input id="reg-username" type="text" name="username" value={form.username}
                                onChange={handleChange} className="input-field" placeholder="Choose a username" autoComplete="username" />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password <span style={{ color: 'var(--red-400)' }}>*</span></label>
                        <div className="input-wrapper has-right-icon">
                            <Lock size={16} className="input-icon" />
                            <input id="reg-password" type={showPwd ? 'text' : 'password'} name="password" value={form.password}
                                onChange={handleChange} className="input-field" placeholder="At least 6 characters" autoComplete="new-password" />
                            <span className="input-icon-right" onClick={() => setShowPwd(!showPwd)}>
                                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                            </span>
                        </div>
                        {form.password && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '0.35rem' }}>
                                {[1, 2, 3, 4].map((n) => (
                                    <div key={n} style={{
                                        height: 4, flex: 1, borderRadius: 2,
                                        background: strength >= n ? strengthColors[strength] : 'rgba(255,255,255,0.08)',
                                        transition: 'background 0.3s',
                                    }} />
                                ))}
                                <span style={{ fontSize: '0.7rem', color: strengthColors[strength], marginLeft: '0.5rem', minWidth: 40 }}>
                                    {strengthLabels[strength]}
                                </span>
                            </motion.div>
                        )}
                    </div>

                    <div className="input-group">
                        <label className="input-label">Confirm Password <span style={{ color: 'var(--red-400)' }}>*</span></label>
                        <div className="input-wrapper has-right-icon">
                            <Lock size={16} className="input-icon" />
                            <input id="reg-confirm" type={showPwd ? 'text' : 'password'} name="confirm" value={form.confirm}
                                onChange={handleChange} className="input-field" placeholder="Repeat your password" autoComplete="new-password" />
                            {form.confirm && (
                                <span className="input-icon-right" style={{ pointerEvents: 'none' }}>
                                    {form.password === form.confirm
                                        ? <CheckCircle size={16} style={{ color: 'var(--green-400)' }} />
                                        : <AlertCircle size={16} style={{ color: 'var(--red-400)' }} />}
                                </span>
                            )}
                        </div>
                    </div>

                    <motion.button id="reg-submit" type="submit" className="btn btn-primary btn-lg btn-full"
                        disabled={loading || success} whileTap={{ scale: 0.97 }} style={{ marginTop: '0.5rem' }}>
                        {loading
                            ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Creating account…</>
                            : 'Create Account'}
                    </motion.button>
                </form>

                <div className="divider" style={{ margin: '1.5rem 0' }}>or</div>

                <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Already have an account? <Link to="/login" className="link">Sign in</Link>
                </p>
                <Link to="/" style={{ display: 'block', textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                    ← Back to home
                </Link>
            </motion.div>
        </div>
    )
}
