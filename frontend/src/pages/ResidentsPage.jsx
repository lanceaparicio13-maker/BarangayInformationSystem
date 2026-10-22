import { useCallback, useEffect, useState } from 'react'
import api from '../services/api.js'
import './ResidentsPage.css'

function getErrorMessage(error) {
  if (error.response?.status === 401) {
    return 'Your session has expired. Please sign in again.'
  }

  if (error.response?.status === 403) {
    return 'You do not have permission to view resident records.'
  }

  return (
    error.response?.data?.message ||
    'Unable to load residents. Please try again.'
  )
}

function ResidentDetails({ resident, onClose }) {
  const [details, setDetails] = useState(resident)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadDetails() {
      setLoading(true)
      setError('')

      try {
        const response = await api.get(
          `/staff/residents/${resident.id}`,
        )

        if (!cancelled) {
          setDetails(response.data.data ?? response.data)
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(getErrorMessage(requestError))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadDetails()

    return () => {
      cancelled = true
    }
  }, [resident.id])

  const fields = [
    ['First name', details.first_name],
    ['Middle name', details.middle_name],
    ['Last name', details.last_name],
    ['Birth date', details.birth_date],
    ['Gender', details.gender],
    ['Civil status', details.civil_status],
    ['Phone', details.phone],
    ['Address', details.address],
    ['Purok', details.purok],
    ['Account email', details.user?.email],
    ['Account role', details.user?.role],
  ]

  return (
    <div
      className="resident-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="resident-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resident-details-title"
      >
        <div className="resident-modal-header">
          <div>
            <p className="section-eyebrow">RESIDENT PROFILE</p>
            <h2 id="resident-details-title">
              {details.full_name ||
                `${details.first_name} ${details.last_name}`}
            </h2>
          </div>

          <button
            type="button"
            className="resident-close-button"
            onClick={onClose}
            aria-label="Close resident details"
          >
            Close
          </button>
        </div>

        {loading && (
          <p role="status" className="resident-message">
            Loading resident details...
          </p>
        )}

        {error && (
          <div className="resident-error" role="alert">
            {error}
          </div>
        )}

        {!loading && !error && (
          <dl className="resident-details-grid">
            {fields.map(([label, value]) => (
              <div className="resident-detail-field" key={label}>
                <dt>{label}</dt>
                <dd>{value || 'Not provided'}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
    </div>
  )
}

export default function ResidentsPage() {
  const [residents, setResidents] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedResident, setSelectedResident] = useState(null)

  const loadResidents = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/staff/residents', {
        params: {
          search: search || undefined,
          page,
          per_page: 10,
        },
      })

      const result = response.data
      const meta = result.meta ?? {}

      setResidents(result.data ?? [])
      setPagination({
        currentPage: meta.current_page ?? page,
        lastPage: meta.last_page ?? 1,
        total: meta.total ?? (result.data ?? []).length,
      })
    } catch (requestError) {
      setResidents([])
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
  let cancelled = false

  const run = async () => {
    if (cancelled) return
    await loadResidents()
  }

  run()

  return () => {
    cancelled = true
  }
}, [loadResidents])
    
  function handleSearch(event) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  return (
    <section className="residents-page">
      <div className="residents-heading">
        <div>
          <p className="section-eyebrow">
            BARANGAY INFORMATION SYSTEM
          </p>
          <h1>Residents Management</h1>
          <p>
            Search and view registered resident records.
          </p>
        </div>

        <div className="resident-total-card">
          <span>Total residents</span>
          <strong>{loading ? '...' : pagination.total.toLocaleString()}</strong>
        </div>
      </div>

      <section className="residents-panel">
        <div className="residents-toolbar">
          <div>
            <h2>Resident directory</h2>
            <p>Search by name, phone number, or purok.</p>
          </div>

          <form
            className="resident-search-form"
            onSubmit={handleSearch}
          >
            <label className="resident-search-label" htmlFor="resident-search">
              Search residents
            </label>
            <div className="resident-search-controls">
              <input
                id="resident-search"
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Name, phone, or purok"
                maxLength={100}
              />
              <button type="submit" className="primary-button">
                Search
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="resident-error" role="alert">
            <span>{error}</span>
            <button
              type="button"
              className="secondary-button"
              onClick={loadResidents}
              disabled={loading}
            >
              Try again
            </button>
          </div>
        )}

        <div className="residents-table-wrapper">
          <table className="residents-table">
            <thead>
              <tr>
                <th scope="col">Resident</th>
                <th scope="col">Phone</th>
                <th scope="col">Address</th>
                <th scope="col">Purok</th>
                <th scope="col">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="resident-table-message">
                    <span role="status">Loading residents...</span>
                  </td>
                </tr>
              )}

              {!loading && !error && residents.length === 0 && (
                <tr>
                  <td colSpan={5} className="resident-table-message">
                    {search
                      ? 'No residents match your search.'
                      : 'No resident records are available yet.'}
                  </td>
                </tr>
              )}

              {!loading &&
                residents.map((resident) => (
                  <tr key={resident.id}>
                    <td>
                      <div className="resident-name-cell">
                        <span className="resident-avatar" aria-hidden="true">
                          {(resident.first_name || 'R')
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                        <div>
                          <strong>
                            {resident.full_name ||
                              `${resident.first_name} ${resident.last_name}`}
                          </strong>
                          <span>
                            {resident.gender || 'Gender not provided'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>{resident.phone || '—'}</td>
                    <td>{resident.address || '—'}</td>
                    <td>{resident.purok || '—'}</td>
                    <td>
                      <button
                        type="button"
                        className="resident-view-button"
                        onClick={() => setSelectedResident(resident)}
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="residents-pagination">
          <span>
            Page {pagination.currentPage} of {pagination.lastPage}
            {' · '}
            {pagination.total} records
          </span>

          <div className="resident-pagination-controls">
            <button
              type="button"
              className="secondary-button"
              disabled={loading || page <= 1}
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={loading || page >= pagination.lastPage}
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {selectedResident && (
        <ResidentDetails
          resident={selectedResident}
          onClose={() => setSelectedResident(null)}
        />
      )}
    </section>
  )
}
