import { useEffect, useState } from 'react'

export function Button({ children, variant = 'primary', className = '', ...props }) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>
}

export function FormInput({ label, error, id, ...props }) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <input id={id} aria-invalid={Boolean(error)} {...props} />
      {error && <small className="field-error">{error}</small>}
    </label>
  )
}

export function FormSelect({ label, error, id, children, ...props }) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} aria-invalid={Boolean(error)} {...props}>{children}</select>
      {error && <small className="field-error">{error}</small>}
    </label>
  )
}

export function Modal({ title, children, onClose, wide = false }) {
  useEffect(() => {
    const closeOnEscape = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog">x</button></header>
        {children}
      </section>
    </div>
  )
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger = false, onCancel, onConfirm, busy = false }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="confirm-copy">{message}</p>
      <div className="dialog-actions">
        <Button variant="quiet" onClick={onCancel} disabled={busy}>Keep</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>{busy ? 'Working...' : confirmLabel}</Button>
      </div>
    </Modal>
  )
}

export function DataTable({ columns, rows, rowKey = 'id', empty = 'No records found.' }) {
  if (!rows?.length) return <EmptyState title={empty} />
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
        <tbody>{rows.map((row) => (
          <tr key={row[rowKey]}>
            {columns.map((column) => <td key={column.key} data-label={column.label}>{column.render ? column.render(row) : row[column.key]}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}

export function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null
  return (
    <nav className="pagination" aria-label="Pagination">
      <span>{meta.from ?? 0}-{meta.to ?? 0} of {meta.total}</span>
      <div>
        <Button variant="quiet" disabled={!meta.current_page || meta.current_page <= 1} onClick={() => onPage(meta.current_page - 1)}>Previous</Button>
        <span className="page-count">Page {meta.current_page} / {meta.last_page}</span>
        <Button variant="quiet" disabled={meta.current_page >= meta.last_page} onClick={() => onPage(meta.current_page + 1)}>Next</Button>
      </div>
    </nav>
  )
}

const statusLabels = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected', completed: 'Completed', cancelled: 'Cancelled' }
export function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{statusLabels[status] ?? status}</span>
}

export function Spinner({ label = 'Loading' }) {
  return <div className="spinner-row" role="status"><span className="spinner" />{label}</div>
}

export function Alert({ tone = 'info', children, onDismiss }) {
  return <div className={`alert alert-${tone}`} role="status">{children}{onDismiss && <button className="alert-close" onClick={onDismiss} aria-label="Dismiss">x</button>}</div>
}

export function ToastRegion() {
  const [toast, setToast] = useState(null)
  useEffect(() => {
    const show = (event) => {
      setToast(event.detail)
      window.setTimeout(() => setToast(null), 4200)
    }
    window.addEventListener('app-toast', show)
    return () => window.removeEventListener('app-toast', show)
  }, [])
  return toast ? <div className={`toast toast-${toast.tone ?? 'success'}`} role="status">{toast.message}</div> : null
}

export function StatCard({ label, value, note, tone = 'green' }) {
  return <article className={`stat-card stat-${tone}`}><span>{label}</span><strong>{value ?? '-'}</strong>{note && <small>{note}</small>}</article>
}

export function EmptyState({ title, description, action }) {
  return <div className="empty-state"><span className="empty-mark">-</span><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>
}

export function notify(message, tone = 'success') {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, tone } }))
}
