import { useEffect, useMemo, useState } from 'react'
import { format, isBefore, isToday, parseISO, startOfDay } from 'date-fns'
import { ArrowUp, Bot, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, FileText, MessageCircle, Send, Settings2, Sparkles, Trash2, UploadCloud, UserRound } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { applicationService } from '../services/applicationService'
import { assistantService } from '../services/assistantService'
import { getApiError } from '../services/apiClient'
import { ConfirmDialog, EmptyState, ErrorMessage, InlineNotice, LoadingSkeleton, PageHeader } from '../components/ui'

function asList(data) { return Array.isArray(data) ? data : data?.content || data?.applications || data?.items || data?.data?.content || data?.data || [] }

export function CalendarPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [month, setMonth] = useState(new Date())
  const [showDeadlines, setShowDeadlines] = useState(true)
  const [showInterviews, setShowInterviews] = useState(true)
  useEffect(() => {
    let active = true
    applicationService.list({ page: 0, size: 100, sort: 'deadline,asc' })
      .then((data) => { if (active) { setApplications(asList(data)); setError('') } })
      .catch((err) => { if (active) setError(getApiError(err, 'Your calendar could not be loaded.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reload])
  function load() { setLoading(true); setError(''); setReload((current) => current + 1) }
  const events = useMemo(() => applications.filter((app) => showDeadlines && app.deadline).map((app) => ({ id: `deadline-${app.id}`, date: parseISO(app.deadline.slice(0, 10)), type: 'deadline', title: app.companyName, subtitle: `${app.jobRole} · deadline`, status: app.status, appId: app.id })).filter((event) => !isBefore(event.date, startOfDay(new Date())) || isToday(event.date)).concat(showInterviews ? applications.filter((app) => app.status === 'INTERVIEW').map((app) => ({ id: `interview-${app.id}`, type: 'interview', title: app.companyName, subtitle: `${app.jobRole} · interview stage`, appId: app.id })) : []).sort((a, b) => (a.date?.getTime() || Infinity) - (b.date?.getTime() || Infinity)), [applications, showDeadlines, showInterviews])
  const monthEvents = events.filter((event) => event.date && format(event.date, 'yyyy-MM') === format(month, 'yyyy-MM'))
  const overdue = applications.filter((app) => app.deadline && isBefore(parseISO(app.deadline.slice(0, 10)), startOfDay(new Date())) && !['OFFER', 'REJECTED'].includes(app.status))
  return <><PageHeader eyebrow="DATES THAT MATTER" title="Calendar" description="Keep deadlines and interview stages in view." action={<div className="month-switch"><button className="icon-button" aria-label="Previous month" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}><ChevronLeft size={18} /></button><strong>{format(month, 'MMMM yyyy')}</strong><button className="icon-button" aria-label="Next month" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}><ChevronRight size={18} /></button></div>} /><div className="calendar-toolbar"><div className="calendar-filters"><label className="check-label"><input type="checkbox" checked={showDeadlines} onChange={(event) => setShowDeadlines(event.target.checked)} /><span className="custom-check" /><span><i className="calendar-dot dot-deadline" /> Application deadlines</span></label><label className="check-label"><input type="checkbox" checked={showInterviews} onChange={(event) => setShowInterviews(event.target.checked)} /><span className="custom-check" /><span><i className="calendar-dot dot-interview" /> Interview stage</span></label></div><span className="event-count">{monthEvents.length} dated {monthEvents.length === 1 ? 'event' : 'events'}</span></div>{error ? <ErrorMessage message={error} onRetry={load} /> : <div className="calendar-layout"><section className="panel month-panel"><div className="panel-header"><div><h2>{format(month, 'MMMM')} at a glance</h2><p>Application dates from your tracker</p></div><CalendarDays size={19} className="panel-icon-muted" /></div>{loading ? <LoadingSkeleton rows={5} /> : monthEvents.length ? <div className="calendar-event-list">{monthEvents.map((event) => <a className="calendar-event" href={`/applications/${event.appId}`} key={event.id}><div className={`calendar-event-date ${event.type === 'interview' ? 'date-interview' : ''}`}><strong>{format(event.date, 'd')}</strong><span>{format(event.date, 'EEE')}</span></div><div className="calendar-event-copy"><strong>{event.title}</strong><span>{event.subtitle}</span></div><span className={`event-type event-${event.type}`}>{event.type === 'interview' ? 'Interview' : 'Deadline'}</span></a>)}</div> : <EmptyState icon={CalendarDays} title="A little breathing room" description="No application deadlines land in this month. Add dates to your applications to plan ahead." />}</section><aside className="calendar-side"><section className="panel calendar-summary"><div className="panel-header"><div><h2>Needs attention</h2><p>Past due application dates</p></div></div>{loading ? <LoadingSkeleton rows={2} /> : overdue.length ? <div className="overdue-list">{overdue.slice(0, 4).map((app) => <a href={`/applications/${app.id}`} key={app.id}><span><strong>{app.companyName}</strong><small>{app.jobRole}</small></span><span className="overdue-date">{format(parseISO(app.deadline.slice(0, 10)), 'MMM d')}</span></a>)}</div> : <EmptyState icon={CheckCircle2} title="All clear" description="No past-due application deadlines." />}</section><section className="panel calendar-summary"><div className="panel-header"><div><h2>Interview stage</h2><p>Scheduling dates aren’t in the connected API yet</p></div></div><InlineNotice>Interview dates and follow-up task dates will appear here when those details are available.</InlineNotice></section></aside></div>}</>
}

export function ResumePage() {
  const [resumes, setResumes] = useState([])
  const [defaultId, setDefaultId] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const toast = useToast()
  function upload(event) {
    const selected = Array.from(event.target.files || [])
    const accepted = selected.filter((file) => /\.(pdf|docx?)$/i.test(file.name) && file.size <= 10 * 1024 * 1024)
    if (accepted.length !== selected.length) toast('Use PDF or DOCX files smaller than 10 MB.', 'error')
    if (accepted.length) {
      const additions = accepted.map((file) => ({ id: `${file.name}-${file.lastModified}`, name: file.name, size: file.size, uploadedAt: new Date(), file }))
      setResumes((current) => [...current, ...additions])
      if (!defaultId) setDefaultId(additions[0].id)
      toast('Added to this browser session only. Resume storage is not connected yet.', 'info')
    }
    event.target.value = ''
  }
  function removeResume() { setResumes((current) => current.filter((resume) => resume.id !== deleting.id)); if (defaultId === deleting.id) setDefaultId(resumes.find((resume) => resume.id !== deleting.id)?.id || null); setDeleting(null); toast('Resume removed from this session.', 'info') }
  return <><PageHeader eyebrow="YOUR MATERIALS" title="Resume manager" description="Keep your latest resume ready for the roles you’re pursuing." /><InlineNotice>Resume uploads and default selection are temporary in this preview. Resume storage and application-to-resume history are not available from the connected API.</InlineNotice><label className="upload-dropzone resume-upload"><input type="file" accept=".pdf,.doc,.docx" multiple onChange={upload} /><span className="upload-icon"><UploadCloud size={24} /></span><strong>Choose a resume or <u>browse files</u></strong><span>PDF or DOCX · up to 10 MB</span></label><section className="resume-section"><div className="section-heading"><div><h2>Your resumes</h2><p>{resumes.length} {resumes.length === 1 ? 'document' : 'documents'} in this session</p></div></div>{resumes.length ? <div className="resume-grid">{resumes.map((resume) => <article className="resume-card" key={resume.id}><div className="resume-card-top"><span className="resume-file-icon"><FileText size={21} /></span>{defaultId === resume.id && <span className="default-badge"><Check size={12} /> Default</span>}<button className="icon-button action-delete" aria-label={`Delete ${resume.name}`} onClick={() => setDeleting(resume)}><Trash2 size={15} /></button></div><h3 title={resume.name}>{resume.name}</h3><p>{(resume.size / 1024).toFixed(0)} KB · Added {format(resume.uploadedAt, 'MMM d, yyyy')}</p><div className="resume-card-actions"><button className="button button-secondary button-small" onClick={() => setDefaultId(resume.id)} disabled={defaultId === resume.id}>{defaultId === resume.id ? 'Default resume' : 'Set as default'}</button><button className="button button-secondary button-small" onClick={() => toast('Preview is not available until resume storage is connected.', 'info')}>Preview</button></div></article>)}</div> : <div className="panel resume-empty"><EmptyState icon={FileText} title="No resumes added yet" description="Add a resume to keep it close while you apply. Uploaded files are not stored by the server yet." /></div>}</section><section className="panel resume-usage"><div className="resume-usage-icon"><Settings2 size={18} /></div><div><h2>Resume history by application</h2><p>The application API does not currently record which resume was used for each role. That history will be available when the backend supports resume associations.</p></div></section><ConfirmDialog open={Boolean(deleting)} title="Remove this resume?" description={`${deleting?.name} will be removed from this browser session.`} confirmLabel="Remove resume" danger onCancel={() => setDeleting(null)} onConfirm={removeResume} /></>
}

const suggestedPrompts = ['Which deadlines are coming this week?', 'What skills are missing for my Backend Developer applications?', 'Prepare interview questions for my next interview.', 'Draft a follow-up email for my latest interview.']

export function AssistantPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [activeHistory, setActiveHistory] = useState('')
  async function ask(message) {
    const prompt = message.trim()
    if (!prompt || busy) return
    setMessages((current) => [...current, { role: 'user', content: prompt }])
    setInput(''); setBusy(true); setError('')
    try {
      const result = await assistantService.ask(prompt)
      const answer = result?.answer || result?.response || result?.message
      if (!answer) throw new Error('The AI service returned no response.')
      setMessages((current) => [...current, { role: 'assistant', content: answer }])
    } catch (err) { setError(`AI service not connected. ${getApiError(err, 'Your message could not be sent.')}`) }
    finally { setBusy(false) }
  }
  return <><PageHeader eyebrow="THOUGHT PARTNER" title="AI assistant" description="Prepare for the next step with context from your application search." /><div className="assistant-layout"><aside className="panel assistant-history"><div className="assistant-history-heading"><h2>Conversations</h2><button className="icon-button" aria-label="Start new conversation" title="Start new conversation" onClick={() => { assistantService.resetConversation(); setMessages([]); setError(''); setActiveHistory('') }}><MessageCircle size={17} /></button></div><button className={`history-item ${!activeHistory ? 'history-active' : ''}`} onClick={() => { assistantService.resetConversation(); setMessages([]); setError(''); setActiveHistory('') }}><span className="history-icon"><Sparkles size={15} /></span><span><strong>New conversation</strong><small>Ask about your search</small></span></button><p className="history-note">Conversation history is kept only while this page is open.</p></aside><section className="panel assistant-chat"><div className="chat-topline"><span className="ai-avatar"><Bot size={17} /></span><div><strong>Pathway assistant</strong><span><i className="live-dot" /> Ready to help</span></div><span className="ai-pilot-label">Preview</span></div><div className="chat-messages" aria-live="polite">{messages.length === 0 ? <div className="chat-welcome"><div className="chat-welcome-icon"><Sparkles size={22} /></div><h2>What’s on your mind?</h2><p>Ask about your applications, prepare for a conversation, or map out what to do next.</p><div className="suggested-prompts">{suggestedPrompts.map((prompt) => <button key={prompt} onClick={() => ask(prompt)}>{prompt}<ArrowUp size={14} /></button>)}</div></div> : messages.map((message, index) => <div className={`chat-message message-${message.role}`} key={`${index}-${message.role}`}><span className="message-avatar">{message.role === 'user' ? 'You' : <Sparkles size={14} />}</span><p>{message.content}</p></div>)}{busy && <div className="chat-message message-assistant"><span className="message-avatar"><Sparkles size={14} /></span><div className="typing-dots"><i /><i /><i /></div></div>}{error && <div className="chat-error" role="alert"><strong>Couldn’t get a response</strong><p>{error}</p><span>Messages are not retained when the assistant service is unavailable.</span></div>}</div><form className="chat-composer" onSubmit={(event) => { event.preventDefault(); ask(input) }}><label className="sr-only" htmlFor="assistant-message">Ask the assistant</label><textarea id="assistant-message" rows="1" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about your internship search…" onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); ask(input) } }} /><button className="chat-send" aria-label="Send message" disabled={!input.trim() || busy}><Send size={17} /></button><span className="chat-disclaimer">AI responses may be incomplete. Verify important details.</span></form></section></div></>
}

const defaultProfile = { fullName: '', email: '', careerGoal: '', preferredRoles: '', skills: '', notificationPreference: true }

export function ProfilePage() {
  const { user, updateProfile, logout } = useAuth()
  const toast = useToast()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({ defaultValues: { ...defaultProfile, fullName: user?.fullName || user?.name || '', email: user?.email || '', careerGoal: user?.careerGoal || '', preferredRoles: Array.isArray(user?.preferredRoles) ? user.preferredRoles.join(', ') : user?.preferredRoles || '', skills: Array.isArray(user?.skills) ? user.skills.join(', ') : user?.skills || '', notificationPreference: user?.notificationPreference ?? true } })
  async function submit(values) {
    setLoading(true)
    const payload = { ...values, preferredRoles: values.preferredRoles.split(',').map((item) => item.trim()).filter(Boolean), skills: values.skills.split(',').map((item) => item.trim()).filter(Boolean) }
    try { const result = await updateProfile(payload); reset({ ...values, ...(result?.user || result?.data || result) }); toast('Profile updated.', 'success') }
    catch (err) { toast(getApiError(err, 'Your profile could not be updated.'), 'error') }
    finally { setLoading(false) }
  }
  return <><PageHeader eyebrow="YOUR DETAILS" title="My profile" description="Keep your profile and career preferences up to date." /><form className="profile-form" onSubmit={handleSubmit(submit)}><section className="panel profile-section"><div className="profile-section-heading"><span className="profile-section-icon"><UserRound size={18} /></span><div><h2>Personal information</h2><p>How your information appears in Pathway.</p></div></div><div className="form-grid profile-grid"><label className="form-field"><span>Full name</span><input {...register('fullName', { required: 'Full name is required.' })} placeholder="Your full name" />{errors.fullName && <small className="field-error">{errors.fullName.message}</small>}</label><label className="form-field"><span>Email address</span><input {...register('email', { required: 'Email is required.', pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email.' } })} type="email" placeholder="you@university.edu" />{errors.email && <small className="field-error">{errors.email.message}</small>}</label><label className="form-field form-field-wide"><span>Career goal</span><input {...register('careerGoal')} placeholder="e.g. Build accessible tools for the public good" /></label><label className="form-field"><span>Preferred roles</span><input {...register('preferredRoles')} placeholder="Backend engineer, Product design" /><small>Separate roles with commas.</small></label><label className="form-field"><span>Skills</span><input {...register('skills')} placeholder="Java, research, Figma" /><small>Separate skills with commas.</small></label></div></section><section className="panel profile-section"><div className="profile-section-heading"><span className="profile-section-icon profile-notice-icon"><CheckCircle2 size={18} /></span><div><h2>Notifications</h2><p>Stay in the loop about dates that matter.</p></div></div><label className="toggle-row"><span><strong>Email notifications</strong><small>Receive updates and reminders about your applications.</small></span><input className="toggle-input" type="checkbox" {...register('notificationPreference')} aria-label="Email notifications" /></label></section><div className="profile-submit-row"><button className="button button-primary" disabled={!isDirty || loading}>{loading ? 'Saving…' : <><Check size={16} /> Save profile</>}</button></div></form><section className="panel account-danger-zone"><div><h2>Account access</h2><p>Sign out of this device.</p></div><button className="button button-secondary" onClick={() => setLogoutOpen(true)}>Log out</button></section><ConfirmDialog open={logoutOpen} title="Log out of Pathway?" description="You’ll need to sign in again to access your applications." confirmLabel="Log out" onCancel={() => setLogoutOpen(false)} onConfirm={logout} /></>
}

export function SettingsPage() {
  const { user, updateProfile, logout } = useAuth()
  const toast = useToast()
  const [notifications, setNotifications] = useState(user?.notificationPreference ?? true)
  const [theme, setTheme] = useState(localStorage.getItem('hireflow_theme') || 'light')
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  async function saveNotifications(value) {
    setNotifications(value); setSaving(true)
    try { await updateProfile({ ...user, notificationPreference: value }); toast('Notification preference updated.', 'success') }
    catch (err) { setNotifications(!value); toast(getApiError(err, 'Notification preference could not be updated.'), 'error') }
    finally { setSaving(false) }
  }
  function chooseTheme(value) {
    setTheme(value)
    localStorage.setItem('hireflow_theme', value)
    document.documentElement.dataset.theme = value === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : value
  }
  return <><PageHeader eyebrow="MAKE IT YOURS" title="Settings" description="A few preferences for how Pathway works for you." /><div className="settings-stack"><section className="panel settings-section"><div className="settings-heading"><span className="profile-section-icon"><CheckCircle2 size={18} /></span><div><h2>Notifications</h2><p>Choose what you hear about.</p></div></div><label className="toggle-row"><span><strong>Application reminders</strong><small>Receive deadline and application activity updates.</small></span><input className="toggle-input" type="checkbox" checked={notifications} disabled={saving} onChange={(event) => saveNotifications(event.target.checked)} /></label><InlineNotice>Notification delivery depends on your account notification service.</InlineNotice></section><section className="panel settings-section"><div className="settings-heading"><span className="profile-section-icon"><Settings2 size={18} /></span><div><h2>Appearance</h2><p>Choose a comfortable display preference.</p></div></div><div className="theme-options" role="group" aria-label="Theme preference"><button className={`theme-option ${theme === 'light' ? 'theme-selected' : ''}`} onClick={() => chooseTheme('light')}><span className="theme-preview preview-light" /><span>Light</span>{theme === 'light' && <Check size={15} />}</button><button className={`theme-option ${theme === 'dark' ? 'theme-selected' : ''}`} onClick={() => chooseTheme('dark')}><span className="theme-preview preview-dark" /><span>Dark</span>{theme === 'dark' && <Check size={15} />}</button><button className={`theme-option ${theme === 'system' ? 'theme-selected' : ''}`} onClick={() => chooseTheme('system')}><span className="theme-preview preview-system" /><span>System</span>{theme === 'system' && <Check size={15} />}</button></div><p className="settings-hint">Theme preference is stored on this device.</p></section><section className="panel settings-section"><div className="settings-heading"><span className="profile-section-icon"><UserRound size={18} /></span><div><h2>Account</h2><p>{user?.email || 'Manage your Pathway session.'}</p></div></div><div className="settings-account-row"><span><strong>Sign out</strong><small>End your current session on this device.</small></span><button className="button button-secondary" onClick={() => setLogoutOpen(true)}>Log out</button></div></section></div><ConfirmDialog open={logoutOpen} title="Log out of Pathway?" description="You’ll need to sign in again to access your applications." confirmLabel="Log out" onCancel={() => setLogoutOpen(false)} onConfirm={logout} /></>
}