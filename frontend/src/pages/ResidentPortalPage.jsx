import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.js'
import api from '../services/api.js'
import './ResidentPortalPage.css'

const emptyProfile = {
  first_name: '',
  middle_name: '',
  last_name: '',
  birth_date: '',
  gender: '',
  civil_status: '',
  phone: '',
  address: '',
  purok: '',
}

function getErrorMessage(error, fallback) {
  const errors = error.response?.data?.errors
  const firstError = errors ? Object.values(errors).flat()[0] : null

  return firstError || error.response?.data?.message || fallback
}

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(`${value}`.slice(0, 10) + 'T00:00:00')

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString()
}

function statusClass(status) {
  return `resident-status resident-status-${String(status || 'pending')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}`
}

export default function ResidentPortalPage() {
  const { user, logout } = useAuth()

  const [activeTab, setActiveTab] = useState('Overview')
  const [profile, setProfile] = useState(emptyProfile)
  const [hasProfile, setHasProfile] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')

  const [documentTypes, setDocumentTypes] = useState([])
  const [selectedType, setSelectedType] = useState('')
  const [purpose, setPurpose] = useState('')
  const [requests, setRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [typesError, setTypesError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [requestMessage, setRequestMessage] = useState('')
  const [requestSubmitting, setRequestSubmitting] = useState(false)

  const [pageError, setPageError] = useState('')

  const loadProfile = useCallback(async () => {
    setProfileLoading(true)
    setProfileError('')

    try {
      const response = await api.get('/resident/profile')
      const resident = response.data.resident

      setProfile({
        ...emptyProfile,
        ...resident,
        birth_date: resident.birth_date
          ? String(resident.birth_date).slice(0, 10)
          : '',
      })
      setHasProfile(true)
    } catch (error) {
      if (error.response?.status === 404) {
        setProfile(emptyProfile)
        setHasProfile(false)
      } else {
        setProfileError(
          getErrorMessage(error, 'Unable to load your profile.'),
        )
      }
    } finally {
      setProfileLoading(false)
    }
  }, [])

  const loadDocumentTypes = useCallback(async () => {
    setTypesError('')

    try {
      const response = await api.get('/document-types')
      setDocumentTypes(response.data.document_types || [])
    } catch (error) {
      setTypesError(
        getErrorMessage(error, 'Unable to load available document types.'),
      )
    }
  }, [])

  const loadRequests = useCallback(async () => {
    setRequestsLoading(true)
    setPageError('')

    try {
      const response = await api.get('/my-document-requests')
      setRequests(response.data.document_requests || [])
    } catch (error) {
      if (error.response?.status === 404) {
        setRequests([])
      } else {
        setPageError(
          getErrorMessage(error, 'Unable to load your document requests.'),
        )
      }
    } finally {
      setRequestsLoading(false)
    }
  }, [])

    useEffect(() => {
    let cancelled = false

    async function loadInitialData() {
      const safeLoad = async (loadFunction) => {
        if (cancelled) return

        await loadFunction()
      }

      await Promise.all([
        safeLoad(loadProfile),
        safeLoad(loadDocumentTypes),
        safeLoad(loadRequests),
      ])
    }

    Promise.resolve().then(() => {
      if (!cancelled) {
        loadInitialData()
      }
    })

    return () => {
      cancelled = true
    }
  }, [loadProfile, loadDocumentTypes, loadRequests])

  function updateProfileField(event) {
    const { name, value } = event.target
    setProfile((current) => ({ ...current, [name]: value }))
  }

  async function handleProfileSubmit(event) {
    event.preventDefault()
    setProfileSaving(true)
    setProfileMessage('')
    setProfileError('')

    try {
      const response = hasProfile
        ? await api.put('/resident/profile', profile)
        : await api.post('/resident/profile', profile)

      const resident = response.data.resident

      setProfile({
        ...emptyProfile,
        ...resident,
        birth_date: resident.birth_date
          ? String(resident.birth_date).slice(0, 10)
          : '',
      })
      setHasProfile(true)
      setProfileMessage(response.data.message || 'Profile saved successfully.')
    } catch (error) {
      setProfileError(
        getErrorMessage(error, 'Unable to save your profile.'),
      )
    } finally {
      setProfileSaving(false)
    }
  }

  async function handleRequestSubmit(event) {
    event.preventDefault()
    setRequestError('')
    setRequestMessage('')

    if (!hasProfile) {
      setRequestError('Please complete and save your resident profile first.')
      setActiveTab('My Profile')
      return
    }

    setRequestSubmitting(true)

    try {
      const response = await api.post('/document-requests', {
        document_type_id: Number(selectedType),
        purpose: purpose.trim(),
      })

      setRequestMessage(
        response.data.message || 'Your document request was submitted.',
      )
      setSelectedType('')
      setPurpose('')
      await loadRequests()
    } catch (error) {
      setRequestError(
        getErrorMessage(error, 'Unable to submit your document request.'),
      )
    } finally {
      setRequestSubmitting(false)
    }
  }

  async function handleLogout() {
    try {
      await logout()
    } catch {
      // AuthContext clears the local session even if the API call fails.
    }
  }

  const pendingCount = requests.filter(
    (request) => String(request.status).toLowerCase() === 'pending',
  ).length

  const completedCount = requests.filter((request) =>
    ['released', 'completed'].includes(
      String(request.status).toLowerCase(),
    ),
  ).length

  return (
    <div className="resident-shell">
      <header className="resident-header">
        <div className="resident-brand">
          <div className="resident-brand-icon">B</div>
          <div>
            <strong>Barangay Information System</strong>
            <span>Resident Portal</span>
          </div>
        </div>

        <div className="resident-header-user">
          <div>
            <strong>{user?.name || 'Resident'}</strong>
            <span>Resident account</span>
          </div>
          <button type="button" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="resident-main">
        <section className="resident-welcome">
          <p className="resident-eyebrow">RESIDENT SERVICES</p>
          <h1>Welcome, {user?.name || 'Resident'}!</h1>
          <p>
            Manage your resident information, request barangay documents,
            and check the status of your applications.
          </p>
        </section>

        <nav className="resident-tabs" aria-label="Resident navigation">
          {['Overview', 'My Profile', 'My Requests'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
              aria-current={activeTab === tab ? 'page' : undefined}
            >
              {tab}
            </button>
          ))}
        </nav>

        {activeTab === 'Overview' && (
          <div className="resident-content">
            <div className="resident-stats">
              <article className="resident-stat">
                <span>Total requests</span>
                <strong>{requestsLoading ? '…' : requests.length}</strong>
                <p>All your document applications</p>
              </article>
              <article className="resident-stat">
                <span>Pending requests</span>
                <strong>{requestsLoading ? '…' : pendingCount}</strong>
                <p>Awaiting staff review</p>
              </article>
              <article className="resident-stat">
                <span>Completed requests</span>
                <strong>{requestsLoading ? '…' : completedCount}</strong>
                <p>Released or completed</p>
              </article>
            </div>

            {!hasProfile && !profileLoading && (
              <section className="resident-notice">
                <div>
                  <h2>Complete your resident profile</h2>
                  <p>
                    Save your resident information before submitting a
                    document request.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('My Profile')}
                >
                  Complete profile
                </button>
              </section>
            )}

            {pageError && (
              <div className="resident-alert error" role="alert">
                {pageError}
                <button type="button" onClick={loadRequests}>
                  Try again
                </button>
              </div>
            )}

            <section className="resident-panel">
              <div className="resident-panel-heading">
                <div>
                  <h2>Recent document requests</h2>
                  <p>Track the latest applications you submitted.</p>
                </div>
                <button
                  type="button"
                  className="resident-secondary-button"
                  onClick={loadRequests}
                  disabled={requestsLoading}
                >
                  {requestsLoading ? 'Loading…' : 'Refresh'}
                </button>
              </div>

              <RequestList
                requests={requests.slice(0, 5)}
                loading={requestsLoading}
                onViewAll={() => setActiveTab('My Requests')}
              />
            </section>

            <section className="resident-panel">
              <div className="resident-panel-heading">
                <div>
                  <h2>Request a document</h2>
                  <p>
                    Choose an available document and explain its purpose.
                  </p>
                </div>
              </div>

              {!hasProfile ? (
                <p className="resident-help">
                  Complete your profile first to unlock document requests.
                </p>
              ) : (
                <RequestForm
                  documentTypes={documentTypes}
                  selectedType={selectedType}
                  setSelectedType={setSelectedType}
                  purpose={purpose}
                  setPurpose={setPurpose}
                  onSubmit={handleRequestSubmit}
                  submitting={requestSubmitting}
                  error={requestError}
                  message={requestMessage}
                  typesError={typesError}
                  reloadTypes={loadDocumentTypes}
                />
              )}
            </section>
          </div>
        )}

        {activeTab === 'My Profile' && (
          <section className="resident-panel">
            <div className="resident-panel-heading">
              <div>
                <h2>My resident profile</h2>
                <p>Keep your contact and address information up to date.</p>
              </div>
              <button
                type="button"
                className="resident-secondary-button"
                onClick={loadProfile}
                disabled={profileLoading || profileSaving}
              >
                Reload
              </button>
            </div>

            {profileLoading ? (
              <p className="resident-help" role="status">
                Loading your profile…
              </p>
            ) : (
              <form className="resident-form" onSubmit={handleProfileSubmit}>
                {profileError && (
                  <div className="resident-alert error" role="alert">
                    {profileError}
                  </div>
                )}
                {profileMessage && (
                  <div className="resident-alert success" role="status">
                    {profileMessage}
                  </div>
                )}

                <div className="resident-form-grid">
                  <Field
                    label="First name"
                    name="first_name"
                    value={profile.first_name}
                    onChange={updateProfileField}
                    required
                  />
                  <Field
                    label="Middle name"
                    name="middle_name"
                    value={profile.middle_name}
                    onChange={updateProfileField}
                  />
                  <Field
                    label="Last name"
                    name="last_name"
                    value={profile.last_name}
                    onChange={updateProfileField}
                    required
                  />
                  <Field
                    label="Birth date"
                    name="birth_date"
                    type="date"
                    value={profile.birth_date}
                    onChange={updateProfileField}
                  />
                  <SelectField
                    label="Gender"
                    name="gender"
                    value={profile.gender}
                    onChange={updateProfileField}
                    options={['Male', 'Female', 'Other', 'Prefer not to say']}
                  />
                  <SelectField
                    label="Civil status"
                    name="civil_status"
                    value={profile.civil_status}
                    onChange={updateProfileField}
                    options={['Single', 'Married', 'Widowed', 'Separated']}
                  />
                  <Field
                    label="Phone number"
                    name="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={updateProfileField}
                  />
                  <Field
                    label="Purok"
                    name="purok"
                    value={profile.purok}
                    onChange={updateProfileField}
                  />
                  <div className="resident-field resident-field-wide">
                    <label htmlFor="profile-address">Complete address</label>
                    <textarea
                      id="profile-address"
                      name="address"
                      value={profile.address}
                      onChange={updateProfileField}
                      rows={3}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="resident-primary-button"
                  disabled={profileSaving}
                >
                  {profileSaving
                    ? 'Saving profile…'
                    : hasProfile
                      ? 'Save changes'
                      : 'Create resident profile'}
                </button>
              </form>
            )}
          </section>
        )}

        {activeTab === 'My Requests' && (
          <section className="resident-panel">
            <div className="resident-panel-heading">
              <div>
                <h2>My document requests</h2>
                <p>View the status of your submitted applications.</p>
              </div>
              <button
                type="button"
                className="resident-secondary-button"
                onClick={loadRequests}
                disabled={requestsLoading}
              >
                {requestsLoading ? 'Loading…' : 'Refresh'}
              </button>
            </div>

            {pageError && (
              <div className="resident-alert error" role="alert">
                {pageError}
              </div>
            )}

            <RequestList
              requests={requests}
              loading={requestsLoading}
            />

            <div className="resident-request-action">
              <button
                type="button"
                className="resident-primary-button"
                onClick={() => setActiveTab('Overview')}
              >
                Submit a document request
              </button>
            </div>
          </section>
        )}

        <footer className="resident-footer">
          Barangay Information System · Resident Services
        </footer>
      </main>
    </div>
  )
}

