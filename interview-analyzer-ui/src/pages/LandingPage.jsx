import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import MicLogoSVG from '../components/MicLogoSVG'
import { Zap, BarChart3, Mic, Camera, Shield, ArrowRight, CheckCircle } from 'lucide-react'

const features = [
    { icon: Camera, title: 'Facial Emotion AI', desc: 'Real-time FER detection tracks 7 emotions across 30+ second sessions', color: 'var(--purple-400)' },
    { icon: Mic, title: 'Voice Analysis', desc: 'Speech recognition + TextBlob sentiment analysis measures speaking pace', color: 'var(--cyan-400)' },
    { icon: BarChart3, title: 'Confidence Score', desc: 'Combined metric from emotion positivity and voice confidence gives you an AI-powered score', color: 'var(--blue-400)' },
    { icon: Shield, title: 'Secure & Private', desc: 'JWT-protected sessions, all data stays private and encrypted on your account', color: 'var(--green-400)' },
]

const stats = [
    { value: '7+', label: 'Emotions Tracked' },
    { value: '30s', label: 'Session Length' },
    { value: '98%', label: 'Accuracy Rate' },
    { value: '∞', label: 'Sessions Stored' },
]

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function LandingPage() {
    return (
        <div className="page-container">
            {/* Navbar */}
            <nav className="navbar">
                <div className="nav-inner">
                    <Link to="/" className="nav-logo">
                        <MicLogoSVG />
                        <span className="nav-logo-text">InterviewAI</span>
                    </Link>
                    <div className="nav-links">
                        <a href="#features" className="nav-link">Features</a>
                        <a href="#stats" className="nav-link">Stats</a>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <Link to="/login" className="btn btn-ghost">Sign In</Link>
                        <Link to="/register" className="btn btn-primary">Get Started</Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="hero-section" style={{ paddingTop: '8rem' }}>
                <motion.div initial="hidden" animate="visible" variants={containerVariants}>
                    <motion.div variants={itemVariants}>
                        <div className="hero-badge">
                            <Zap size={12} />
                            AI-Powered Interview Analysis
                        </div>
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="hero-title">
                        Master Your Interview
                        <br />
                        <span className="gradient-text">Confidence</span> with AI
                    </motion.h1>

                    <motion.p variants={itemVariants} className="hero-desc">
                        Real-time facial emotion detection and voice sentiment analysis give you
                        a live confidence score during mock interviews. Know exactly where to improve.
                    </motion.p>

                    <motion.div variants={itemVariants} className="hero-actions">
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Start Free Analysis
                            <ArrowRight size={18} />
                        </Link>
                        <Link to="/login" className="btn btn-ghost btn-lg">
                            Sign In
                        </Link>
                    </motion.div>

                    <motion.div variants={itemVariants} className="hero-features">
                        {['No setup required', 'Real-time feedback', 'Secure & private'].map((f) => (
                            <div key={f} className="hero-feature">
                                <CheckCircle size={14} style={{ color: 'var(--green-400)' }} />
                                {f}
                            </div>
                        ))}
                    </motion.div>

                    {/* Animated preview card */}
                    <motion.div
                        variants={itemVariants}
                        style={{ marginTop: '4rem', maxWidth: 700, width: '100%' }}
                    >
                        <div className="glass-card-elevated" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div className="pulse-dot" />
                                <span style={{ fontSize: '0.85rem', color: 'var(--green-400)', fontWeight: 600 }}>LIVE SESSION</span>
                                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                                    <div className="badge badge-purple">Happy 😊</div>
                                    <div className="badge badge-blue">Neutral 😐</div>
                                </div>
                            </div>

                            {/* Fake progress indicators */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                                {[
                                    { label: 'Emotion Score', value: 82, color: 'var(--grad-primary)' },
                                    { label: 'Voice Confidence', value: 76, color: 'var(--grad-accent)' },
                                    { label: 'Final Score', value: 79, color: 'var(--grad-success)' },
                                ].map(({ label, value, color }) => (
                                    <div key={label} style={{ textAlign: 'center' }}>
                                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, background: color, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                            {value}%
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{label}</div>
                                        <div className="progress-bar" style={{ marginTop: '0.5rem' }}>
                                            <motion.div
                                                className="progress-fill"
                                                style={{ background: color, width: `${value}%` }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${value}%` }}
                                                transition={{ delay: 0.8, duration: 1.2, ease: 'easeOut' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Voice wave */}
                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                                <div className="voice-wave">
                                    {[...Array(7)].map((_, i) => (
                                        <div key={i} className="voice-wave-bar" />
                                    ))}
                                </div>
                            </div>

                            {/* Glow overlay */}
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0, height: '60px',
                                background: 'linear-gradient(to top, rgba(5,8,16,0.8), transparent)',
                                pointerEvents: 'none',
                            }} />
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* Stats */}
            <section id="stats" style={{ padding: '4rem 0', position: 'relative', zIndex: 1 }}>
                <div className="container">
                    <div className="grid-4">
                        {stats.map(({ value, label }, i) => (
                            <motion.div
                                key={label}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.4 }}
                                className="glass-card"
                                style={{ padding: '2rem', textAlign: 'center' }}
                            >
                                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 900 }} className="gradient-text">
                                    {value}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{label}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" style={{ padding: '4rem 0 6rem', position: 'relative', zIndex: 1 }}>
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{ textAlign: 'center', marginBottom: '3rem' }}
                    >
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                            Every tool you need to <span className="gradient-text">ace interviews</span>
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
                            Powered by state-of-the-art AI models for emotion detection and voice sentiment analysis.
                        </p>
                    </motion.div>

                    <div className="grid-2" style={{ gap: '1.25rem' }}>
                        {features.map(({ icon: Icon, title, desc, color }, i) => (
                            <motion.div
                                key={title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1, duration: 0.4 }}
                                className="glass-card"
                                style={{ padding: '1.75rem' }}
                                whileHover={{ y: -4 }}
                            >
                                <div style={{
                                    width: 48, height: 48, borderRadius: 'var(--radius-md)',
                                    background: `${color}18`, border: `1px solid ${color}30`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: '1rem',
                                }}>
                                    <Icon size={22} style={{ color }} />
                                </div>
                                <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{ textAlign: 'center', marginTop: '3.5rem' }}
                    >
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Get Started — It's Free
                            <ArrowRight size={18} />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '2rem 0', position: 'relative', zIndex: 1, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <MicLogoSVG size={22} />
                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-secondary)' }}>InterviewAI</span>
                    </div>
                    © 2025 InterviewAI – All rights reserved.
                </div>
            </footer>
        </div>
    )
}
