import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatDate } from '../utils/formatters'
import { DataTable, EmptyState, Spinner, StatCard, StatusBadge } from '../components/ui'

export default function DashboardPage() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    api.get('/dashboard').then(({ data }) => { if (active) setDashboard(data) })
      .catch(() => { if (active) setError('Dashboard information could not be loaded.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  if (loading) return <Spinner label="Loading your dashboard" />
  if (error) return <div className="page-error">{error}</div>
  const totals = dashboard?.totals ?? {}

  if (!user?.role || user.role === 'resident') {
    const next = dashboard?.next_reservation?.data ?? dashboard?.next_reservation
    return (
      <div className="page-enter">
        <div className="page-heading"><div><span className="eyebrow">RESIDENT OVERVIEW</span><h1>Good day, {user?.name?.split(' ')[0]}.</h1><p>Here is the latest on your facility requests.</p></div><Link className="button button-primary" to="/reservations/new">New reservation</Link></div>
        <div className="stats-grid">
          <StatCard label="All requests" value={totals.all ?? 0} tone="green" />
          <StatCard label="Awaiting review" value={totals.pending ?? 0} tone="amber" />
          <StatCard label="Approved" value={totals.approved ?? 0} tone="blue" />
          <StatCard label="Completed" value={totals.completed ?? 0} tone="slate" />
        </div>
        <section className="section-block">
          <div className="section-heading"><div><span className="eyebrow">UP NEXT</span><h2>Your next approved reservation</h2></div><Link to="/reservations">All requests</Link></div>
          {next ? <article className="next-reservation"><div className="next-date"><strong>{new Date(`${next.event_date}T00:00:00`).toLocaleDateString('en-PH', { day: '2-digit' })}</strong><span>{new Date(`${next.event_date}T00:00:00`).toLocaleDateString('en-PH', { month: 'short' })}</span></div><div className="next-details"><span className="eyebrow">{next.facility?.name}</span><h3>{next.purpose}</h3><p>{formatDate(next.event_date)} | {next.start_time}-{next.end_time} | {next.expected_guests} guests</p></div><StatusBadge status={next.status} /></article> : <EmptyState title="No approved events yet" description="Your approved reservations will appear here." action={<Link to="/reservations">View requests</Link>} />}
        </section>
        <section className="quiet-note"><span>Need a space for a community event?</span><p>Browse available facilities and submit a reservation request for staff review.</p><Link to="/facilities">Explore facilities</Link></section>
      </div>
    )
  }

  const events = dashboard?.upcoming_events?.data ?? dashboard?.upcoming_events ?? []
  const lowStock = dashboard?.low_stock_equipment?.data ?? dashboard?.low_stock_equipment ?? []
  return (
    <div className="page-enter">
      <div className="page-heading"><div><span className="eyebrow">BARANGAY OPERATIONS</span><h1>Dashboard</h1><p>Reservation activity and shared resources at a glance.</p></div><Link className="button button-primary" to="/reservations">Review requests</Link></div>
      <div className="stats-grid">
        <StatCard label="Total reservations" value={totals.reservations ?? 0} note="All time" tone="green" />
        <StatCard label="Pending requests" value={totals.pending ?? 0} note="Need staff review" tone="amber" />
        <StatCard label="Approved this week" value={totals.approved_this_week ?? 0} note="Monday to Sunday" tone="blue" />
        <StatCard label="Low-stock items" value={totals.low_stock ?? 0} note="At or below 5 units" tone="red" />
      </div>
      <div className="dashboard-grid">
        <section className="section-block">
          <div className="section-heading"><div><span className="eyebrow">SCHEDULE</span><h2>Upcoming approved events</h2></div><Link to="/reservations?status=approved">View calendar list</Link></div>
          <DataTable rows={events} columns={[
            { key: 'event_date', label: 'Date', render: (row) => formatDate(row.event_date) },
            { key: 'event', label: 'Event', render: (row) => <><strong>{row.purpose}</strong><small className="table-subline">{row.user?.name}</small></> },
            { key: 'facility', label: 'Facility', render: (row) => row.facility?.name },
            { key: 'time', label: 'Time', render: (row) => `${row.start_time}-${row.end_time}` },
          ]} empty="No approved upcoming events." />
        </section>
        <aside className="side-stack">
          <section className="section-block stock-panel"><div className="section-heading"><div><span className="eyebrow">INVENTORY</span><h2>Low stock</h2></div><Link to="/equipment">All items</Link></div>
            {lowStock.length ? lowStock.slice(0, 5).map((item) => <div className="stock-row" key={item.id}><span>{item.name}<small>{item.category?.name}</small></span><strong>{item.total_quantity}</strong></div>) : <EmptyState title="Stock levels are healthy" />}
          </section>
          <section className="most-used"><span className="eyebrow">MOST RESERVED</span><h2>{dashboard?.most_reserved_facility?.name ?? 'No facility data yet'}</h2><p>{dashboard?.most_reserved_facility?.reservations_count ?? 0} approved or completed reservations</p></section>
        </aside>
      </div>
    </div>
  )
}
