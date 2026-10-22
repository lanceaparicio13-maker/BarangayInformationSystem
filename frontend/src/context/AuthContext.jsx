import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import api from '../services/api'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const clearSession = useCallback(() => {
    localStorage.removeItem('bis_token')
    setUser(null)
  }, [])

  // Restore the user's session when the app starts.
  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      const token = localStorage.getItem('bis_token')

      if (!token) {
        if (!cancelled) {
          setLoading(false)
        }
        return
      }

      try {
        const response = await api.get('/user')

        if (!cancelled) {
          setUser(response.data)
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem('bis_token')
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [])

  // Log in an existing user and save the API token.
  const login = useCallback(async (email, password) => {
    const response = await api.post('/login', {
      email,
      password,
    })

    const { token, user: loggedInUser } = response.data

    if (!token || !loggedInUser) {
      throw new Error(
        'The server returned an incomplete login response.',
      )
    }

    localStorage.setItem('bis_token', token)
    setUser(loggedInUser)

    return loggedInUser
  }, [])

  // Register a new resident and save the API token.
  const register = useCallback(async (
    name,
    email,
    password,
    passwordConfirmation,
  ) => {
    const response = await api.post('/register', {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    })

    const { token, user: registeredUser } = response.data

    if (!token || !registeredUser) {
      throw new Error(
        'The server returned an incomplete registration response.',
      )
    }

    localStorage.setItem('bis_token', token)
    setUser(registeredUser)

    return registeredUser
  }, [])

  // Log out and clear the local session.
  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem('bis_token')) {
        await api.post('/logout')
      }
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isStaff: user?.role === 'staff' || user?.role === 'admin',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
