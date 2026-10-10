import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Check, ChevronDown, LoaderCircle, Search, X } from 'lucide-react'
import { STATUS_META } from '../constants/applications'

export function PageHeader({ eyebrow, title, description, action }) {
  return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="page-description">{description}</p>}</div>{action && <div className="page-header-action">{action}</div>}</div>
}

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.SAVED
  return <span className={`status-badge tone-${meta.tone}`}><i aria-hidden="true" />{meta.label}</span>
}

export function StatCard({ label, value, detail, icon: Icon, tone = 'blue', href }) {
  const content = <><div className={`stat-icon stat-${tone}`}><Icon size={19} /></div><p className="stat-label">{label}</p><div className="stat-value-row"><strong>{value}</strong>{detail && <span>{detail}</span>}</div></>
  return href ? <Link to={href} className="stat-card stat-link">{content}<ArrowRight className="stat-arrow" size={16} /></Link> : <div className="stat-card">{content}</div>
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return <div className="empty-state"><div className="empty-icon">{Icon && <Icon size={23} />}</div><h3>{title}</h3><p>{description}</p>{action}</div>
}

export function LoadingSkeleton({ rows = 3, variant = 'row' }) {
  return <div className={`skeleton-list skeleton-${variant}`} aria-label="Loading" role="status">{Array.from({ length: rows }, (_, index) => <div className="skeleton-row" key={index}><span /><span /><span /></div>)}<span className="sr-only">Loading content</span></div>
}

export function ErrorMessage({ message, onRetry }) {
  return <div className="error-message" role="alert"><AlertTriangle size={19} /><div><strong>Couldn’t load this information</strong><p>{message}</p>{onRetry && <button className="text-button" onClick={onRetry}>Try again</button>}</div></div>
}

export function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel, busy = false }) {
  useEffect(() => {
    if (!open) return undefined
    const handleKey = (event) => { if (event.key === 'Escape') onCancel() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onCancel])
  if (!open) return null
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"><button className="icon-button dialog-close" aria-label="Close dialog" onClick={onCancel}><X size={18} /></button><div className={`confirm-symbol ${danger ? 'confirm-danger' : ''}`}><AlertTriangle size={21} /></div><h2 id="confirm-title">{title}</h2><p>{description}</p><div className="dialog-actions"><button className="button button-secondary" onClick={onCancel} disabled={busy}>Cancel</button><button className={`button ${danger ? 'button-danger' : 'button-primary'}`} onClick={onConfirm} disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}{confirmLabel}</button></div></section></div>
}

export function SearchAndFilterBar({ search, onSearch, status, onStatus, sort, onSort, placeholder = 'Search applications...' }) {
  return <div className="filter-bar"><label className="search-field"><Search size={17} /><span className="sr-only">Search applications</span><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={placeholder} /></label><label className="select-field"><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => onStatus(event.target.value)}><option value="">All statuses</option><option value="SAVED">Saved</option><option value="APPLIED">Applied</option><option value="ASSESSMENT">Assessment</option><option value="INTERVIEW">Interview</option><option value="OFFER">Offer</option><option value="REJECTED">Rejected</option></select><ChevronDown size={15} /></label><label className="select-field sort-field"><span className="sr-only">Sort applications</span><select value={sort} onChange={(event) => onSort(event.target.value)}><option value="deadline">Deadline</option><option value="companyName">Company</option><option value="updatedAt">Recently updated</option></select><ChevronDown size={15} /></label></div>
}

export function Modal({ open, title, children, onClose, size = 'normal' }) {
  useEffect(() => {
    if (!open) return undefined
    const handleKey = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])
  if (!open) return null
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><h2 id="modal-title">{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></div>{children}</section></div>
}

export function DeadlineList({ items, emptyTitle = 'Nothing on the horizon', emptyDescription = 'Upcoming dates will appear here.' }) {
  if (!items?.length) return <EmptyState title={emptyTitle} description={emptyDescription} />
  return <div className="deadline-list">{items.map((item) => <div className="deadline-item" key={item.id}><div className="deadline-date"><strong>{item.dateLabel}</strong><span>{item.monthLabel}</span></div><div className="deadline-copy"><strong>{item.title}</strong><span>{item.subtitle}</span></div><span className={`deadline-kind kind-${item.kind}`}>{item.kindLabel}</span></div>)}</div>
}

export function InlineNotice({ children, tone = 'info' }) {
  return <div className={`inline-notice notice-${tone}`} role="note">{children}</div>
}

export function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null
  return <div className="pagination"><span>Page {page} of {pages}</span><div><button className="button button-secondary button-small" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button><button className="button button-secondary button-small" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button></div></div>
}