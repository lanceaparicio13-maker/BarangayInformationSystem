import { useState } from 'react'
import { useAuth } from '../context/AuthContext.js'
import './LoginPage.css'

export default function LoginPage({ onRegisterClick }) {
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
      await login(email.trim(), password)
      // App.jsx selects the correct portal using the user's role.
    } catch (err) {
      if (err.response?.status === 422 || err.response?.status === 401) {
        setError(
          err.response.data?.message ||
            'Invalid email or password. Please try again.',
        )
      } else if (err.code === 'ECONNABORTED') {
        setError('The server took too long to respond. Please try again.')
      } else if (!err.response) {
        setError(
          'Cannot connect to the server. Make sure your Laravel API is running.',
        )
      } else {
        setError(
          err.response.data?.message || 'Login failed. Please try again.',
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
          <div className="login-brand-icon" aria-hidden="true">B</div>
          <div>
            <p className="login-eyebrow">BARANGAY MANAGEMENT</p>
            <h1>Barangay Information System</h1>
          </div>
        </div>

        <div className="login-heading">
          <p className="login-label">WELCOME</p>
          <h2>Sign in to your account</h2>
          <p>
            Access resident services or manage barangay records using your
            authorized account.
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

        <div className="register-switch">
          Don't have a resident account?{' '}
          <button
            type="button"
            onClick={onRegisterClick}
            disabled={submitting}
          >
            Register here
          </button>
        </div>

        <div className="login-footer">
          <p>Secure access for residents and authorized personnel.</p>
          <p>Barangay Information System</p>
        </div>
      </section>
    </main>
  )
}
