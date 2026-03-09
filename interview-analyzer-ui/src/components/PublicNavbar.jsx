/**
 * PublicNavbar — shared top-bar for the Landing / Login / Register pages.
 * Includes the brand logo, optional nav links, and the Dark/Light toggle.
 */
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sun, Moon } from 'lucide-react'
import MicLogoSVG from './MicLogoSVG'
import useThemeStore from '../store/themeStore'

export default function PublicNavbar({ showAuthLinks = true }) {
    const { theme, toggleTheme } = useThemeStore()
    const isDark = theme === 'dark'

    return (
        <nav className="navbar">
            <div className="nav-inner">
                {/* Brand */}
                <Link to="/" className="nav-logo">
                    <MicLogoSVG />
                    <span className="nav-logo-text">InterviewAI</span>
                </Link>

                {/* Page-level anchor links (only on landing) */}
                {showAuthLinks && (
                    <div className="nav-links">
                        <a href="#features" className="nav-link">Features</a>
                        <a href="#stats" className="nav-link">Stats</a>
                    </div>
                )}

                {/* Right-side controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Theme toggle */}
                    <motion.button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        whileTap={{ scale: 0.88, rotate: 15 }}
                        whileHover={{ scale: 1.08 }}
                        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        aria-label="Toggle theme"
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

                    {/* Auth links (only on landing page) */}
                    {showAuthLinks && (
                        <>
                            <Link to="/login" className="btn btn-ghost">Sign In</Link>
                            <Link to="/register" className="btn btn-primary">Get Started</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
