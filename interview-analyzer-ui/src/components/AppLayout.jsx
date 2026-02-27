import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    LayoutDashboard, Video, History, LogOut, Brain, Menu, X, UserCircle
} from 'lucide-react'
import { useState } from 'react'
import useAuthStore from '../store/authStore'

const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/interview', icon: Video, label: 'Interview' },
    { to: '/history', icon: History, label: 'History' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
]

export default function AppLayout() {
    const { user, logout } = useAuthStore()
    const navigate = useNavigate()
    const [mobileOpen, setMobileOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const initials = user?.full_name
        ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
        : user?.username?.[0]?.toUpperCase() || 'U'

    return (
        <div className="page-container">
            {/* Navbar */}
            <nav className="navbar">
                <div className="nav-inner">
                    <NavLink to="/dashboard" className="nav-logo">
                        <div className="nav-logo-icon">
                            <Brain size={20} color="white" />
                        </div>
                        InterviewAI
                    </NavLink>

                    {/* Desktop nav */}
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
                        <NavLink to="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div className="avatar" title="View Profile">
                                {initials}
                            </div>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'var(--hide-on-mobile, inline)' }}>
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
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setMobileOpen(!mobileOpen)}
                            style={{ display: 'none' }}
                            id="mobile-menu-btn"
                        >
                            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Layout body */}
            <div className="layout-wrapper">
                {/* Sidebar */}
                <aside className="sidebar">
                    <nav className="sidebar-nav">
                        {navItems.map(({ to, icon: Icon, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                            >
                                <Icon size={18} />
                                {label}
                            </NavLink>
                        ))}
                        <div style={{ flex: 1, minHeight: '2rem' }} />
                        <button
                            className="sidebar-link"
                            onClick={handleLogout}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', marginTop: '1rem', color: 'var(--red-400)' }}
                        >
                            <LogOut size={18} />
                            Logout
                        </button>
                    </nav>
                </aside>

                {/* Main */}
                <main className="main-content">
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
            </div>

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
