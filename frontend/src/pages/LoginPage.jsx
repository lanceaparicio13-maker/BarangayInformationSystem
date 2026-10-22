import { useState } from 'react'
import { useAuth } from '../context/AuthContext.js'
import './LoginPage.css'

export default function LoginPage() {
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setSubmitting(true)

    try {
      const loggedInUser = await login(email.trim(), password)

      if (
        loggedInUser.role !== 'staff' &&
        loggedInUser.role !== 'admin'
      ) {
        setError(
          'Your account does not have staff access. Please use a staff or administrator account.',
        )

        return
      }

      // AuthProvider updates the user state.
      // App.jsx will display the dashboard after login.
    } catch (err) {
      if (err.response?.status === 422) {
        setError(
          err.response.data?.message ||
            'Please check your email and password.',
        )
      } else if (err.response?.status === 401) {
        setError('Invalid email or password.')
      } else if (err.code === 'ECONNABORTED') {
        setError('The server took too long to respond. Please try again.')
      } else if (!err.response) {
        setError(
          'Cannot connect to the server. Make sure your Laravel API is running.',
        )
      } else {
        setError(
          err.response.data?.message ||
            'Login failed. Please try again.',
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="login-brand-icon" aria-hidden="true">
            B
          </div>

          <div>
            <p className="login-eyebrow">BARANGAY MANAGEMENT</p>
            <h1>Barangay Information System</h1>
          </div>
        </div>

        <div className="login-heading">
          <p className="login-label">STAFF PORTAL</p>
          <h2>Welcome back</h2>
          <p>
            Sign in to manage document requests and barangay records.
          </p>
        </div>

        {error && (
          <div className="login-error" role="alert">
            <span aria-hidden="true">!</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="login-footer">
          <p>Authorized personnel only.</p>
          <p>Barangay Information System · Staff Access</p>
        </div>
      </section>
    </main>
  )
}
