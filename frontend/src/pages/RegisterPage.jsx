import { useState } from 'react'
import { useAuth } from '../context/AuthContext.js'
import './RegisterPage.css'

export default function RegisterPage({ onLoginClick }) {
  const { register } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (password !== passwordConfirmation) {
      setError('The passwords do not match.')
      return
    }

    setSubmitting(true)

    try {
      await register(
        name.trim(),
        email.trim(),
        password,
        passwordConfirmation,
      )
    } catch (err) {
      const errors = err.response?.data?.errors
      const firstValidationError = errors
        ? Object.values(errors).flat()[0]
        : null

      if (err.response?.status === 422) {
        setError(
          firstValidationError ||
            err.response.data?.message ||
            'Please check your registration details.',
        )
      } else if (err.code === 'ECONNABORTED') {
        setError('The server took too long to respond. Please try again.')
      } else if (!err.response) {
        setError(
          'Cannot connect to the server. Make sure your Laravel API is running.',
        )
      } else {
        setError(
          err.response.data?.message ||
            'Registration failed. Please try again.',
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card register-card">
        <div className="login-brand">
          <div className="login-brand-icon" aria-hidden="true">B</div>
          <div>
            <p className="login-eyebrow">BARANGAY MANAGEMENT</p>
            <h1>Barangay Information System</h1>
          </div>
        </div>

        <div className="login-heading">
          <p className="login-label">RESIDENT PORTAL</p>
          <h2>Create your account</h2>
          <p>Register to manage your profile and request barangay documents.</p>
        </div>

        {error && (
          <div className="login-error" role="alert">
            <span aria-hidden="true">!</span>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="register-name">Full name</label>
            <input
              id="register-name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={255}
              disabled={submitting}
            />
          </div>

          <div className="login-field">
            <label htmlFor="register-email">Email address</label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              maxLength={255}
              disabled={submitting}
            />
          </div>

          <div className="login-field">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              disabled={submitting}
            />
          </div>

          <div className="login-field">
            <label htmlFor="register-password-confirmation">
              Confirm password
            </label>
            <input
              id="register-password-confirmation"
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              placeholder="Enter your password again"
              value={passwordConfirmation}
              onChange={(event) =>
                setPasswordConfirmation(event.target.value)
              }
              required
              minLength={8}
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={submitting}
          >
            {submitting ? 'Creating account...' : 'Create resident account'}
          </button>
        </form>

        <div className="register-switch">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onLoginClick}
            disabled={submitting}
          >
            Sign in
          </button>
        </div>

        <div className="login-footer">
          <p>Resident access</p>
          <p>Barangay Information System</p>
        </div>
      </section>
    </main>
  )
}