function Field({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required = false,
}) {
  return (
    <div className="resident-field">
      <label htmlFor={`profile-${name}`}>{label}</label>
      <input
        id={`profile-${name}`}
        name={name}
        type={type}
        value={value || ''}
        onChange={onChange}
        required={required}
      />
    </div>
  )
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div className="resident-field">
      <label htmlFor={`profile-${name}`}>{label}</label>
      <select
        id={`profile-${name}`}
        name={name}
        value={value || ''}
        onChange={onChange}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

function RequestForm({
  documentTypes,
  selectedType,
  setSelectedType,
  purpose,
  setPurpose,
  onSubmit,
  submitting,
  error,
  message,
  typesError,
  reloadTypes,
}) {
  return (
    <form className="resident-form" onSubmit={onSubmit}>
      {error && (
        <div className="resident-alert error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="resident-alert success" role="status">
          {message}
        </div>
      )}
      {typesError && (
        <div className="resident-alert error" role="alert">
          {typesError}
          <button type="button" onClick={reloadTypes}>
            Try again
          </button>
        </div>
      )}

      <div className="resident-form-grid">
        <div className="resident-field resident-field-wide">
          <label htmlFor="request-document-type">Document type</label>
          <select
            id="request-document-type"
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value)}
            required
          >
            <option value="">Select a document</option>
            {documentTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
                {type.fee !== null && type.fee !== undefined
                  ? ` — Fee: ${type.fee}`
                  : ''}
              </option>
            ))}
          </select>
          {documentTypes.length === 0 && !typesError && (
            <span className="resident-field-hint">
              No active document types are currently available.
            </span>
          )}
        </div>

        <div className="resident-field resident-field-wide">
          <label htmlFor="request-purpose">Purpose of request</label>
          <textarea
            id="request-purpose"
            value={purpose}
            onChange={(event) => setPurpose(event.target.value)}
            maxLength={255}
            rows={3}
            placeholder="Explain why you need this document"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="resident-primary-button"
        disabled={submitting || documentTypes.length === 0}
      >
        {submitting ? 'Submitting request…' : 'Submit request'}
      </button>
    </form>
  )
}

function RequestList({ requests, loading, onViewAll }) {
  if (loading) {
    return <p className="resident-help" role="status">Loading requests…</p>
  }

  if (requests.length === 0) {
    return (
      <div className="resident-empty">
        <h3>No document requests yet</h3>
        <p>Your submitted document requests will appear here.</p>
      </div>
    )
  }

  return (
    <>
      <div className="resident-table-wrap">
        <table className="resident-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Purpose</th>
              <th>Date submitted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>
                  {request.document_type?.name ||
                    request.documentType?.name ||
                    'Document'}
                </td>
                <td>{request.purpose}</td>
                <td>{formatDate(request.created_at)}</td>
                <td>
                  <span className={statusClass(request.status)}>
                    {request.status || 'Pending'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {onViewAll && requests.length >= 5 && (
        <button
          type="button"
          className="resident-text-button"
          onClick={onViewAll}
        >
          View all requests
        </button>
      )}
    </>
  )
}
