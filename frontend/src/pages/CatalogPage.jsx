import { useEffect, useMemo, useState } from 'react'
import { useDebounce } from '../hooks/useDebounce'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Alert, Button, ConfirmDialog, DataTable, FormInput, FormSelect, Modal, Pagination, Spinner, notify } from '../components/ui'

const catalogConfig = {
  facilities: {
    title: 'Facilities', eyebrow: 'SPACES AND VENUES', description: 'Spaces available for barangay events and resident bookings.', endpoint: '/facilities',
    blank: { name: '', description: '', capacity: '', fee: '0', is_active: true },
    columns: [
      { key: 'name', label: 'Facility', render: (row) => <><strong>{row.name}</strong><small className="table-subline">{row.description}</small></> },
      { key: 'capacity', label: 'Capacity', render: (row) => `${row.capacity} people` },
      { key: 'fee', label: 'Fee', render: (row) => Number(row.fee) ? `PHP ${Number(row.fee).toLocaleString('en-PH')}` : 'No fee' },
      { key: 'is_active', label: 'Availability', render: (row) => row.is_active ? 'Available' : 'Inactive' },
      { key: 'reservations_count', label: 'Bookings' },
    ],
  },
  equipment: {
    title: 'Equipment', eyebrow: 'SHARED INVENTORY', description: 'Track quantities and condition of community equipment.', endpoint: '/equipment',
    blank: { name: '', category_id: '', total_quantity: '', condition: 'good' },
    columns: [
      { key: 'name', label: 'Item', render: (row) => <><strong>{row.name}</strong>{row.is_low_stock && <small className="stock-warning">Low stock</small>}</> },
      { key: 'category', label: 'Category', render: (row) => row.category?.name },
      { key: 'total_quantity', label: 'Quantity' },
      { key: 'condition', label: 'Condition', render: (row) => row.condition.replace('_', ' ') },
    ],
  },
  categories: {
    title: 'Categories', eyebrow: 'INVENTORY GROUPS', description: 'Organize equipment into useful inventory groups.', endpoint: '/equipment-categories',
    blank: { name: '' },
    columns: [{ key: 'name', label: 'Category' }, { key: 'equipment_count', label: 'Items' }],
  },
}

