import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    LayoutDashboard, Video, History, LogOut, UserCircle
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import MicLogoSVG from './MicLogoSVG'

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/interview', icon: Video, label: 'Interview' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
]

export default function AppLayout() {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const initials = user?.full_name
        ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : user?.username?.[0]?.toUpperCase() || 'U'

    return (
        <div className="page-container">
            {/* Top Navbar */}
            <nav className="navbar">
                <div className="nav-inner">
                    <NavLink to="/dashboard" className="nav-logo">
                        <MicLogoSVG />
                        <span className="nav-logo-text">InterviewAI</span>
                    </NavLink>


                    {/* Desktop nav links */}
                    <div className="nav-links">
                        {navItems.map(({ to, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            >
                                {label}
                            </NavLink>
                        ))}
                    </div>

                    <div className="nav-user">
                        <NavLink
                            to="/profile"
                            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <div className="avatar" title="View Profile">
                                {initials}
                            </div>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {user?.full_name || user?.username}
                            </span>
                        </NavLink>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={handleLogout}
                            title="Logout"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main content — full width, no sidebar */}
            <main className="main-content-full">
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                    <Outlet />
                </motion.div>
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="mobile-nav">
                <div className="mobile-nav-grid">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={20} />
                            {label}
                        </NavLink>
                    ))}
                    <button
                        className="mobile-nav-item"
                        onClick={handleLogout}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--red-400)' }}
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </nav>
        </div>
    )
}
