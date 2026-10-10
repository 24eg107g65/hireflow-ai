import { useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { APPLICATION_STATUSES } from '../constants/applications'

const blank = { companyName: '', jobRole: '', applicationLink: '', deadline: '', status: 'SAVED', jobDescription: '', notes: '' }

export function ApplicationForm({ initialValue, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...blank, ...initialValue, deadline: initialValue?.deadline?.slice(0, 10) || '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  function update(event) {
    setValues((current) => ({ ...current, [event.target.name]: event.target.value }))
    setErrors((current) => ({ ...current, [event.target.name]: '' }))
  }
  async function submit(event) {
    event.preventDefault()
    const next = {}
    if (!values.companyName.trim()) next.companyName = 'Company name is required.'
    if (!values.jobRole.trim()) next.jobRole = 'Job role is required.'
    if (values.applicationLink && !/^https?:\/\//i.test(values.applicationLink)) next.applicationLink = 'Use a complete link starting with http:// or https://.'
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    try { await onSubmit({ ...values, companyName: values.companyName.trim(), jobRole: values.jobRole.trim() }) } finally { setBusy(false) }
  }
  return <form className="application-form" onSubmit={submit} noValidate><div className="form-grid"><label className="form-field"><span>Company name <b>*</b></span><input name="companyName" value={values.companyName} onChange={update} placeholder="e.g. Stripe" autoFocus aria-invalid={Boolean(errors.companyName)} />{errors.companyName && <small className="field-error">{errors.companyName}</small>}</label><label className="form-field"><span>Job role <b>*</b></span><input name="jobRole" value={values.jobRole} onChange={update} placeholder="e.g. Product Design Intern" aria-invalid={Boolean(errors.jobRole)} />{errors.jobRole && <small className="field-error">{errors.jobRole}</small>}</label><label className="form-field"><span>Application link</span><input name="applicationLink" type="url" value={values.applicationLink} onChange={update} placeholder="https://careers.company.com/role" aria-invalid={Boolean(errors.applicationLink)} />{errors.applicationLink && <small className="field-error">{errors.applicationLink}</small>}</label><label className="form-field"><span>Application deadline</span><input name="deadline" type="date" value={values.deadline} onChange={update} /></label><label className="form-field form-field-wide"><span>Status</span><select name="status" value={values.status} onChange={update}>{APPLICATION_STATUSES.map((status) => <option key={status} value={status}>{status.charAt(0) + status.slice(1).toLowerCase()}</option>)}</select></label><label className="form-field form-field-wide"><span>Job description</span><textarea name="jobDescription" value={values.jobDescription || ''} onChange={update} placeholder="Paste the job description to keep the important details close." rows="4" /></label><label className="form-field form-field-wide"><span>Notes</span><textarea name="notes" value={values.notes || ''} onChange={update} placeholder="Recruiter details, application notes, or questions to ask." rows="3" /></label></div><div className="form-footer"><span><b>*</b> Required fields</span><div><button className="button button-secondary" type="button" onClick={onCancel} disabled={busy}>Cancel</button><button className="button button-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : null}{initialValue?.id ? 'Save changes' : 'Add application'}</button></div></div></form>
}