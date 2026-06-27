import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import styles from './Navbar.module.css'

import { LayoutGrid, Upload, Settings } from 'lucide-react'

const NAV_LINKS = [
  { to: '/', label: 'Gallery', icon: <LayoutGrid size={18} /> },
  { to: '/upload', label: 'Upload', icon: <Upload size={18} /> },
  { to: '/admin', label: 'Admin', icon: <Settings size={18} /> },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on navigation
  useEffect(() => setMenuOpen(false), [location])

  return (
    <header className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        {/* Brand */}
        <NavLink to="/" className={styles.brand} aria-label="GMPhotos home">
          <span className={styles.brandIcon}>
            <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="navG" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563EB"/>
                  <stop offset="100%" stopColor="#1D4ED8"/>
                </linearGradient>
              </defs>
              <rect width="100" height="100" rx="22" fill="url(#navG)"/>
              <text x="50" y="68" fontFamily="sans-serif" fontSize="58" fontWeight="bold" fill="white" textAnchor="middle">G</text>
            </svg>
          </span>
          <span className={styles.brandName}>
            GM<span className="gradient-text">Photos</span>
          </span>
        </NavLink>

        {/* Desktop nav */}
        <nav className={styles.links} aria-label="Main navigation">
          {NAV_LINKS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              id={`nav-${label.toLowerCase()}`}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.linkIcon}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          id="nav-hamburger"
        >
          <span className={`${styles.bar} ${menuOpen ? styles.open : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.open : ''}`} />
          <span className={`${styles.bar} ${menuOpen ? styles.open : ''}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav className={styles.mobileMenu} aria-label="Mobile navigation">
          {NAV_LINKS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `${styles.mobileLink} ${isActive ? styles.active : ''}`
              }
            >
              <span>{icon}</span> {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
