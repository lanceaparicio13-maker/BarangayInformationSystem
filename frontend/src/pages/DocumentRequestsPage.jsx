
import { useCallback, useEffect, useState } from 'react'
import api from '../services/api.js'
import './DocumentRequestsPage.css'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'released', label: 'Released' },
]

const PAGE_SIZE = 10

function getResidentName(resident) {
  if (!resident) {
    return 'Resident information unavailable'
  }

  return [
    resident.first_name,
    resident.middle_name,
    resident.last_name,
  ]
    .filter(Boolean)
    .join(' ') || 'Unnamed resident'
}

function getDocumentName(documentRequest) {
  return (
    documentRequest.document_type?.name ||
    documentRequest.documentType?.name ||
    'Document type unavailable'
  )
}

function formatDate(value) {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getErrorMessage(error, fallback) {
  const validationErrors = error.response?.data?.errors

  if (validationErrors) {
    const firstError = Object.values(validationErrors).flat()[0]

    if (firstError) {
      return firstError
    }
  }

  return error.response?.data?.message || error.message || fallback
}

function StatusBadge({ status }) {
  const normalizedStatus = (status || 'unknown').toLowerCase()

  return (
    <span
      className={`requests-status requests-status-${normalizedStatus}`}
    >
      {normalizedStatus.charAt(0).toUpperCase() +
        normalizedStatus.slice(1)}
    </span>
  )
}

export default function DocumentRequestsPage() {
  const [requests, setRequests] = useState([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: null,
    to: null,
  })

  const [selectedRequest, setSelectedRequest] = useState(null)
  const [decision, setDecision] = useState('approved')
  const [staffRemarks, setStaffRemarks] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/staff/document-requests', {
        params: {
          search: search || undefined,
          status: status || undefined,
          page: currentPage,
          per_page: PAGE_SIZE,
        },
      })

      const result = response.data
      const rows = Array.isArray(result.data) ? result.data : []

      setRequests(rows)
      setPagination({
        currentPage: result.current_page ?? currentPage,
        lastPage: result.last_page ?? 1,
        total: result.total ?? rows.length,
        from: result.from ?? (rows.length ? 1 : null),
        to: result.to ?? (rows.length || null),
      })
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          'Unable to load document requests. Please try again.',
        ),
      )
    } finally {
      setLoading(false)
    }
  }, [search, status, currentPage])

  useEffect(() => {
    let cancelled = false

    // Defer the request so the effect does not synchronously update state.
    Promise.resolve().then(async () => {
      if (cancelled) {
        return
      }

      setLoading(true)
      setError('')

      try {
        const response = await api.get('/staff/document-requests', {
          params: {
            search: search || undefined,
            status: status || undefined,
            page: currentPage,
            per_page: PAGE_SIZE,
          },
        })

        if (cancelled) {
          return
        }

        const result = response.data
        const rows = Array.isArray(result.data) ? result.data : []

        setRequests(rows)
        setPagination({
          currentPage: result.current_page ?? currentPage,
          lastPage: result.last_page ?? 1,
          total: result.total ?? rows.length,
          from: result.from ?? (rows.length ? 1 : null),
          to: result.to ?? (rows.length || null),
        })
      } catch (requestError) {
        if (!cancelled) {
          setError(
            getErrorMessage(
              requestError,
              'Unable to load document requests. Please try again.',
            ),
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })

    return () => {
      cancelled = true
    }
  }, [search, status, currentPage])

  function handleSearchSubmit(event) {
    event.preventDefault()
    setSuccess('')
    setCurrentPage(1)
    setSearch(searchInput.trim())
  }

  function handleStatusChange(event) {
    setSuccess('')
    setCurrentPage(1)
    setStatus(event.target.value)
  }

  function openDecisionDialog(request, nextDecision) {
    setSelectedRequest(request)
    setDecision(nextDecision)
    setStaffRemarks(request.staff_remarks || '')
    setError('')
    setSuccess('')
  }

  function closeDecisionDialog() {
    if (actionLoading) {
      return
    }

    setSelectedRequest(null)
    setStaffRemarks('')
  }

  async function handleDecisionSubmit(event) {
    event.preventDefault()

    if (!selectedRequest || actionLoading) {
      return
    }

    const actionLabel =
      decision === 'approved' ? 'approve' : 'reject'

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} this document request?`,
    )

    if (!confirmed) {
      return
    }

    setActionLoading(true)
    setError('')
    setSuccess('')

    try {
      await api.put(
        `/staff/document-requests/${selectedRequest.id}`,
        {
          status: decision,
          staff_remarks: staffRemarks.trim() || null,
        },
      )

      setSuccess(
        `Document request successfully ${decision}.`,
      )
      setSelectedRequest(null)
      setStaffRemarks('')
      await loadRequests()
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          `Unable to ${actionLabel} this request. Please try again.`,
        ),
      )
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRelease(request) {
    const confirmed = window.confirm(
      `Mark the request for ${getResidentName(request.resident)} as released?`,
    )

    if (!confirmed) {
      return
    }

    setError('')
    setSuccess('')
    setActionLoading(true)

    try {
      await api.put(
        `/staff/document-requests/${request.id}/release`,
      )

      setSuccess('Document request marked as released.')
      await loadRequests()
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          'Unable to release this request. Please try again.',
        ),
      )
    } finally {
      setActionLoading(false)
    }
  }

  function goToPage(nextPage) {
    if (
      nextPage < 1 ||
      nextPage > pagination.lastPage ||
      nextPage === currentPage
    ) {
      return
    }

    setCurrentPage(nextPage)
  }

  return (
    <section className="requests-page">
      <div className="requests-page-header">
        <div>
          <p className="section-eyebrow">
            BARANGAY ADMINISTRATION
          </p>
          <h1>Document Requests</h1>
          <p>
            Review resident applications and manage document request
            processing.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={loadRequests}
          disabled={loading || actionLoading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <section className="requests-summary">
        <div className="requests-summary-card">
          <span>Total matching requests</span>
          <strong>{pagination.total.toLocaleString()}</strong>
        </div>

        <div className="requests-summary-card">
          <span>Current page</span>
          <strong>
            {pagination.currentPage} / {pagination.lastPage}
          </strong>
        </div>
      </section>

      <section className="requests-panel">
        <div className="requests-panel-header">
          <div>
            <h2>Request records</h2>
            <p>
              Search by resident or document type, or filter by status.
            </p>
          </div>
        </div>

        <form
          className="requests-filters"
          onSubmit={handleSearchSubmit}
        >
          <label className="requests-search-field">
            <span>Search requests</span>
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Resident name or document type..."
              maxLength={100}
            />
          </label>

          <label className="requests-status-filter">
            <span>Filter by status</span>
            <select value={status} onChange={handleStatusChange}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            Search
          </button>

          <button
            type="button"
            className="secondary-button"
            disabled={!search && !status && !searchInput}
            onClick={() => {
              setSearchInput('')
              setSearch('')
              setStatus('')
              setCurrentPage(1)
              setSuccess('')
            }}
          >
            Clear
          </button>
        </form>

        {error && (
          <div className="requests-alert requests-alert-error" role="alert">
            <span>{error}</span>
            <button
              type="button"
              onClick={loadRequests}
              disabled={loading}
            >
              Try again
            </button>
          </div>
        )}

        {success && (
          <div
            className="requests-alert requests-alert-success"
            role="status"
          >
            {success}
          </div>
        )}

        <div className="requests-table-wrapper">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Resident</th>
                <th>Document type</th>
                <th>Date requested</th>
                <th>Status</th>
                <th>Staff remarks</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="requests-table-message">
                    Loading document requests...
                  </td>
                </tr>
              )}

              {!loading && !error && requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="requests-table-message">
                    No document requests found.
                  </td>
                </tr>
              )}

              {!loading &&
                requests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <strong>
                        {getResidentName(request.resident)}
                      </strong>
                      <span className="requests-secondary-text">
                        Request #{request.id}
                      </span>
                    </td>

                    <td>{getDocumentName(request)}</td>

                    <td>
                      {formatDate(
                        request.created_at || request.request_date,
                      )}
                    </td>

                    <td>
                      <StatusBadge status={request.status} />
                    </td>

                    <td>
                      {request.staff_remarks || '—'}
                    </td>

                    <td>
                      <div className="requests-actions">
                        {request.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              className="requests-action-button requests-approve-button"
                              onClick={() =>
                                openDecisionDialog(request, 'approved')
                              }
                              disabled={actionLoading}
                            >
                              Approve
                            </button>

                            <button
                              type="button"
                              className="requests-action-button requests-reject-button"
                              onClick={() =>
                                openDecisionDialog(request, 'rejected')
                              }
                              disabled={actionLoading}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {request.status === 'approved' && (
                          <button
                            type="button"
                            className="requests-action-button requests-release-button"
                            onClick={() => handleRelease(request)}
                            disabled={actionLoading}
                          >
                            Mark released
                          </button>
                        )}

                        {request.status !== 'pending' &&
                          request.status !== 'approved' && (
                            <span className="requests-no-action">
                              No action available
                            </span>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="requests-pagination">
          <p>
            Showing {pagination.from ?? 0}–{pagination.to ?? 0} of{' '}
            {pagination.total} requests
          </p>

          <div className="requests-pagination-controls">
            <button
              type="button"
              className="secondary-button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={loading || currentPage <= 1}
            >
              Previous
            </button>

            <span>
              Page {currentPage} of {pagination.lastPage}
            </span>

            <button
              type="button"
              className="secondary-button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={
                loading || currentPage >= pagination.lastPage
              }
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {selectedRequest && (
        <div
          className="requests-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDecisionDialog()
            }
          }}
        >
          <section
            className="requests-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="requests-modal-title"
          >
            <div className="requests-modal-header">
              <div>
                <p className="section-eyebrow">REQUEST REVIEW</p>
                <h2 id="requests-modal-title">
                  {decision === 'approved'
                    ? 'Approve request'
                    : 'Reject request'}
                </h2>
              </div>

              <button
                type="button"
                className="requests-modal-close"
                onClick={closeDecisionDialog}
                disabled={actionLoading}
                aria-label="Close dialog"
              >
                ×
              </button>
            </div>

            <p>
              You are about to {decision === 'approved' ? 'approve' : 'reject'}{' '}
              the document request for{' '}
              <strong>
                {getResidentName(selectedRequest.resident)}
              </strong>
              .
            </p>

            <p className="requests-modal-document">
              {getDocumentName(selectedRequest)}
            </p>

            <form onSubmit={handleDecisionSubmit}>
              <label className="requests-remarks-field">
                <span>Staff remarks (optional)</span>
                <textarea
                  value={staffRemarks}
                  onChange={(event) =>
                    setStaffRemarks(event.target.value)
                  }
                  maxLength={1000}
                  rows={4}
                  placeholder="Add a note for this request..."
                />
              </label>

              {error && (
                <div
                  className="requests-alert requests-alert-error"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="requests-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeDecisionDialog}
                  disabled={actionLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={
                    decision === 'approved'
                      ? 'requests-action-button requests-approve-button'
                      : 'requests-action-button requests-reject-button'
                  }
                  disabled={actionLoading}
                >
                  {actionLoading
                    ? 'Saving...'
                    : decision === 'approved'
                      ? 'Confirm approval'
                      : 'Confirm rejection'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  )
}

