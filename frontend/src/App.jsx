import { useState } from 'react'
import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Spinner, ToastRegion } from './components/ui'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import CatalogPage from './pages/CatalogPage'
import DashboardPage from './pages/DashboardPage'
import { ReservationDetailPage, ReservationFormPage, ReservationsPage } from './pages/ReservationsPage'
import './styles.css'

function ProtectedRoute({ children }) {
  const { user, ready } = useAuth()
  const location = useLocation()
  if (!ready) return <Spinner label="Restoring your session" />
  return user ? children : <Navigate to="/login" replace state={{ from: location }} />
}

function AdminRoute({ children }) {
  const { user, ready } = useAuth()
  if (!ready) return <Spinner label="Checking access" />
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />
}

function Navbar() {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)
  const signOut = async () => { await logout(); closeMenu() }
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand-lockup" to="/dashboard" onClick={closeMenu}><span className="brand-mark">B</span><span>BarangayBook<small>Community reservations</small></span></Link>
        <button className="menu-toggle" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? 'x' : 'Menu'}</button>
        <nav className={`main-nav ${menuOpen ? 'nav-open' : ''}`}>
          <NavLink to="/dashboard" onClick={closeMenu}>Overview</NavLink>
          <NavLink to="/reservations" onClick={closeMenu}>Reservations</NavLink>
          <NavLink to="/facilities" onClick={closeMenu}>Facilities</NavLink>
          <NavLink to="/equipment" onClick={closeMenu}>Equipment</NavLink>
          <NavLink to="/categories" onClick={closeMenu}>Categories</NavLink>
          {user?.role === 'admin' && <NavLink to="/admin/tools" onClick={closeMenu}>Admin tools</NavLink>}
          <div className="mobile-account"><span>{user?.name}</span><button onClick={signOut}>Sign out</button></div>
        </nav>
        <div className="account-menu"><span className="account-avatar">{user?.name?.slice(0, 1)}</span><span className="account-name">{user?.name}<small>{user?.role === 'admin' ? 'Administrator' : user?.purok ?? 'Resident'}</small></span><button className="signout-button" onClick={signOut}>Sign out</button></div>
      </div>
    </header>
  )
}

function AppLayout() {
  return <><Navbar /><main className="main-shell"><Outlet /></main><footer className="site-footer"><span>BarangayBook</span><span>Barangay facility and equipment reservations</span></footer><ToastRegion /></>
}

function AdminToolsPage() {
  return <div className="page-enter"><div className="page-heading"><div><span className="eyebrow">ADMINISTRATION</span><h1>Admin tools</h1><p>Manage the barangay spaces and shared inventory.</p></div></div><div className="admin-tool-list"><Link to="/facilities"><span>01</span><div><h2>Facilities</h2><p>Update availability, capacity, and booking fees.</p></div><strong>Open</strong></Link><Link to="/equipment"><span>02</span><div><h2>Equipment</h2><p>Update stock levels, categories, and condition.</p></div><strong>Open</strong></Link><Link to="/categories"><span>03</span><div><h2>Categories</h2><p>Keep equipment groups organized.</p></div><strong>Open</strong></Link></div></div>
}

function NotFoundPage() {
  return <main className="not-found"><span className="eyebrow">404 / PAGE NOT FOUND</span><h1>That page is not here.</h1><p>The link may be out of date or the page may have moved.</p><Link className="button button-primary" to="/dashboard">Return to overview</Link></main>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/reservations" element={<ReservationsPage />} />
        <Route path="/reservations/new" element={<ReservationFormPage />} />
        <Route path="/reservations/:id/edit" element={<ReservationFormPage />} />
        <Route path="/reservations/:id" element={<ReservationDetailPage />} />
        <Route path="/facilities" element={<CatalogPage type="facilities" />} />
        <Route path="/equipment" element={<CatalogPage type="equipment" />} />
        <Route path="/categories" element={<CatalogPage type="categories" />} />
        <Route path="/admin/tools" element={<AdminRoute><AdminToolsPage /></AdminRoute>} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return <BrowserRouter><AuthProvider><AppRoutes /></AuthProvider></BrowserRouter>
}
