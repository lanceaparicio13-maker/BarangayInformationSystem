import { useCallback, useEffect, useState } from 'react'
import api from '../services/api.js'
import './DocumentTypesPage.css'

const emptyForm = {
  name: '',
  description: '',
  fee: '0.00',
  is_active: true,
}

function getErrorMessage(error) {
  if (error.response?.status === 401) {
    return 'Your session has expired. Please sign in again.'
  }

  if (error.response?.status === 403) {
    return 'You do not have permission to manage document types.'
  }

  return (
    error.response?.data?.message ||
    'Something went wrong. Please try again.'
  )
}

function formatFee(fee) {
  return `₱${Number(fee || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default function DocumentTypesPage() {
  const [documentTypes, setDocumentTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [validationErrors, setValidationErrors] = useState({})

  const loadDocumentTypes = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get('/staff/document-types')
      setDocumentTypes(response.data.document_types ?? [])
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  
  useEffect(() => {
    let cancelled = false

    async function initialLoad() {
      try {
        const response = await api.get('/staff/document-types')

        if (!cancelled) {
          setDocumentTypes(response.data.document_types ?? [])
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

    initialLoad()

    return () => {
      cancelled = true
    }
  }, [])


  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setValidationErrors({})
  }

  function startEditing(documentType) {
    setEditingId(documentType.id)
    setForm({
      name: documentType.name ?? '',
      description: documentType.description ?? '',
      fee: String(documentType.fee ?? '0.00'),
      is_active: Boolean(documentType.is_active),
    })
    setValidationErrors({})
    setSuccess('')
    setError('')
  }

  function handleFormChange(event) {
    const { name, value, type, checked } = event.target

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))

    setValidationErrors((current) => ({
      ...current,
      [name]: undefined,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    setValidationErrors({})

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      fee: form.fee,
      is_active: form.is_active,
    }

    try {
      if (editingId !== null) {
        await api.put(`/staff/document-types/${editingId}`, payload)
        setSuccess('Document type updated successfully.')
      } else {
        await api.post('/staff/document-types', {
          ...payload,
          is_active: form.is_active,
        })
        setSuccess('Document type created successfully.')
      }

      resetForm()
      await loadDocumentTypes()
    } catch (requestError) {
      if (requestError.response?.status === 422) {
        setValidationErrors(requestError.response.data.errors ?? {})
        setError(
          requestError.response.data.message ||
          'Please check the form and correct the highlighted fields.',
        )
      } else {
        setError(getErrorMessage(requestError))
      }
    } finally {
      setSaving(false)
    }
  }

  const filteredTypes = documentTypes.filter((type) => {
    const matchesSearch =
      type.name.toLowerCase().includes(search.toLowerCase()) ||
      (type.description ?? '').toLowerCase().includes(search.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && type.is_active) ||
      (statusFilter === 'inactive' && !type.is_active)

    return matchesSearch && matchesStatus
  })

  const activeCount = documentTypes.filter((type) => type.is_active).length
  const inactiveCount = documentTypes.length - activeCount

  return (
    <section className="document-types-page">
      <div className="document-types-heading">
        <div>
          <p className="section-eyebrow">BARANGAY INFORMATION SYSTEM</p>
          <h1>Document Types Management</h1>
          <p>
            Manage available certificates, document descriptions, fees,
            and request availability.
          </p>
        </div>

        <div className="document-types-summary">
          <div>
            <span>Total types</span>
            <strong>{loading ? '...' : documentTypes.length}</strong>
          </div>
          <div>
            <span>Active</span>
            <strong>{loading ? '...' : activeCount}</strong>
          </div>
          <div>
            <span>Inactive</span>
            <strong>{loading ? '...' : inactiveCount}</strong>
          </div>
        </div>
      </div>

      {error && (
        <div className="document-types-alert error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="document-types-button secondary"
            onClick={loadDocumentTypes}
            disabled={loading || saving}
          >
            Retry loading
          </button>
        </div>
      )}

      {success && (
        <div className="document-types-alert success" role="status">
          {success}
        </div>
      )}

      <div className="document-types-layout">
        <section className="document-types-panel">
          <div className="document-types-panel-heading">
            <div>
              <h2>{editingId !== null ? 'Edit document type' : 'Add document type'}</h2>
              <p>
                {editingId !== null
                  ? 'Update the details or change its availability.'
                  : 'Create a new type of document residents can request.'}
              </p>
            </div>
          </div>

          <form className="document-types-form" onSubmit={handleSubmit}>
            <div className="document-types-field">
              <label htmlFor="document-type-name">Document name *</label>
              <input
                id="document-type-name"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="e.g. Barangay Clearance"
                maxLength={255}
                required
              />
              {validationErrors.name?.map((message) => (
                <span className="document-types-field-error" key={message}>
                  {message}
                </span>
              ))}
            </div>

            <div className="document-types-field">
              <label htmlFor="document-type-description">Description</label>
              <textarea
                id="document-type-description"
                name="description"
                value={form.description}
                onChange={handleFormChange}
                placeholder="Explain the purpose of this document."
                rows={4}
                maxLength={5000}
              />
              {validationErrors.description?.map((message) => (
                <span className="document-types-field-error" key={message}>
                  {message}
                </span>
              ))}
            </div>

            <div className="document-types-field">
              <label htmlFor="document-type-fee">Fee (PHP) *</label>
              <input
                id="document-type-fee"
                name="fee"
                type="number"
                value={form.fee}
                onChange={handleFormChange}
                min="0"
                max="99999999.99"
                step="0.01"
                required
              />
              {validationErrors.fee?.map((message) => (
                <span className="document-types-field-error" key={message}>
                  {message}
                </span>
              ))}
            </div>

            <label className="document-types-checkbox">
              <input
                name="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={handleFormChange}
              />
              <span>
                <strong>Available for requests</strong>
                <small>
                  Inactive document types are hidden from resident request options.
                </small>
              </span>
            </label>

            <div className="document-types-form-actions">
              <button
                type="submit"
                className="document-types-button primary"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingId !== null
                    ? 'Save changes'
                    : 'Add document type'}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  className="document-types-button secondary"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="document-types-panel document-types-list-panel">
          <div className="document-types-panel-heading">
            <div>
              <h2>Document type directory</h2>
              <p>Search and edit the types configured in the system.</p>
            </div>
          </div>

          <div className="document-types-filters">
            <label>
              <span className="document-types-sr-only">Search document types</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by document name..."
              />
            </label>

            <label>
              <span className="document-types-sr-only">Filter by status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive only</option>
              </select>
            </label>
          </div>

          <div className="document-types-table-wrapper">
            <table className="document-types-table">
              <thead>
                <tr>
                  <th scope="col">Document</th>
                  <th scope="col">Fee</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4} className="document-types-empty">
                      <span role="status">Loading document types...</span>
                    </td>
                  </tr>
                )}

                {!loading && filteredTypes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="document-types-empty">
                      {documentTypes.length === 0
                        ? 'No document types have been added yet.'
                        : 'No document types match your filters.'}
                    </td>
                  </tr>
                )}

                {!loading && filteredTypes.map((type) => (
                  <tr key={type.id}>
                    <td>
                      <div className="document-types-name">
                        <strong>{type.name}</strong>
                        <span>{type.description || 'No description provided'}</span>
                      </div>
                    </td>
                    <td className="document-types-fee">{formatFee(type.fee)}</td>
                    <td>
                      <span className={`document-types-status ${type.is_active ? 'active' : 'inactive'}`}>
                        {type.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="document-types-button secondary"
                        onClick={() => startEditing(type)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="document-types-list-footer">
            Showing {loading ? '...' : filteredTypes.length} of {documentTypes.length} document types
          </div>
        </section>
      </div>
    </section>
  )
}
