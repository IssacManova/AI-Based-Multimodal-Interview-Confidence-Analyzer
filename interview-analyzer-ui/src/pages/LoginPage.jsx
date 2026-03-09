import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Sun, Moon } from 'lucide-react'
import MicLogoSVG from '../components/MicLogoSVG'
import useAuthStore from '../store/authStore'
import useThemeStore from '../store/themeStore'
import { authAPI } from '../services/api'

export default function LoginPage() {
    const [form, setForm] = useState({ username: '', password: '' })
    const [showPwd, setShowPwd] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { login } = useAuthStore()
    const { theme, toggleTheme } = useThemeStore()
    const isDark = theme === 'dark'
    const navigate = useNavigate()

    const handleChange = (e) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.username || !form.password) {
            setError('Please fill in all fields')
            return
        }
        setLoading(true)
        try {
            const res = await authAPI.login(form)
            login(res.data.user, res.data.access_token)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid username or password')
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

            {/* Animated background particles */}
            <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        style={{
                            position: 'absolute',
                            borderRadius: '50%',
                            background: i % 2 === 0
                                ? 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)'
                                : 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
                            width: `${200 + i * 80}px`,
                            height: `${200 + i * 80}px`,
                            top: `${10 + i * 15}%`,
                            left: `${5 + i * 16}%`,
                        }}
                        animate={{
                            x: [0, 20, -10, 0],
                            y: [0, -15, 10, 0],
                            scale: [1, 1.05, 0.97, 1],
                        }}
                        transition={{ duration: 8 + i * 2, repeat: Infinity, ease: 'easeInOut', delay: i * 1.5 }}
                    />
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="auth-card glass-card-elevated"
                style={{ position: 'relative', zIndex: 1 }}
            >
                {/* Logo */}
                <div className="auth-logo">
                    <motion.div
                        whileHover={{ rotate: 10, scale: 1.08 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <MicLogoSVG size={46} />
                    </motion.div>
                    <span className="nav-logo-text" style={{ fontSize: '1.3rem' }}>
                        InterviewAI
                    </span>
                </div>

                <h1 className="auth-title gradient-text">Welcome back</h1>
                <p className="auth-subtitle">Sign in to your account to continue</p>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="alert alert-error"
                        style={{ marginBottom: '1rem' }}
                    >
                        <AlertCircle size={16} />
                        {error}
                    </motion.div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Username</label>
                        <div className="input-wrapper">
                            <Mail size={16} className="input-icon" />
                            <input
                                id="login-username"
                                type="text"
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Enter your username"
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <div className="input-wrapper has-right-icon">
                            <Lock size={16} className="input-icon" />
                            <input
                                id="login-password"
                                type={showPwd ? 'text' : 'password'}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Enter your password"
                                autoComplete="current-password"
                            />
                            <span
                                className="input-icon-right"
                                onClick={() => setShowPwd(!showPwd)}
                            >
                                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                            </span>
                        </div>
                    </div>

                    <motion.button
                        id="login-submit"
                        type="submit"
                        className="btn btn-primary btn-lg btn-full"
                        disabled={loading}
                        whileTap={{ scale: 0.97 }}
                        style={{ marginTop: '0.5rem' }}
                    >
                        {loading ? (
                            <>
                                <span className="spinner" style={{ width: 18, height: 18 }} />
                                Signing in…
                            </>
                        ) : 'Sign In'}
                    </motion.button>
                </form>

                <div className="divider" style={{ margin: '1.5rem 0' }}>or</div>

                <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Don't have an account?{' '}
                    <Link to="/register" className="link">Create one free</Link>
                </p>

                <Link
                    to="/"
                    style={{
                        display: 'block',
                        textAlign: 'center',
                        marginTop: '1.25rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        textDecoration: 'none',
                    }}
                >
                    ← Back to home
                </Link>
            </motion.div>
        </div>
    )
}
