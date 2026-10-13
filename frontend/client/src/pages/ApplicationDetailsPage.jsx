import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, CalendarDays, Check, Download, ExternalLink, FileText, ListChecks, MessageSquare, Pencil, Plus, Sparkles, Trash2, UploadCloud } from 'lucide-react'
import { applicationService } from '../services/applicationService'
import { assistantService } from '../services/assistantService'
import { taskService } from '../services/taskService'
import { documentService } from '../services/documentService'
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
  const [uploadingFile, setUploadingFile] = useState(false)
  const [aiBusy, setAiBusy] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    let active = true
    applicationService.get(id)
      .then((data) => { if (active) { setApplication(data); setError('') } })
      .catch((err) => { if (active) setError(getApiError(err, 'This application could not be loaded.')) })
      .finally(() => { if (active) { setLoading(false); setLoadedId(id) } })
    return () => { active = false }
  }, [id, reload])

  useEffect(() => {
    if (!id) return
    taskService.list()
      .then((allTasks) => {
        const matching = (Array.isArray(allTasks) ? allTasks : []).filter((t) => String(t.applicationId) === String(id))
        setTasks(matching)
      })
      .catch(() => {})
    documentService.listForApplication(id)
      .then((docs) => setFiles(Array.isArray(docs) ? docs : []))
      .catch(() => {})
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
    setAiBusy(action); setAiResult(null); setAiError('')
    try {
      const result = await assistantService.insight(action, { applicationId: id })
      setAiResult({ action, data: result })
      toast(`${label} completed.`, 'success')
    } catch (err) {
      const msg = getApiError(err, 'This feature will be available when an AI service is configured.')
      setAiError(msg)
      toast(`AI request failed: ${msg}`, 'error')
    } finally {
      setAiBusy('')
    }
  }

  async function addTask(event) {
    event.preventDefault()
    if (!taskTitle.trim()) return
    try {
      const created = await taskService.create({
        title: taskTitle.trim(),
        dueDate: taskDate || null,
        priority: taskPriority,
        applicationId: Number(id),
      })
      setTasks((current) => [...current, created])
      setTaskTitle(''); setTaskDate('')
      toast('Task added.', 'success')
    } catch (err) {
      toast(getApiError(err, 'Could not create task.'), 'error')
    }
  }

  async function toggleTask(task) {
    try {
      const updated = await taskService.update(task.id, {
        title: task.title,
        dueDate: task.dueDate,
        priority: task.priority,
        completed: !task.completed,
        applicationId: Number(id),
      })
      setTasks((current) => current.map((t) => (t.id === task.id ? updated : t)))
    } catch (err) {
      toast(getApiError(err, 'Could not update task.'), 'error')
    }
  }

  async function removeTask(taskId) {
    try {
      await taskService.remove(taskId)
      setTasks((current) => current.filter((t) => t.id !== taskId))
      toast('Task deleted.', 'success')
    } catch (err) {
      toast(getApiError(err, 'Could not delete task.'), 'error')
    }
  }

  async function addFile(event) {
    const selected = Array.from(event.target.files || [])
    event.target.value = ''
    if (!selected.length) return
    setUploadingFile(true)
    try {
      for (const file of selected) {
        const uploaded = await documentService.uploadForApplication(id, file)
        setFiles((current) => [uploaded, ...current])
      }
      toast('Document uploaded.', 'success')
    } catch (err) {
      toast(getApiError(err, 'Document upload failed. Make sure it is PDF or DOCX under 10 MB.'), 'error')
    } finally {
      setUploadingFile(false)
    }
  }

  async function downloadFile(doc) {
    try {
      const blob = await documentService.download(doc.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = doc.originalFilename
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast(getApiError(err, 'Could not download document.'), 'error')
    }
  }

  async function removeFile(docId) {
    try {
      await documentService.remove(docId)
      setFiles((current) => current.filter((d) => d.id !== docId))
      toast('Document removed.', 'success')
    } catch (err) {
      toast(getApiError(err, 'Could not remove document.'), 'error')
    }
  }

  if (loading || loadedId !== id) return <><PageHeader eyebrow="APPLICATION" title="Loading application" /><LoadingSkeleton rows={6} /></>
  if (error || !application) return <><PageHeader eyebrow="APPLICATION" title="Application details" /><ErrorMessage message={error || 'Application not found.'} onRetry={retry} /><Link to="/applications" className="button button-secondary"><ArrowLeft size={16} /> Back to applications</Link></>

  return <>
    <Link to="/applications" className="back-link"><ArrowLeft size={15} /> All applications</Link>
    <PageHeader eyebrow="APPLICATION DETAILS" title={application.companyName} description={application.jobRole} action={<div className="header-actions">{application.applicationLink && <a className="button button-secondary" href={application.applicationLink} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open role</a>}<button className="button button-secondary" onClick={() => setEditOpen(true)}><Pencil size={16} /> Edit</button><button className="button button-danger-quiet" onClick={() => setDeleteOpen(true)} aria-label="Delete application"><Trash2 size={16} /></button></div>} />
    <div className="application-summary-strip"><StatusBadge status={application.status} /><span><CalendarDays size={15} /> Deadline {application.deadline ? format(parseISO(application.deadline.slice(0, 10)), 'MMM d, yyyy') : 'not set'}</span><span>Updated {application.updatedAt ? format(parseISO(application.updatedAt), 'MMM d, yyyy') : 'recently'}</span></div>
    <div className="detail-tabs" role="tablist" aria-label="Application sections">{tabs.map(({ id: tabId, label, icon: Icon }) => <button key={tabId} className={tab === tabId ? 'detail-tab tab-active' : 'detail-tab'} role="tab" aria-selected={tab === tabId} onClick={() => setTab(tabId)}><Icon size={16} />{label}</button>)}</div>

    {tab === 'overview' && <section className="panel detail-content"><div className="detail-section"><p className="eyebrow">ROLE OVERVIEW</p><div className="detail-definition"><div><span>Company</span><strong>{application.companyName}</strong></div><div><span>Role</span><strong>{application.jobRole}</strong></div><div><span>Status</span><StatusBadge status={application.status} /></div><div><span>Application deadline</span><strong>{application.deadline ? format(parseISO(application.deadline.slice(0, 10)), 'MMMM d, yyyy') : 'Not set'}</strong></div><div><span>Application link</span>{application.applicationLink ? <a href={application.applicationLink} target="_blank" rel="noreferrer">Open application <ExternalLink size={14} /></a> : <strong className="detail-muted">Not provided</strong>}</div></div></div><div className="detail-section"><p className="eyebrow">JOB DESCRIPTION</p><p className="long-copy">{application.jobDescription || <span className="detail-muted">No job description has been added yet.</span>}</p></div></section>}

    {tab === 'notes' && <section className="panel detail-content"><div className="panel-header"><div><h2>Application notes</h2><p>Keep your research and reminders close to the role.</p></div></div><label className="form-field"><span>Notes</span><textarea rows="10" value={note ?? application.notes ?? ''} onChange={(event) => setNote(event.target.value)} placeholder="Recruiter conversations, role details, or questions for the interview…" /></label><div className="detail-save-row"><span>Notes are saved to this application.</span><button className="button button-primary" onClick={saveNotes}><Check size={16} /> Save notes</button></div></section>}

    {tab === 'tasks' && <section className="panel detail-content"><div className="panel-header"><div><h2>Follow-up tasks</h2><p>Track your next actions for this application.</p></div></div><form className="task-add-form" onSubmit={addTask}><label className="form-field"><span>Task title</span><input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="e.g. Send a thank-you note" required /></label><label className="form-field"><span>Due date</span><input type="date" value={taskDate} onChange={(event) => setTaskDate(event.target.value)} /></label><label className="form-field"><span>Priority</span><select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value)}><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="LOW">Low</option></select></label><button className="button button-primary task-add-button"><Plus size={16} /> Add task</button></form>{tasks.length ? <div className="task-list">{tasks.map((task) => <div className="task-row" key={task.id}><input aria-label={`Mark ${task.title} complete`} type="checkbox" checked={task.completed} onChange={() => toggleTask(task)} /><span className={task.completed ? 'task-complete' : ''}>{task.title}</span><span>{task.dueDate || 'No due date'}</span><span className={`priority priority-${(task.priority || 'NORMAL').toLowerCase()}`}>{task.priority || 'NORMAL'}</span><button className="icon-button action-delete" aria-label={`Delete ${task.title}`} onClick={() => removeTask(task.id)}><Trash2 size={15} /></button></div>)}</div> : <p className="section-empty">No tasks yet. Add a small next step above.</p>}</section>}

    {tab === 'documents' && <section className="panel detail-content"><div className="panel-header"><div><h2>Documents</h2><p>Uploaded documents and files for this opportunity.</p></div></div><label className={`upload-dropzone ${uploadingFile ? 'upload-disabled' : ''}`}><input type="file" accept=".pdf,.doc,.docx" multiple disabled={uploadingFile} onChange={addFile} /><span className="upload-icon"><UploadCloud size={23} /></span><strong>{uploadingFile ? 'Uploading…' : 'Choose application document'}</strong><span>PDF or DOCX · securely stored on server</span></label>{files.length > 0 && <div className="document-list">{files.map((file) => <div className="document-card" key={file.id}><span className="document-icon"><FileText size={19} /></span><span><strong>{file.originalFilename}</strong><small>{(file.sizeBytes / 1024).toFixed(0)} KB · Uploaded {file.uploadedAt ? format(parseISO(file.uploadedAt), 'MMM d, yyyy') : 'recently'}</small></span><div className="card-actions"><button className="icon-button" aria-label={`Download ${file.originalFilename}`} onClick={() => downloadFile(file)}><Download size={15} /></button><button className="icon-button action-delete" aria-label={`Remove ${file.originalFilename}`} onClick={() => removeFile(file.id)}><Trash2 size={15} /></button></div></div>)}</div>}</section>}

    {tab === 'insights' && <section className="panel detail-content">
      <div className="panel-header"><div><h2>AI preparation</h2><p>Get a head start on understanding this role.</p></div><span className="ai-pilot-label"><Sparkles size={14} /> AI tools</span></div>
      <InlineNotice>AI results are generated by Google Gemini using the saved job description and your default resume.</InlineNotice>
      <div className="insight-grid">{[['summarize', 'Summarize job description', 'A concise view of the role’s focus.'], ['skills', 'Extract required skills', 'Spot the skills emphasized in the listing.'], ['compare-resume', 'Compare resume to requirements', 'Explore potential strengths and gaps.'], ['interview-questions', 'Generate interview questions', 'Practice role-specific questions.'], ['follow-up-email', 'Draft follow-up email', 'Start a thoughtful follow-up draft.']].map(([action, label, description]) => <button className="insight-action" key={action} onClick={() => runInsight(action, label)} disabled={Boolean(aiBusy)}><span className="insight-icon"><Sparkles size={17} /></span><span><strong>{label}</strong><small>{description}</small></span><span className="insight-run">{aiBusy === action ? 'Working…' : 'Run'}</span></button>)}</div>

      {aiError && <div className="chat-error" style={{ marginTop: '1.25rem' }} role="alert"><strong>AI Request Failed</strong><p>{aiError}</p></div>}

      {aiResult && <div className="ai-result" style={{ marginTop: '1.25rem' }}>
        <p className="eyebrow">RESULT · {aiResult.action.toUpperCase()}</p>
        {aiResult.data.summary && <div style={{ marginBottom: '1rem' }}><h4>Summary</h4><p>{aiResult.data.summary}</p></div>}
        {aiResult.data.warningMessage && <div style={{ marginBottom: '1rem', color: '#b45309' }}><strong>Note:</strong> {aiResult.data.warningMessage}</div>}

        {aiResult.data.requiredSkills && aiResult.data.requiredSkills.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <h4>Required Skills</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
              {aiResult.data.requiredSkills.map((s, idx) => <span key={idx} className="badge badge-primary">{s}</span>)}
            </div>
          </div>
        )}

        {aiResult.data.preferredSkills && aiResult.data.preferredSkills.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <h4>Preferred Skills</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
              {aiResult.data.preferredSkills.map((s, idx) => <span key={idx} className="badge badge-secondary">{s}</span>)}
            </div>
          </div>
        )}

        {aiResult.data.matchedSkills && (
          <div style={{ marginBottom: '1rem' }}>
            <h4>Matched Skills</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
              {aiResult.data.matchedSkills.map((s, idx) => <span key={idx} style={{ background: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>✓ {s}</span>)}
            </div>
          </div>
        )}

        {aiResult.data.missingSkills && (
          <div style={{ marginBottom: '1rem' }}>
            <h4>Missing / Unmatched Skills</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
              {aiResult.data.missingSkills.map((s, idx) => <span key={idx} style={{ background: '#fee2e2', color: '#991b1b', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>• {s}</span>)}
            </div>
          </div>
        )}

        {aiResult.data.recommendations && (
          <div style={{ marginBottom: '1rem' }}>
            <h4>Recommendations</h4>
            <ul>{aiResult.data.recommendations.map((r, idx) => <li key={idx}>{r}</li>)}</ul>
          </div>
        )}

        {aiResult.data.questions && (
          <div style={{ marginBottom: '1rem' }}>
            <h4>Practice Interview Questions</h4>
            {aiResult.data.questions.map((q, idx) => (
              <div key={idx} style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', marginBottom: '0.5rem', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>{q.category}</span>
                <p style={{ fontWeight: 600, margin: '0.25rem 0' }}>{q.question}</p>
                {q.preparationPoints && <ul>{q.preparationPoints.map((pt, pIdx) => <li key={pIdx} style={{ fontSize: '0.9rem', color: '#475569' }}>{pt}</li>)}</ul>}
              </div>
            ))}
          </div>
        )}

        {aiResult.data.subject && (
          <div style={{ marginBottom: '1rem' }}>
            <h4>Draft Follow-Up Email</h4>
            <p><strong>Subject:</strong> {aiResult.data.subject}</p>
            <div style={{ whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>{aiResult.data.body}</div>
            {aiResult.data.reviewReminder && <small style={{ color: '#64748b', display: 'block', marginTop: '0.5rem' }}>{aiResult.data.reviewReminder}</small>}
          </div>
        )}

        {aiResult.data.answer && <p>{aiResult.data.answer}</p>}
      </div>}
    </section>}

    <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit application" size="wide"><ApplicationForm initialValue={application} onSubmit={save} onCancel={() => setEditOpen(false)} /></Modal>
    <ConfirmDialog open={deleteOpen} title="Delete this application?" description={`${application.companyName} will be permanently removed from your tracker.`} confirmLabel="Delete application" danger busy={deleteBusy} onCancel={() => setDeleteOpen(false)} onConfirm={remove} />
  </>
}