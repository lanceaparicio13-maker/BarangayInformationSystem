import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext.js'
import LoginPage from './pages/LoginPage.jsx'
import DocumentRequestsPage from './pages/DocumentRequestsPage.jsx'
import api from './services/api.js'
import './App.css'
import ResidentsPage from './pages/ResidentsPage.jsx'

const navigationItems = [
  { name: 'Dashboard', icon: '▦' },
  { name: 'Document Requests', icon: '▤' },
  { name: 'Residents', icon: '♙' },
  { name: 'Document Types', icon: '▧' },
]

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString()
}

export default function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [summary, setSummary] = useState(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState('')

  const { user, loading, logout, isStaff } = useAuth()

  useEffect(() => {
    if (!user || !isStaff) {
      return undefined
    }

    let cancelled = false

    async function loadDashboard() {
      setDashboardLoading(true)
      setDashboardError('')

      try {
        const response = await api.get('/staff/dashboard')

        if (!cancelled) {
          setSummary(response.data.summary ?? response.data)
        }
      } catch (error) {
        if (!cancelled) {
          setDashboardError(
            error.response?.data?.message ||
              'Unable to load dashboard statistics. Please try again.',
          )
        }
      } finally {
        if (!cancelled) {
          setDashboardLoading(false)
        }
      }
    }

    // Defer the initial state changes so they do not occur
    // synchronously inside the effect.
    Promise.resolve().then(() => {
      if (!cancelled) {
        loadDashboard()
      }
    })

    return () => {
      cancelled = true
    }
  }, [user, isStaff])

  async function refreshDashboard() {
    setDashboardLoading(true)
    setDashboardError('')

    try {
      const response = await api.get('/staff/dashboard')
      setSummary(response.data.summary ?? response.data)
    } catch (error) {
      setDashboardError(
        error.response?.data?.message ||
          'Unable to load dashboard statistics. Please try again.',
      )
    } finally {
      setDashboardLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // The AuthContext clears the local session even if the API fails.
    }
  }

  if (loading) {
    return (
      <main className="login-page">
        <p role="status">Checking your session...</p>
      </main>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  if (!isStaff) {
    return (
      <main className="login-page">
        <section className="login-card">
          <h1>Staff access required</h1>
          <p>
            Your account does not have permission to access the staff
            dashboard.
          </p>
          <button
            type="button"
            className="login-submit"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </section>
      </main>
    )
  }

  const stats = [
    {
      label: 'Total Requests',
      value: summary?.total_requests,
      description: 'All document requests',
      icon: '▤',
    },
    {
      label: 'Pending Requests',
      value: summary?.pending_requests,
      description: 'Awaiting staff review',
      icon: '◷',
    },
    {
      label: 'Approved Requests',
      value: summary?.approved_requests,
      description: 'Approved for processing',
      icon: '✓',
    },
    {
      label: 'Registered Residents',
      value: summary?.total_residents,
      description: 'Resident records in the system',
      icon: '♙',
    },
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">B</div>
          <div className="brand-name">
            <strong>Barangay IS</strong>
            <span>Information System</span>
          </div>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigationItems.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`nav-item ${
                activePage === item.name ? 'active' : ''
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <div className="user-avatar" aria-hidden="true">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <strong>{user.name}</strong>
              <span>{user.role || 'Staff'}</span>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="topbar-label">
              BARANGAY ADMINISTRATION
            </span>
            <h2>Barangay Information System</h2>
          </div>

          <div className="topbar-user">
            <span>{user.name}</span>
            <button type="button" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </header>

        <div className="page-content">
          {activePage === 'Dashboard' && (
            <>
              <section className="welcome-section">
                <div>
                  <p className="section-eyebrow">
                    BARANGAY ADMINISTRATION
                  </p>
                  <h1>Good day, {user.name}!</h1>
                  <p>
                    Welcome to your barangay information system. Manage
                    requests and access barangay records from one
                    workspace.
                  </p>
                </div>
                <span className="staff-badge">✓ Staff portal</span>
              </section>

              <section className="dashboard-section">
                <div className="section-heading">
                  <div>
                    <h2>Dashboard overview</h2>
                    <p>
                      A summary of document requests and resident records
                      in your barangay.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={refreshDashboard}
                    disabled={dashboardLoading}
                  >
                    {dashboardLoading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>

                {dashboardError && (
                  <div className="dashboard-error" role="alert">
                    <span>{dashboardError}</span>
                    <button
                      type="button"
                      onClick={refreshDashboard}
                      disabled={dashboardLoading}
                    >
                      Try again
                    </button>
                  </div>
                )}

                <div className="stats-grid">
                  {stats.map((stat) => (
                    <article className="stat-card" key={stat.label}>
                      <div className="stat-card-top">
                        <span className="stat-label">
                          {stat.label}
                        </span>
                        <span
                          className="stat-icon"
                          aria-hidden="true"
                        >
                          {stat.icon}
                        </span>
                      </div>

                      <strong className="stat-value">
                        {dashboardLoading
                          ? '...'
                          : formatNumber(stat.value)}
                      </strong>

                      <span className="stat-description">
                        {stat.description}
                      </span>
                    </article>
                  ))}
                </div>
              </section>

              <section className="quick-access-section">
                <div className="section-heading">
                  <div>
                    <h2>Quick access</h2>
                    <p>
                      Choose a workspace to manage barangay information.
                    </p>
                  </div>
                </div>

                <div className="quick-access-grid">
                  {navigationItems
                    .filter((item) => item.name !== 'Dashboard')
                    .map((item) => (
                      <button
                        type="button"
                        className="quick-access-card"
                        key={item.name}
                        onClick={() => setActivePage(item.name)}
                      >
                        <span
                          className="quick-access-icon"
                          aria-hidden="true"
                        >
                          {item.icon}
                        </span>
                        <span className="quick-access-text">
                          <strong>{item.name}</strong>
                          <span>
                            {item.name === 'Document Requests'
                              ? 'Review and manage resident applications.'
                              : item.name === 'Residents'
                                ? 'Access registered resident information.'
                                : 'View available barangay documents.'}
                          </span>
                        </span>
                        <span aria-hidden="true">→</span>
                      </button>
                    ))}
                </div>
              </section>

              <footer className="dashboard-footer">
                <span>
                  Barangay Information System · Staff Workspace
                </span>
                <span>
                  Secure access for authorized personnel
                </span>
              </footer>
            </>
          )}

          {activePage === 'Document Requests' && (
            <DocumentRequestsPage />
          )}
          {activePage === 'Residents' && <ResidentsPage />}
          {activePage === 'Document Types' && (
              <section className="placeholder-section">
                <div className="placeholder-icon" aria-hidden="true">
                  {navigationItems.find(
                    (item) => item.name === activePage,
                  )?.icon || '▦'}
                </div>

                <p className="section-eyebrow">
                  BARANGAY INFORMATION SYSTEM
                </p>

                <h1>{activePage}</h1>

                <p>
                  This workspace is ready for integration with the
                  Laravel API. Its listing and management features
                  will be connected next.
                </p>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setActivePage('Dashboard')}
                >
                  ← Back to dashboard
                </button>
              </section>
            )}
        </div>
      </main>
    </div>
  )
}
