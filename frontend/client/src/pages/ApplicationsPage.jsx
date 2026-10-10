import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BriefcaseBusiness, FilePlus2 } from 'lucide-react'
import { applicationService } from '../services/applicationService'
import { getApiError } from '../services/apiClient'
import { useToast } from '../hooks/useToast'
import { ApplicationForm } from '../components/ApplicationForm'
import { ApplicationTable } from '../components/ApplicationTable'
import { ConfirmDialog, EmptyState, ErrorMessage, LoadingSkeleton, Modal, PageHeader, Pagination, SearchAndFilterBar } from '../components/ui'

function listFrom(data) { return Array.isArray(data) ? data : data?.content || data?.applications || data?.items || data?.data?.content || data?.data || [] }

export function ApplicationsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const params = new URLSearchParams(location.search)
  const [applications, setApplications] = useState([])
  const [search, setSearch] = useState(params.get('search') || '')
  const [status, setStatus] = useState(params.get('status') || '')
  const [sort, setSort] = useState('deadline')
  const [page, setPage] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(params.get('new') === '1')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deletingBusy, setDeletingBusy] = useState(false)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    applicationService.list({ page, size: 10, search: search || undefined, status: status || undefined, sortBy: sort, direction: sort === 'deadline' ? 'asc' : 'desc' })
      .then((data) => { if (active) { setApplications(listFrom(data)); setPages(data?.totalPages || data?.data?.totalPages || 1); setError('') } })
      .catch((err) => { if (active) setError(getApiError(err, 'Your applications could not be loaded.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, search, status, sort, reload])
  function updateSearch(value) { setPage(0); setSearch(value); setLoading(true) }
  function updateStatus(value) { setPage(0); setStatus(value); setLoading(true) }
  function updateSort(value) { setPage(0); setSort(value); setLoading(true) }
  function retry() { setLoading(true); setError(''); setReload((current) => current + 1) }
  function closeModal() { setModalOpen(false); setEditing(null); navigate('/applications', { replace: true }) }
  async function saveApplication(payload) {
    try {
      if (editing) await applicationService.update(editing.id, payload)
      else await applicationService.create(payload)
      toast(editing ? 'Application updated.' : 'Application added.', 'success')
      closeModal()
      setLoading(true)
      setReload((current) => current + 1)
    } catch (err) { toast(getApiError(err, 'Your application could not be saved.'), 'error'); throw err }
  }
  async function deleteApplication() {
    setDeletingBusy(true)
    try { await applicationService.remove(deleting.id); toast(`${deleting.companyName} was deleted.`, 'success'); setDeleting(null); setLoading(true); setReload((current) => current + 1) }
    catch (err) { toast(getApiError(err, 'This application could not be deleted.'), 'error') }
    finally { setDeletingBusy(false) }
  }
  return <><PageHeader eyebrow="YOUR OPPORTUNITIES" title="Applications" description="Keep every role, deadline, and next step moving." action={<button className="button button-primary" onClick={() => { setEditing(null); setModalOpen(true) }}><FilePlus2 size={17} /> Add application</button>} /><SearchAndFilterBar search={search} onSearch={updateSearch} status={status} onStatus={updateStatus} sort={sort} onSort={updateSort} />
    <section className="panel applications-panel"><div className="applications-count"><strong>{loading ? 'Loading applications…' : `${applications.length} ${applications.length === 1 ? 'application' : 'applications'}`}</strong><span>Keep your opportunities in motion</span></div>{error ? <ErrorMessage message={error} onRetry={retry} /> : loading ? <LoadingSkeleton rows={6} /> : applications.length ? <><ApplicationTable applications={applications} onEdit={(item) => { setEditing(item); setModalOpen(true) }} onDelete={setDeleting} /><Pagination page={page + 1} pages={pages} onPage={(next) => { setPage(next - 1); setLoading(true) }} /></> : <EmptyState icon={BriefcaseBusiness} title={search || status ? 'No matching applications' : 'Your next opportunity starts here'} description={search || status ? 'Try a different search or remove a filter.' : 'Add the roles you’re interested in and we’ll help you keep the details straight.'} action={!search && !status && <button className="button button-primary" onClick={() => setModalOpen(true)}><FilePlus2 size={16} /> Add your first application</button>} />}</section>
    <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit application' : 'Add application'} size="wide"><ApplicationForm initialValue={editing} onSubmit={saveApplication} onCancel={closeModal} /></Modal>
    <ConfirmDialog open={Boolean(deleting)} title="Delete this application?" description={`${deleting?.companyName} will be permanently removed from your tracker.`} confirmLabel="Delete application" danger busy={deletingBusy} onCancel={() => setDeleting(null)} onConfirm={deleteApplication} />
  </>
}