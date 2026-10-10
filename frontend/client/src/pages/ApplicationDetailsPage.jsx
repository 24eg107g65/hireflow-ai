import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, CalendarDays, Check, ExternalLink, FileText, ListChecks, MessageSquare, Pencil, Plus, Sparkles, Trash2, UploadCloud } from 'lucide-react'
import { applicationService } from '../services/applicationService'
import { assistantService } from '../services/assistantService'
import { getApiError } from '../services/apiClient'
import { useToast } from '../hooks/useToast'
import { ApplicationForm } from '../components/ApplicationForm'
import { ConfirmDialog, ErrorMessage, InlineNotice, LoadingSkeleton, Modal, PageHeader, StatusBadge } from '../components/ui'

const tabs = [{ id: 'overview', label: 'Overview', icon: FileText }, { id: 'notes', label: 'Notes', icon: MessageSquare }, { id: 'tasks', label: 'Tasks', icon: ListChecks }, { id: 'documents', label: 'Documents', icon: UploadCloud }, { id: 'insights', label: 'AI insights', icon: Sparkles }]

export function ApplicationDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadedId, setLoadedId] = useState(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [tab, setTab] = useState('overview')
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [note, setNote] = useState(null)
  const [tasks, setTasks] = useState([])
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDate, setTaskDate] = useState('')
  const [taskPriority, setTaskPriority] = useState('NORMAL')
  const [files, setFiles] = useState([])
  const [aiBusy, setAiBusy] = useState('')
  const [aiResult, setAiResult] = useState('')
  useEffect(() => {
    let active = true
    applicationService.get(id)
      .then((data) => { if (active) { setApplication(data); setError('') } })
      .catch((err) => { if (active) setError(getApiError(err, 'This application could not be loaded.')) })
      .finally(() => { if (active) { setLoading(false); setLoadedId(id) } })
    return () => { active = false }
  }, [id, reload])
  function retry() { setLoading(true); setError(''); setReload((current) => current + 1) }
  async function save(payload) {
    try { const result = await applicationService.update(id, payload); setApplication(result); setEditOpen(false); toast('Application updated.', 'success') }
    catch (err) { toast(getApiError(err, 'Your changes could not be saved.'), 'error'); throw err }
  }
  async function remove() {
    setDeleteBusy(true)
    try { await applicationService.remove(id); toast('Application deleted.', 'success'); navigate('/applications') }
    catch (err) { toast(getApiError(err, 'This application could not be deleted.'), 'error') }
    finally { setDeleteBusy(false) }
  }
  async function saveNotes() {
    try { const updated = await applicationService.update(id, { ...application, notes: note ?? application.notes ?? '' }); setApplication(updated); setNote(note ?? application.notes ?? ''); toast('Notes saved.', 'success') }
    catch (err) { toast(getApiError(err, 'Notes could not be saved.'), 'error') }
  }
  async function runInsight(action, label) {
    setAiBusy(action); setAiResult('')
    try { const result = await assistantService.insight(action, { applicationId: id }); setAiResult(result?.answer || result?.result || result?.message || JSON.stringify(result)) }
    catch (err) { setAiResult(`AI service not connected. ${getApiError(err, 'This feature will be available when an AI service is configured.')}`) }
    finally { setAiBusy('') }
    toast(`${label} request finished. Check the result below.`, 'info')
  }
  function addTask(event) {
    event.preventDefault()
    if (!taskTitle.trim()) return
    setTasks((current) => [...current, { id: Date.now(), title: taskTitle.trim(), date: taskDate, priority: taskPriority, completed: false }])
    setTaskTitle(''); setTaskDate('')
    toast('Task added for this session. It is not synced to your account.', 'info')
  }
  function addFile(event) {
    const selected = Array.from(event.target.files || [])
    setFiles((current) => [...current, ...selected.map((file) => ({ id: `${file.name}-${file.lastModified}`, name: file.name, size: file.size }))])
    if (selected.length) toast('File added to this session only. Document storage is not connected yet.', 'info')
    event.target.value = ''
  }
  if (loading || loadedId !== id) return <><PageHeader eyebrow="APPLICATION" title="Loading application" /><LoadingSkeleton rows={6} /></>
  if (error || !application) return <><PageHeader eyebrow="APPLICATION" title="Application details" /><ErrorMessage message={error || 'Application not found.'} onRetry={retry} /><Link to="/applications" className="button button-secondary"><ArrowLeft size={16} /> Back to applications</Link></>
  return <><Link to="/applications" className="back-link"><ArrowLeft size={15} /> All applications</Link><PageHeader eyebrow="APPLICATION DETAILS" title={application.companyName} description={application.jobRole} action={<div className="header-actions">{application.applicationLink && <a className="button button-secondary" href={application.applicationLink} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open role</a>}<button className="button button-secondary" onClick={() => setEditOpen(true)}><Pencil size={16} /> Edit</button><button className="button button-danger-quiet" onClick={() => setDeleteOpen(true)} aria-label="Delete application"><Trash2 size={16} /></button></div>} /><div className="application-summary-strip"><StatusBadge status={application.status} /><span><CalendarDays size={15} /> Deadline {application.deadline ? format(parseISO(application.deadline.slice(0, 10)), 'MMM d, yyyy') : 'not set'}</span><span>Updated {application.updatedAt ? format(parseISO(application.updatedAt), 'MMM d, yyyy') : 'recently'}</span></div><div className="detail-tabs" role="tablist" aria-label="Application sections">{tabs.map(({ id: tabId, label, icon: Icon }) => <button key={tabId} className={tab === tabId ? 'detail-tab tab-active' : 'detail-tab'} role="tab" aria-selected={tab === tabId} onClick={() => setTab(tabId)}><Icon size={16} />{label}</button>)}</div>
    {tab === 'overview' && <section className="panel detail-content"><div className="detail-section"><p className="eyebrow">ROLE OVERVIEW</p><div className="detail-definition"><div><span>Company</span><strong>{application.companyName}</strong></div><div><span>Role</span><strong>{application.jobRole}</strong></div><div><span>Status</span><StatusBadge status={application.status} /></div><div><span>Application deadline</span><strong>{application.deadline ? format(parseISO(application.deadline.slice(0, 10)), 'MMMM d, yyyy') : 'Not set'}</strong></div><div><span>Application link</span>{application.applicationLink ? <a href={application.applicationLink} target="_blank" rel="noreferrer">Open application <ExternalLink size={14} /></a> : <strong className="detail-muted">Not provided</strong>}</div></div></div><div className="detail-section"><p className="eyebrow">JOB DESCRIPTION</p><p className="long-copy">{application.jobDescription || <span className="detail-muted">No job description has been added yet.</span>}</p></div></section>}
    {tab === 'notes' && <section className="panel detail-content"><div className="panel-header"><div><h2>Application notes</h2><p>Keep your research and reminders close to the role.</p></div></div><label className="form-field"><span>Notes</span><textarea rows="10" value={note ?? application.notes ?? ''} onChange={(event) => setNote(event.target.value)} placeholder="Recruiter conversations, role details, or questions for the interview…" /></label><div className="detail-save-row"><span>Notes are saved to this application.</span><button className="button button-primary" onClick={saveNotes}><Check size={16} /> Save notes</button></div></section>}
    {tab === 'tasks' && <section className="panel detail-content"><div className="panel-header"><div><h2>Follow-up tasks</h2><p>Small next steps, kept in this browser session.</p></div></div><InlineNotice>Tasks are not part of the connected backend contract yet. These entries are temporary and will clear when you leave this page.</InlineNotice><form className="task-add-form" onSubmit={addTask}><label className="form-field"><span>Task title</span><input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="e.g. Send a thank-you note" /></label><label className="form-field"><span>Due date</span><input type="date" value={taskDate} onChange={(event) => setTaskDate(event.target.value)} /></label><label className="form-field"><span>Priority</span><select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value)}><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="LOW">Low</option></select></label><button className="button button-primary task-add-button"><Plus size={16} /> Add task</button></form>{tasks.length ? <div className="task-list">{tasks.map((task) => <div className="task-row" key={task.id}><input aria-label={`Mark ${task.title} complete`} type="checkbox" checked={task.completed} onChange={() => setTasks((current) => current.map((entry) => entry.id === task.id ? { ...entry, completed: !entry.completed } : entry))} /><span className={task.completed ? 'task-complete' : ''}>{task.title}</span><span>{task.date || 'No due date'}</span><span className={`priority priority-${task.priority.toLowerCase()}`}>{task.priority}</span><button className="icon-button action-delete" aria-label={`Delete ${task.title}`} onClick={() => setTasks((current) => current.filter((entry) => entry.id !== task.id))}><Trash2 size={15} /></button></div>)}</div> : <p className="section-empty">No tasks yet. Add a small next step above.</p>}</section>}
    {tab === 'documents' && <section className="panel detail-content"><div className="panel-header"><div><h2>Documents</h2><p>Resume and supporting files for this opportunity.</p></div></div><InlineNotice>File storage is not connected. Files added here stay in this page only and are not uploaded to your account.</InlineNotice><label className="upload-dropzone"><input type="file" accept=".pdf,.doc,.docx" multiple onChange={addFile} /><span className="upload-icon"><UploadCloud size={23} /></span><strong>Choose resume or document</strong><span>PDF or DOCX · stored locally for this session</span></label>{files.length > 0 && <div className="document-list">{files.map((file) => <div className="document-card" key={file.id}><span className="document-icon"><FileText size={19} /></span><span><strong>{file.name}</strong><small>{(file.size / 1024).toFixed(0)} KB · Temporary session file</small></span><button className="icon-button action-delete" aria-label={`Remove ${file.name}`} onClick={() => setFiles((current) => current.filter((entry) => entry.id !== file.id))}><Trash2 size={15} /></button></div>)}</div>}<div className="document-preview"><FileText size={20} /><span><strong>Resume used for this application</strong><small>No resume association is available from the connected API.</small></span></div></section>}
    {tab === 'insights' && <section className="panel detail-content"><div className="panel-header"><div><h2>AI preparation</h2><p>Get a head start on understanding this role.</p></div><span className="ai-pilot-label"><Sparkles size={14} /> AI tools</span></div><InlineNotice>AI results are generated only when an AI service is connected. Review any generated content before using it.</InlineNotice><div className="insight-grid">{[['summarize', 'Summarize job description', 'A concise view of the role’s focus.'], ['skills', 'Extract required skills', 'Spot the skills emphasized in the listing.'], ['compare-resume', 'Compare resume to requirements', 'Explore potential strengths and gaps.'], ['interview-questions', 'Generate interview questions', 'Practice role-specific questions.'], ['follow-up-email', 'Draft follow-up email', 'Start a thoughtful follow-up draft.']].map(([action, label, description]) => <button className="insight-action" key={action} onClick={() => runInsight(action, label)} disabled={Boolean(aiBusy)}><span className="insight-icon"><Sparkles size={17} /></span><span><strong>{label}</strong><small>{description}</small></span><span className="insight-run">{aiBusy === action ? 'Working…' : 'Run'}</span></button>)}</div>{aiResult && <div className="ai-result"><p className="eyebrow">RESULT</p><p>{aiResult}</p></div>}</section>}
    <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit application" size="wide"><ApplicationForm initialValue={application} onSubmit={save} onCancel={() => setEditOpen(false)} /></Modal><ConfirmDialog open={deleteOpen} title="Delete this application?" description={`${application.companyName} will be permanently removed from your tracker.`} confirmLabel="Delete application" danger busy={deleteBusy} onCancel={() => setDeleteOpen(false)} onConfirm={remove} />
  </>
}