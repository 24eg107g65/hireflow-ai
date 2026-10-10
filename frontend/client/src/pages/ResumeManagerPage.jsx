import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Check, FileText, Trash2, UploadCloud } from 'lucide-react'
import { ConfirmDialog, EmptyState, ErrorMessage, LoadingSkeleton, Modal, PageHeader } from '../components/ui'
import { useToast } from '../hooks/useToast'
import { getApiError } from '../services/apiClient'
import { resumeService } from '../services/resumeService'

const MAX_FILE_SIZE = 10 * 1024 * 1024

function formatSize(size) {
  return size < 1024 * 1024 ? `${(size / 1024).toFixed(0)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export default function ResumeManagerPage() {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [preview, setPreview] = useState(null)
  const toast = useToast()

  async function loadResumes() {
    setError('')
    try {
      setResumes(await resumeService.list())
    } catch (err) {
      setError(getApiError(err, 'Your resumes could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResumes()
  }, [])

  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url)
  }, [preview])

  async function upload(event) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    const valid = files.filter((file) => /\.(pdf|docx)$/i.test(file.name) && file.size <= MAX_FILE_SIZE)
    if (valid.length !== files.length) toast('Use PDF or DOCX files no larger than 10 MB.', 'error')
    if (!valid.length) return

    setBusy(true)
    try {
      for (const file of valid) await resumeService.upload(file)
      toast(valid.length === 1 ? 'Resume uploaded.' : `${valid.length} resumes uploaded.`, 'success')
    } catch (err) {
      toast(getApiError(err, 'A resume could not be uploaded.'), 'error')
    } finally {
      setBusy(false)
      await loadResumes()
    }
  }

  async function setDefault(resume) {
    setBusy(true)
    try {
      await resumeService.setDefault(resume.id)
      await loadResumes()
      toast('Default resume updated.', 'success')
    } catch (err) {
      toast(getApiError(err, 'The default resume could not be updated.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function removeResume() {
    setBusy(true)
    try {
      await resumeService.remove(deleting.id)
      setDeleting(null)
      await loadResumes()
      toast('Resume deleted.', 'success')
    } catch (err) {
      toast(getApiError(err, 'The resume could not be deleted.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  async function openResume(resume) {
    setBusy(true)
    try {
      const blob = await resumeService.content(resume.id)
      const url = URL.createObjectURL(blob)
      if (resume.contentType === 'application/pdf') setPreview({ name: resume.originalFilename, url })
      else {
        const link = document.createElement('a')
        link.href = url
        link.download = resume.originalFilename
        link.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      toast(getApiError(err, 'The resume could not be opened.'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return <>
    <PageHeader eyebrow="YOUR MATERIALS" title="Resume manager" description="Keep your latest resume ready for the roles you’re pursuing." />
    <label className={`upload-dropzone resume-upload ${busy ? 'upload-disabled' : ''}`}>
      <input type="file" accept=".pdf,.docx" multiple disabled={busy} onChange={upload} />
      <span className="upload-icon"><UploadCloud size={24} /></span>
      <strong>{busy ? 'Working…' : <>Choose a resume or <u>browse files</u></>}</strong>
      <span>PDF or DOCX · up to 10 MB</span>
    </label>
    {error ? <ErrorMessage message={error} onRetry={loadResumes} /> : <section className="resume-section">
      <div className="section-heading"><div><h2>Your resumes</h2><p>{resumes.length} {resumes.length === 1 ? 'document' : 'documents'} in your library</p></div></div>
      {loading ? <LoadingSkeleton rows={2} /> : resumes.length ? <div className="resume-grid">
        {resumes.map((resume) => <article className="resume-card" key={resume.id}>
          <div className="resume-card-top"><span className="resume-file-icon"><FileText size={21} /></span>{resume.isDefault && <span className="default-badge"><Check size={12} /> Default</span>}<button className="icon-button action-delete" aria-label={`Delete ${resume.originalFilename}`} onClick={() => setDeleting(resume)} disabled={busy}><Trash2 size={15} /></button></div>
          <h3 title={resume.originalFilename}>{resume.originalFilename}</h3>
          <p>{formatSize(resume.sizeBytes)} · Added {format(parseISO(resume.uploadedAt), 'MMM d, yyyy')}</p>
          <div className="resume-card-actions"><button className="button button-secondary button-small" onClick={() => setDefault(resume)} disabled={busy || resume.isDefault}>{resume.isDefault ? 'Default resume' : 'Set as default'}</button><button className="button button-secondary button-small" onClick={() => openResume(resume)} disabled={busy}>{resume.contentType === 'application/pdf' ? 'Preview' : 'Download'}</button></div>
        </article>)}
      </div> : <div className="panel resume-empty"><EmptyState icon={FileText} title="No resumes added yet" description="Add a PDF or DOCX to keep it ready for your applications." /></div>}
    </section>}
    <section className="panel resume-usage"><span className="resume-usage-icon"><FileText size={18} /></span><div><h2>Resume history by application</h2><p>The application API does not currently record which resume was used for each role. That history will be available when the backend supports resume associations.</p></div></section>
    <ConfirmDialog open={Boolean(deleting)} title="Delete this resume?" description={`${deleting?.originalFilename} will be permanently removed from your library.`} confirmLabel="Delete resume" danger busy={busy} onCancel={() => setDeleting(null)} onConfirm={removeResume} />
    <Modal open={Boolean(preview)} title={preview?.name || 'Resume preview'} size="wide" onClose={() => setPreview(null)}>{preview && <iframe style={{ display: 'block', width: '100%', height: 'min(75vh, 760px)', border: 0, background: '#f4f6f9' }} src={preview.url} title={`Preview of ${preview.name}`} />}</Modal>
  </>
}