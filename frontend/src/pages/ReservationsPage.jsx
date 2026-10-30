import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useDebounce } from '../hooks/useDebounce'
import { formatDate } from '../utils/formatters'
import { Alert, Button, ConfirmDialog, DataTable, EmptyState, FormInput, FormSelect, Pagination, Spinner, StatusBadge, notify } from '../components/ui'

const firstError = (errors, key) => errors?.[key]?.[0]

export function ReservationsPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState({
    search: searchParams.get('search') ?? '', status: searchParams.get('status') ?? '',
    facility_id: searchParams.get('facility_id') ?? '', date_from: searchParams.get('date_from') ?? '', date_to: searchParams.get('date_to') ?? '',
  })
  const search = useDebounce(filters.search)
  const [facilities, setFacilities] = useState([])
  const [result, setResult] = useState({ data: [], meta: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(Number(searchParams.get('page') ?? 1))
  const update = (key) => (event) => { setFilters((current) => ({ ...current, [key]: event.target.value })); setPage(1) }

  useEffect(() => { api.get('/facilities/options').then(({ data }) => setFacilities(data.data ?? data)).catch(() => {}) }, [])
  useEffect(() => {
    let active = true
    const params = Object.fromEntries(Object.entries({ ...filters, search, page }).filter(([, value]) => value !== ''))
    setSearchParams(params, { replace: true })
    setLoading(true)
    api.get('/reservations', { params }).then(({ data }) => { if (active) setResult(data) })
      .catch(() => { if (active) setError('Reservation records could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [search, filters.status, filters.facility_id, filters.date_from, filters.date_to, page, setSearchParams])

  const columns = useMemo(() => [
    { key: 'event', label: 'Event', render: (row) => <Link className="table-link" to={`/reservations/${row.id}`}>{row.purpose}</Link> },
    ...(user?.role === 'admin' ? [{ key: 'resident', label: 'Resident', render: (row) => row.user?.name }] : []),
    { key: 'facility', label: 'Facility', render: (row) => row.facility?.name },
    { key: 'schedule', label: 'Schedule', render: (row) => <>{formatDate(row.event_date)}<small className="table-subline">{row.start_time}-{row.end_time}</small></> },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'action', label: '', render: (row) => <Link className="text-action" to={`/reservations/${row.id}`}>Open</Link> },
  ], [user?.role])

  return (
    <div className="page-enter">
      <div className="page-heading"><div><span className="eyebrow">BOOKING RECORDS</span><h1>Reservations</h1><p>{user?.role === 'admin' ? 'Review requests and keep the shared calendar current.' : 'Track your requests and upcoming community events.'}</p></div>{user?.role !== 'admin' && <Link className="button button-primary" to="/reservations/new">New reservation</Link>}</div>
      <section className="filter-bar" aria-label="Reservation filters">
        <FormInput id="search" label="Search" placeholder="Purpose, facility, resident" value={filters.search} onChange={update('search')} />
        <FormSelect id="status" label="Status" value={filters.status} onChange={update('status')}><option value="">All statuses</option>{['pending', 'approved', 'rejected', 'completed', 'cancelled'].map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</FormSelect>
        <FormSelect id="facility_id" label="Facility" value={filters.facility_id} onChange={update('facility_id')}><option value="">All facilities</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}</FormSelect>
        <FormInput id="date_from" label="From" type="date" value={filters.date_from} onChange={update('date_from')} />
        <FormInput id="date_to" label="To" type="date" value={filters.date_to} onChange={update('date_to')} />
      </section>
      {error && <Alert tone="error">{error}</Alert>}
      {loading ? <Spinner label="Loading reservations" /> : <>
        <DataTable rows={result.data ?? []} columns={columns} empty="No reservations match these filters." />
        <Pagination meta={result.meta} onPage={setPage} />
      </>}
    </div>
  )
}

export function ReservationFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)
  const [facilities, setFacilities] = useState([])
  const [equipmentList, setEquipmentList] = useState([])
  const [values, setValues] = useState({ facility_id: '', event_date: '', start_time: '09:00', end_time: '12:00', purpose: '', expected_guests: '', equipment: {} })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [pageError, setPageError] = useState('')
  const equipmentParams = useMemo(() => ({ event_date: values.event_date, start_time: values.start_time, end_time: values.end_time }), [values.event_date, values.start_time, values.end_time])

  useEffect(() => {
    let active = true
    Promise.all([api.get('/facilities/options'), api.get('/equipment/options')]).then(([facilityResponse, equipmentResponse]) => {
      if (!active) return
      setFacilities(facilityResponse.data.data ?? facilityResponse.data)
      setEquipmentList(equipmentResponse.data.data ?? equipmentResponse.data)
      if (editing) return api.get(`/reservations/${id}`).then(({ data }) => {
        const reservation = data.data ?? data
        const quantities = Object.fromEntries((reservation.equipment ?? []).map((item) => [item.id, item.pivot?.quantity ?? 1]))
        setValues({ facility_id: String(reservation.facility_id ?? reservation.facility?.id), event_date: reservation.event_date, start_time: reservation.start_time, end_time: reservation.end_time, purpose: reservation.purpose, expected_guests: String(reservation.expected_guests), equipment: quantities })
      })
    }).catch(() => { if (active) setPageError('The reservation form could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [editing, id])

  useEffect(() => {
    if (!values.event_date || !values.start_time || !values.end_time) return
    let active = true
    api.get('/equipment/options', { params: equipmentParams }).then(({ data }) => { if (active) setEquipmentList(data.data ?? data) }).catch(() => {})
    return () => { active = false }
  }, [equipmentParams])

  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }))
  const setQuantity = (equipmentId, quantity) => setValues((current) => ({ ...current, equipment: { ...current.equipment, [equipmentId]: quantity } }))
  const submit = async (event) => {
    event.preventDefault()
    const next = {}
    if (!values.facility_id) next.facility_id = ['Choose a facility.']
    if (!values.event_date || values.event_date < new Date().toISOString().slice(0, 10)) next.event_date = ['Choose today or a future date.']
    if (!values.start_time || !values.end_time || values.end_time <= values.start_time) next.end_time = ['End time must be after start time.']
    if (values.purpose.trim().length < 5) next.purpose = ['Add a short description of the event.']
    if (!Number(values.expected_guests) || Number(values.expected_guests) < 1) next.expected_guests = ['Enter at least one guest.']
    const unavailable = equipmentList.find((item) => Number(values.equipment[item.id] ?? 0) > Number(item.available_quantity ?? item.total_quantity))
    if (unavailable) next.equipment = [`Only ${unavailable.available_quantity ?? unavailable.total_quantity} ${unavailable.name} available for this schedule.`]
    if (Object.keys(next).length) return setErrors(next)
    const payload = {
      facility_id: Number(values.facility_id), event_date: values.event_date, start_time: values.start_time, end_time: values.end_time,
      purpose: values.purpose.trim(), expected_guests: Number(values.expected_guests),
      equipment: Object.entries(values.equipment).filter(([, quantity]) => Number(quantity) > 0).map(([equipment_id, quantity]) => ({ equipment_id: Number(equipment_id), quantity: Number(quantity) })),
    }
    setBusy(true); setErrors({}); setPageError('')
    try {
      if (editing) await api.put(`/reservations/${id}`, payload)
      else await api.post('/reservations', payload)
      notify(editing ? 'Reservation changes saved.' : 'Reservation request submitted.')
      navigate(editing ? `/reservations/${id}` : '/reservations')
    } catch (error) { setErrors(error.response?.data?.errors ?? { form: [error.response?.data?.message ?? 'Unable to save this reservation.'] }) }
    finally { setBusy(false) }
  }

  if (loading) return <Spinner label="Preparing reservation form" />
  return (
    <div className="page-enter form-page">
      <div className="page-heading"><div><span className="eyebrow">RESERVATION REQUEST</span><h1>{editing ? 'Edit request' : 'Reserve a facility'}</h1><p>Choose your schedule, event details, and any shared equipment.</p></div><Link className="text-action" to={editing ? `/reservations/${id}` : '/reservations'}>Back to reservations</Link></div>
      {pageError && <Alert tone="error">{pageError}</Alert>}{errors.form && <Alert tone="error">{errors.form[0]}</Alert>}
      <form className="reservation-form" onSubmit={submit} noValidate>
        <section className="form-section"><div className="form-section-heading"><span>01</span><div><h2>Facility and schedule</h2><p>Requests are confirmed by barangay staff.</p></div></div>
          <div className="form-grid"><FormSelect id="facility_id" label="Facility" value={values.facility_id} onChange={set('facility_id')} error={firstError(errors, 'facility_id')}><option value="">Select a facility</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name} - capacity {facility.capacity}</option>)}</FormSelect><FormInput id="event_date" label="Event date" type="date" min={new Date().toISOString().slice(0, 10)} value={values.event_date} onChange={set('event_date')} error={firstError(errors, 'event_date')} /><FormInput id="start_time" label="Start time" type="time" value={values.start_time} onChange={set('start_time')} error={firstError(errors, 'start_time')} /><FormInput id="end_time" label="End time" type="time" value={values.end_time} onChange={set('end_time')} error={firstError(errors, 'end_time')} /></div>
        </section>
        <section className="form-section"><div className="form-section-heading"><span>02</span><div><h2>Event details</h2><p>Help staff understand how the space will be used.</p></div></div>
          <FormInput id="purpose" label="Purpose of reservation" value={values.purpose} onChange={set('purpose')} placeholder="For example, Purok 3 community meeting" error={firstError(errors, 'purpose')} /><FormInput id="expected_guests" label="Expected guests" type="number" min="1" value={values.expected_guests} onChange={set('expected_guests')} error={firstError(errors, 'expected_guests')} />
        </section>
        <section className="form-section"><div className="form-section-heading"><span>03</span><div><h2>Equipment request</h2><p>Available stock updates when you set the event schedule.</p></div></div>
          <div className="equipment-list">{equipmentList.map((item) => <label className="equipment-choice" key={item.id}><span className="equipment-info"><strong>{item.name}</strong><small>{item.category?.name} - {item.available_quantity ?? item.total_quantity} available</small></span><input aria-label={`${item.name} quantity`} type="number" min="0" max={item.available_quantity ?? item.total_quantity} value={values.equipment[item.id] ?? 0} onChange={(event) => setQuantity(item.id, event.target.value)} /><span>qty</span></label>)}</div>
          {firstError(errors, 'equipment') && <small className="field-error">{firstError(errors, 'equipment')}</small>}
        </section>
        <div className="form-actions"><Button type="submit" disabled={busy}>{busy ? 'Saving...' : editing ? 'Save changes' : 'Submit request'}</Button><Link to={editing ? `/reservations/${id}` : '/reservations'} className="button button-quiet">Cancel</Link></div>
      </form>
    </div>
  )
}

export function ReservationDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [reservation, setReservation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [remarks, setRemarks] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = () => api.get(`/reservations/${id}`).then(({ data }) => { const item = data.data ?? data; setReservation(item); setRemarks(item.admin_remarks ?? '') })
  useEffect(() => { let active = true; load().catch(() => { if (active) setError('This reservation could not be found or you do not have access.') }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [id])

  const cancel = async () => {
    setBusy(true)
    try { await api.delete(`/reservations/${id}`); notify('Reservation cancelled.'); navigate('/reservations') }
    catch (requestError) { setError(requestError.response?.data?.message ?? 'Unable to cancel this reservation.') }
    finally { setBusy(false); setConfirm(null) }
  }
  const changeStatus = async (status) => {
    if (status === 'rejected' && !remarks.trim()) { setError('Add a reason before rejecting this request.'); return }
    setBusy(true); setError('')
    try {
      await api.patch(`/reservations/${id}/status`, { status, admin_remarks: remarks })
      await load()
      notify(`Reservation ${status}.`)
    } catch (requestError) { setError(requestError.response?.data?.errors?.status?.[0] ?? requestError.response?.data?.errors?.admin_remarks?.[0] ?? requestError.response?.data?.message ?? 'Unable to update status.') }
    finally { setBusy(false); setConfirm(null) }
  }

  if (loading) return <Spinner label="Loading reservation" />
  if (!reservation) return <div className="page-error">{error || 'Reservation not found.'}<Link to="/reservations">Return to reservations</Link></div>
  const isOwner = user?.id === reservation.user?.id
  const isAdmin = user?.role === 'admin'
  return (
    <div className="page-enter detail-page">
      <div className="page-heading"><div><Link to="/reservations" className="back-link">Reservations</Link><span className="eyebrow">REQUEST #{String(reservation.id).padStart(4, '0')}</span><h1>{reservation.purpose}</h1></div><StatusBadge status={reservation.status} /></div>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="detail-grid"><section className="detail-main">
        <article className="detail-sheet"><div className="section-heading"><div><span className="eyebrow">EVENT DETAILS</span><h2>Reservation information</h2></div></div><dl className="detail-list">
          <div><dt>Facility</dt><dd>{reservation.facility?.name}</dd></div><div><dt>Event date</dt><dd>{formatDate(reservation.event_date)}</dd></div><div><dt>Time</dt><dd>{reservation.start_time}-{reservation.end_time}</dd></div><div><dt>Expected guests</dt><dd>{reservation.expected_guests}</dd></div><div><dt>Requested by</dt><dd>{reservation.user?.name}{reservation.user?.purok ? ` | ${reservation.user.purok}` : ''}</dd></div><div><dt>Purpose</dt><dd>{reservation.purpose}</dd></div>
        </dl></article>
        <article className="detail-sheet"><div className="section-heading"><div><span className="eyebrow">SHARED INVENTORY</span><h2>Equipment requested</h2></div></div>{reservation.equipment?.length ? <div className="equipment-summary">{reservation.equipment.map((item) => <div key={item.id}><span>{item.name}<small>{item.category?.name}</small></span><strong>{item.pivot?.quantity ?? 1}</strong></div>)}</div> : <p className="muted-copy">No equipment requested.</p>}</article>
        {reservation.admin_remarks && <article className="remarks-sheet"><span className="eyebrow">STAFF REMARKS</span><p>{reservation.admin_remarks}</p></article>}
      </section>
      <aside className="detail-side">
        {isAdmin && <section className="review-panel"><span className="eyebrow">STAFF REVIEW</span><h2>Update request</h2><label className="field" htmlFor="remarks"><span>Remarks</span><textarea id="remarks" rows="4" value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Add context for the resident" /></label>
          {reservation.status === 'pending' && <div className="review-actions"><Button onClick={() => changeStatus('approved')} disabled={busy}>Approve</Button><Button variant="danger" onClick={() => setConfirm('reject')} disabled={busy}>Reject</Button></div>}
          {reservation.status === 'approved' && <Button onClick={() => changeStatus('completed')} disabled={busy}>Mark completed</Button>}
          {!['pending', 'approved'].includes(reservation.status) && <p className="muted-copy">This request is closed.</p>}
        </section>}
        {isOwner && reservation.status === 'pending' && <section className="review-panel resident-actions"><span className="eyebrow">YOUR REQUEST</span><h2>Still pending review</h2><p>You can adjust the details or cancel while staff have not reviewed it.</p><Link className="button button-secondary" to={`/reservations/${id}/edit`}>Edit request</Link><Button variant="danger" onClick={() => setConfirm('cancel')}>Cancel reservation</Button></section>}
        {!isOwner && !isAdmin && <section className="review-panel"><span className="eyebrow">REQUEST STATUS</span><h2>Submitted {formatDate(reservation.created_at?.slice(0, 10))}</h2><p>Contact the barangay hall if you need help with this request.</p></section>}
      </aside></div>
      {confirm === 'cancel' && <ConfirmDialog title="Cancel this reservation?" message="This pending request will be marked as cancelled." confirmLabel="Cancel reservation" danger onCancel={() => setConfirm(null)} onConfirm={cancel} busy={busy} />}
      {confirm === 'reject' && <ConfirmDialog title="Reject this request?" message="The resident will see the rejection and your remarks." confirmLabel="Reject request" danger onCancel={() => setConfirm(null)} onConfirm={() => changeStatus('rejected')} busy={busy} />}
    </div>
  )
}