export default function CatalogPage({ type }) {
  const config = catalogConfig[type]
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ data: [], meta: null })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [values, setValues] = useState(config.blank)
  const [editing, setEditing] = useState(null)
  const [errors, setErrors] = useState({})
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = () => api.get(config.endpoint, { params: { search: debouncedSearch, page } }).then(({ data }) => setResult(data))
  useEffect(() => {
    let active = true
    setLoading(true)
    api.get(config.endpoint, { params: { search: debouncedSearch, page } }).then(({ data }) => { if (active) setResult(data) })
      .catch(() => { if (active) setError(`${config.title} could not be loaded.`) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [config.endpoint, config.title, debouncedSearch, page])
  useEffect(() => { if (type === 'equipment') api.get('/equipment-categories/options').then(({ data }) => setCategories(data.data ?? data)).catch(() => {}) }, [type])

  const columns = useMemo(() => [
    ...config.columns,
    ...(isAdmin ? [{ key: 'actions', label: '', render: (row) => <div className="table-actions"><button className="text-action" onClick={() => openEdit(row)}>Edit</button><button className="text-action danger-text" onClick={() => setConfirm(row)}>Delete</button></div> }] : []),
  ], [config.columns, isAdmin])

  const openNew = () => { setEditing(null); setValues({ ...config.blank }); setErrors({}); setFormOpen(true) }
  const openEdit = (row) => {
    setEditing(row)
    setValues({ ...config.blank, ...row, category_id: String(row.category_id ?? row.category?.id ?? ''), is_active: Boolean(row.is_active) })
    setErrors({}); setFormOpen(true)
  }
  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }))
  const save = async (event) => {
    event.preventDefault()
    const next = {}
    if (!values.name?.trim()) next.name = ['Name is required.']
    if (type === 'facilities' && (!Number(values.capacity) || Number(values.capacity) < 1)) next.capacity = ['Enter a valid capacity.']
    if (type === 'equipment' && !values.category_id) next.category_id = ['Choose a category.']
    if (type === 'equipment' && (!Number.isInteger(Number(values.total_quantity)) || Number(values.total_quantity) < 0)) next.total_quantity = ['Enter a valid quantity.']
    if (Object.keys(next).length) return setErrors(next)
    const payload = { ...values }
    if (type === 'facilities') { payload.capacity = Number(values.capacity); payload.fee = Number(values.fee); payload.is_active = Boolean(values.is_active) }
    if (type === 'equipment') { payload.category_id = Number(values.category_id); payload.total_quantity = Number(values.total_quantity) }
    setBusy(true); setErrors({}); setError('')
    try {
      if (editing) await api.put(`${config.endpoint}/${editing.id}`, payload)
      else await api.post(config.endpoint, payload)
      await load(); setFormOpen(false); notify(`${config.title.slice(0, -1)} ${editing ? 'updated' : 'added'}.`)
    } catch (requestError) { setErrors(requestError.response?.data?.errors ?? { form: [requestError.response?.data?.message ?? 'Unable to save this record.'] }) }
    finally { setBusy(false) }
  }
  const remove = async () => {
    setBusy(true)
    try { await api.delete(`${config.endpoint}/${confirm.id}`); await load(); notify('Record deleted.'); setConfirm(null) }
    catch (requestError) { setError(requestError.response?.data?.errors?.facility?.[0] ?? requestError.response?.data?.errors?.equipment?.[0] ?? requestError.response?.data?.errors?.category?.[0] ?? requestError.response?.data?.message ?? 'Unable to delete this record.'); setConfirm(null) }
    finally { setBusy(false) }
  }

  return (
    <div className="page-enter">
      <div className="page-heading"><div><span className="eyebrow">{config.eyebrow}</span><h1>{config.title}</h1><p>{config.description}</p></div>{isAdmin && <Button onClick={openNew}>Add {type === 'categories' ? 'category' : type === 'equipment' ? 'equipment' : 'facility'}</Button>}</div>
      <section className="catalog-toolbar"><FormInput id={`${type}-search`} label="Search" placeholder={`Search ${config.title.toLowerCase()}`} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /><span className="result-count">{result.meta?.total ?? 0} records</span></section>
      {error && <Alert tone="error">{error}</Alert>}
      {loading ? <Spinner label={`Loading ${config.title.toLowerCase()}`} /> : <><DataTable rows={result.data ?? []} columns={columns} empty={`No ${config.title.toLowerCase()} found.`} /><Pagination meta={result.meta} onPage={setPage} /></>}
      {formOpen && <Modal title={`${editing ? 'Edit' : 'Add'} ${type === 'categories' ? 'category' : type === 'equipment' ? 'equipment' : 'facility'}`} onClose={() => setFormOpen(false)}>
        {errors.form && <Alert tone="error">{errors.form[0]}</Alert>}
        <form className="form-stack" onSubmit={save} noValidate>
          <FormInput id="name" label="Name" value={values.name ?? ''} onChange={set('name')} error={errors.name?.[0]} />
          {type === 'facilities' && <><label className="field" htmlFor="description"><span>Description</span><textarea id="description" rows="3" value={values.description ?? ''} onChange={set('description')} /></label><div className="form-grid"><FormInput id="capacity" label="Capacity" type="number" min="1" value={values.capacity ?? ''} onChange={set('capacity')} error={errors.capacity?.[0]} /><FormInput id="fee" label="Fee (PHP)" type="number" min="0" step="0.01" value={values.fee ?? '0'} onChange={set('fee')} error={errors.fee?.[0]} /></div><label className="check-line"><input type="checkbox" checked={Boolean(values.is_active)} onChange={set('is_active')} /> Available for bookings</label></>}
          {type === 'equipment' && <><FormSelect id="category_id" label="Category" value={values.category_id ?? ''} onChange={set('category_id')} error={errors.category_id?.[0]}><option value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</FormSelect><div className="form-grid"><FormInput id="total_quantity" label="Total quantity" type="number" min="0" value={values.total_quantity ?? ''} onChange={set('total_quantity')} error={errors.total_quantity?.[0]} /><FormSelect id="condition" label="Condition" value={values.condition ?? 'good'} onChange={set('condition')}><option value="good">Good</option><option value="fair">Fair</option><option value="needs_repair">Needs repair</option></FormSelect></div></>}
          <div className="dialog-actions"><Button type="button" variant="quiet" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" disabled={busy}>{busy ? 'Saving...' : editing ? 'Save changes' : 'Add record'}</Button></div>
        </form>
      </Modal>}
      {confirm && <ConfirmDialog title="Delete this record?" message="Records in use cannot be deleted. This action cannot be undone." confirmLabel="Delete" danger onCancel={() => setConfirm(null)} onConfirm={remove} busy={busy} />}
    </div>
  )
}
