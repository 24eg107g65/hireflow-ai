import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Sparkles } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import { getApiError } from '../services/apiClient'

function AuthFrame({ children, variant = 'login' }) {
  return <div className="auth-page"><section className="auth-story"><Link to="/login" className="auth-brand"><span className="brand-mark">p</span> pathway<span className="brand-dot">.</span></Link><div className="auth-story-content"><p className="eyebrow light-eyebrow">YOUR CAREER, IN MOTION</p><h1>Make your next move<br /><em>count.</em></h1><p>One calm place to keep every application, deadline, and opportunity moving forward.</p><div className="auth-story-note"><div className="story-spark"><Sparkles size={17} /></div><div><strong>A little more clarity.</strong><span>Your internship search, organized around you.</span></div></div></div><span className="auth-story-footer">A clearer path to what’s next.</span><div className="auth-decoration deco-one" /><div className="auth-decoration deco-two" /></section><section className="auth-panel"><div className="auth-panel-mobile-brand"><Link to="/login" className="auth-brand"><span className="brand-mark">p</span> pathway<span className="brand-dot">.</span></Link></div><div className={`auth-form-wrap ${variant === 'register' ? 'register-wrap' : ''}`}>{children}</div><span className="auth-legal">By continuing, you agree to use Pathway responsibly.</span></section></div>
}

export function LoginPage() {
  const { login } = useAuth()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(localStorage.getItem('hireflow_remember') !== 'false')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: { email: '', password: '' } })
  async function submit(values) {
    setBusy(true)
    setError('')
    try { await login(values, remember) } catch (err) { setError(getApiError(err, 'Unable to sign in. Check your details and try again.')) } finally { setBusy(false) }
  }
  return <AuthFrame><Link to="/login" className="auth-back"><ArrowLeft size={15} /> Back to home</Link><p className="eyebrow">WELCOME BACK</p><h2>Good to see you.</h2><p className="auth-intro">Sign in to pick up where you left off.</p>{location.state?.registered && <div className="auth-success">Account created. Sign in to continue.</div>}{error && <div className="form-error-banner" role="alert">{error}</div>}<form className="auth-form" onSubmit={handleSubmit(submit)} noValidate><label className="form-label" htmlFor="email">Email address</label><input id="email" className={`form-input ${errors.email ? 'input-invalid' : ''}`} type="email" autoComplete="email" placeholder="you@university.edu" {...register('email', { required: 'Enter your email address.', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address.' } })} />{errors.email && <span className="field-error">{errors.email.message}</span>}<div className="label-row"><label className="form-label" htmlFor="password">Password</label><a className="small-link" href="#password" onClick={(event) => { event.preventDefault(); setError('Password reset is not configured yet. Contact your administrator.') }}>Forgot password?</a></div><div className="password-wrap"><input id="password" className={`form-input ${errors.password ? 'input-invalid' : ''}`} type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" {...register('password', { required: 'Enter your password.' })} /><button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{errors.password && <span className="field-error">{errors.password.message}</span>}<label className="check-label"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span className="custom-check" /><span>Remember me</span></label><button className="button button-primary auth-submit" disabled={busy}>{busy ? <span className="loader-dot loader-white" /> : <>Sign in <ArrowRight size={16} /></>}</button></form><p className="auth-switch">New to Pathway? <Link to="/register">Create an account</Link></p><div className="auth-security"><LockKeyhole size={14} /> Your account details are encrypted and secure.</div></AuthFrame>
}

function passwordScore(password = '') {
  return [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length
}

export function RegisterPage() {
  const { register: registerUser } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()
  async function submit(values) {
    setBusy(true)
    setError('')
    try { await registerUser({ fullName: values.fullName, email: values.email, password: values.password }) } catch (err) { setError(getApiError(err, 'We could not create your account. Please try again.')) } finally { setBusy(false) }
  }
  const score = passwordScore(password)
  const strength = ['Add a few more characters', 'Getting started', 'Fair', 'Good', 'Strong'][score]
  return <AuthFrame variant="register"><Link to="/login" className="auth-back"><ArrowLeft size={15} /> Sign in instead</Link><p className="eyebrow">START YOUR SEARCH</p><h2>Create your account.</h2><p className="auth-intro">Your next opportunity starts with a little organization.</p>{error && <div className="form-error-banner" role="alert">{error}</div>}<form className="auth-form register-form" onSubmit={handleSubmit(submit)} noValidate><label className="form-label" htmlFor="fullName">Full name</label><input id="fullName" className="form-input" placeholder="Jordan Lee" autoComplete="name" {...register('fullName', { required: 'Enter your name.', minLength: { value: 2, message: 'Name must be at least 2 characters.' } })} />{errors.fullName && <span className="field-error">{errors.fullName.message}</span>}<label className="form-label" htmlFor="regEmail">Email address</label><input id="regEmail" className="form-input" type="email" placeholder="you@university.edu" autoComplete="email" {...register('email', { required: 'Enter your email address.', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address.' } })} />{errors.email && <span className="field-error">{errors.email.message}</span>}<label className="form-label" htmlFor="regPassword">Password</label><div className="password-wrap"><input id="regPassword" className="form-input" type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" autoComplete="new-password" {...register('password', { required: 'Create a password.', minLength: { value: 8, message: 'Use at least 8 characters.' }, onChange: (event) => setPassword(event.target.value) })} /><button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{errors.password && <span className="field-error">{errors.password.message}</span>}<div className="strength-meter" aria-live="polite"><div className="strength-bars">{[1, 2, 3, 4].map((bar) => <span className={bar <= score ? `strength-active strength-${score}` : ''} key={bar} />)}</div><span>{strength}</span></div><label className="form-label" htmlFor="confirmPassword">Confirm password</label><input id="confirmPassword" className="form-input" type="password" autoComplete="new-password" placeholder="Enter your password again" {...register('confirmPassword', { required: 'Confirm your password.', validate: (value) => value === password || 'Passwords do not match.' })} />{errors.confirmPassword && <span className="field-error">{errors.confirmPassword.message}</span>}<button className="button button-primary auth-submit" disabled={busy}>{busy ? <span className="loader-dot loader-white" /> : <>Create account <ArrowRight size={16} /></>}</button></form><p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p></AuthFrame>
}