import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, FormInput } from '../components/ui'

function apiErrors(error) {
  return error.response?.data?.errors ?? { form: [error.response?.data?.message ?? 'Unable to reach the service.'] }
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }))
  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = ['Enter a valid email address.']
    if (!values.password) nextErrors.password = ['Password is required.']
    if (Object.keys(nextErrors).length) return setErrors(nextErrors)
    setBusy(true)
    setErrors({})
    try { await login(values); navigate('/dashboard', { replace: true }) }
    catch (error) { setErrors(apiErrors(error)) }
    finally { setBusy(false) }
  }
  return (
    <main className="auth-screen">
      <section className="auth-aside"><span className="eyebrow">BARANGAY SERVICES</span><h1>BarangayBook</h1><p>A clearer way to request shared spaces and community equipment.</p><div className="aside-rule" /><span>One schedule. Every resident. Better organized.</span></section>
      <section className="auth-panel">
        <div className="auth-brand"><span className="brand-mark">B</span><span>BarangayBook</span></div>
        <div className="auth-heading"><span className="eyebrow">WELCOME BACK</span><h2>Sign in to your account</h2><p>Use your registered email and password.</p></div>
        {errors.form && <p className="field-error form-error">{errors.form[0]}</p>}
        <form className="form-stack" onSubmit={submit} noValidate>
          <FormInput id="email" label="Email address" type="email" autoComplete="email" value={values.email} onChange={set('email')} error={errors.email?.[0]} />
          <FormInput id="password" label="Password" type="password" autoComplete="current-password" value={values.password} onChange={set('password')} error={errors.password?.[0]} />
          <Button type="submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</Button>
        </form>
        <p className="auth-foot">New to BarangayBook? <Link to="/register">Create a resident account</Link></p>
      </section>
    </main>
  )
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [values, setValues] = useState({ name: '', email: '', phone: '', purok: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }))
  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (values.name.trim().length < 2) nextErrors.name = ['Enter your full name.']
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = ['Enter a valid email address.']
    if (values.password.length < 8) nextErrors.password = ['Use at least 8 characters.']
    if (values.password !== values.password_confirmation) nextErrors.password_confirmation = ['Passwords do not match.']
    if (Object.keys(nextErrors).length) return setErrors(nextErrors)
    setBusy(true)
    setErrors({})
    try { await register(values); navigate('/dashboard', { replace: true }) }
    catch (error) { setErrors(apiErrors(error)) }
    finally { setBusy(false) }
  }
  return (
    <main className="auth-screen">
      <section className="auth-aside"><span className="eyebrow">A SERVICE FOR EVERY PUROK</span><h1>Plan together.</h1><p>Submit a request, follow its review, and see what the barangay has available.</p><div className="aside-rule" /><span>Residents can track each request from one place.</span></section>
      <section className="auth-panel">
        <div className="auth-brand"><span className="brand-mark">B</span><span>BarangayBook</span></div>
        <div className="auth-heading"><span className="eyebrow">RESIDENT ACCESS</span><h2>Create your account</h2><p>Your account is created with resident access.</p></div>
        {errors.form && <p className="field-error form-error">{errors.form[0]}</p>}
        <form className="form-stack auth-register" onSubmit={submit} noValidate>
          <FormInput id="name" label="Full name" value={values.name} onChange={set('name')} error={errors.name?.[0]} />
          <FormInput id="email" label="Email address" type="email" value={values.email} onChange={set('email')} error={errors.email?.[0]} />
          <div className="form-grid"><FormInput id="phone" label="Phone (optional)" value={values.phone} onChange={set('phone')} error={errors.phone?.[0]} /><FormInput id="purok" label="Purok (optional)" value={values.purok} onChange={set('purok')} error={errors.purok?.[0]} /></div>
          <FormInput id="password" label="Password" type="password" value={values.password} onChange={set('password')} error={errors.password?.[0]} />
          <FormInput id="password_confirmation" label="Confirm password" type="password" value={values.password_confirmation} onChange={set('password_confirmation')} error={errors.password_confirmation?.[0]} />
          <Button type="submit" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</Button>
        </form>
        <p className="auth-foot">Already registered? <Link to="/login">Sign in</Link></p>
      </section>
    </main>
  )
}
