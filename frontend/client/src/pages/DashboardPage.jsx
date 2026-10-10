import { useEffect, useState } from 'react'
import { addDays, format, isAfter, isBefore, isToday, parseISO, startOfDay } from 'date-fns'
import { Activity, ArrowRight, BellRing, BriefcaseBusiness, CalendarClock, CircleHelp, FilePlus2, FileText, Sparkles, Trophy, UsersRound, Video } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { applicationService } from '../services/applicationService'
import { getApiError } from '../services/apiClient'
import { STATUS_COLORS, STATUS_META } from '../constants/applications'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { DeadlineList, EmptyState, ErrorMessage, LoadingSkeleton, PageHeader, StatCard, StatusBadge } from '../components/ui'

function normalizeList(data) {
  if (Array.isArray(data)) return data
  return data?.content || data?.applications || data?.items || data?.data?.content || data?.data || []
}

function makeDeadlineItems(applications) {
  const today = startOfDay(new Date())
  return applications.filter((item) => item.deadline && !['OFFER', 'REJECTED'].includes(item.status))
    .map((item) => ({ item, date: parseISO(item.deadline.slice(0, 10)) }))
    .filter(({ date }) => (isAfter(date, today) || isToday(date)) && isBefore(date, addDays(today, 31)))
    .sort((a, b) => a.date - b.date)
    .slice(0, 4)
    .map(({ item, date }) => ({ id: item.id, dateLabel: format(date, 'd'), monthLabel: format(date, 'MMM'), title: item.companyName, subtitle: `${item.jobRole} · application deadline`, kind: isBefore(date, new Date(Date.now() + 4 * 86400000)) ? 'soon' : 'deadline', kindLabel: isToday(date) ? 'Today' : format(date, 'MMM d') }))
}

function SummaryTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><span className="tooltip-dot" style={{ background: payload[0].payload.color }} />{payload[0].payload.label}<strong>{payload[0].value}</strong></div>
}

export function DashboardPage() {
  const { user } = useAuth()
  const toast = useToast()
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    applicationService.list({ page: 0, size: 100, sort: 'updatedAt,desc' })
      .then((data) => { if (active) { setApplications(normalizeList(data)); setError('') } })
      .catch((err) => { if (active) { setError(getApiError(err, 'The dashboard could not reach your application service.')); toast('Dashboard data is unavailable right now.', 'error') } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reload, toast])
  function retry() { setLoading(true); setError(''); setReload((current) => current + 1) }
  const count = (status) => applications.filter((item) => item.status === status).length
  const deadlineItems = makeDeadlineItems(applications)
  const interviews = applications.filter((item) => item.status === 'INTERVIEW').slice(0, 3)
  const chartData = Object.entries(STATUS_META).map(([status, meta]) => ({ status, label: meta.label, count: count(status), color: STATUS_COLORS[status] }))
  const overdue = applications.filter((item) => item.deadline && isBefore(parseISO(item.deadline.slice(0, 10)), startOfDay(new Date())) && !['OFFER', 'REJECTED'].includes(item.status))
  const name = user?.fullName || user?.name || user?.email?.split('@')[0] || 'there'
  return <><PageHeader eyebrow="YOUR CAREER WORKSPACE" title={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, ${name.split(' ')[0]}.`} description="A clear view of your search, and what deserves your attention next." action={<Link className="button button-primary" to="/applications?new=1"><FilePlus2 size={17} /> Add application</Link>} />
    {overdue.length > 0 && <section className="followup-warning"><div className="warning-icon"><BellRing size={18} /></div><div><strong>{overdue.length} application{overdue.length > 1 ? 's' : ''} need a follow-up</strong><p>{overdue.slice(0, 2).map((item) => item.companyName).join(', ')} {overdue.length > 2 ? `and ${overdue.length - 2} more` : ''} have passed their deadline.</p></div><Link to="/applications" className="warning-link">Review <ArrowRight size={15} /></Link></section>}
    {error ? <ErrorMessage message={error} onRetry={retry} /> : <>
      <section className="stats-grid" aria-label="Application summary">{loading ? <LoadingSkeleton rows={1} variant="stats" /> : <><StatCard label="Total applications" value={applications.length} icon={BriefcaseBusiness} tone="blue" href="/applications" /><StatCard label="Applied" value={count('APPLIED')} icon={Activity} tone="green" href="/applications?status=APPLIED" /><StatCard label="Interviews" value={count('INTERVIEW')} icon={Video} tone="violet" href="/applications?status=INTERVIEW" /><StatCard label="Offers" value={count('OFFER')} icon={Trophy} tone="amber" href="/applications?status=OFFER" /><StatCard label="Deadlines ahead" value={deadlineItems.length} detail="next 30 days" icon={CalendarClock} tone="coral" href="/calendar" /></>}</section>
      <section className="dashboard-grid dashboard-grid-primary"><article className="panel chart-panel"><div className="panel-header"><div><h2>Applications by status</h2><p>Your pipeline, at a glance</p></div><Link className="panel-link" to="/applications">View all <ArrowRight size={15} /></Link></div>{loading ? <LoadingSkeleton rows={4} /> : applications.length === 0 ? <EmptyState icon={BriefcaseBusiness} title="Your pipeline starts here" description="Add the roles you’re exploring and keep your next steps in one place." action={<Link className="button button-secondary button-small" to="/applications?new=1">Add your first application</Link>} /> : <div className="chart-container"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}><CartesianGrid vertical={false} stroke="#edf0f4" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#7c8796', fontSize: 11 }} interval={0} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#9ba4b1', fontSize: 11 }} /><Tooltip content={<SummaryTooltip />} cursor={{ fill: '#f6f8fb' }} /><Bar dataKey="count" radius={[5, 5, 0, 0]} barSize={33}>{chartData.map((entry) => <Cell key={entry.status} fill={entry.color} />)}</Bar></BarChart></ResponsiveContainer></div>}</article><article className="panel deadlines-panel"><div className="panel-header"><div><h2>Coming up</h2><p>Deadlines to keep in view</p></div><Link className="icon-button" to="/calendar" aria-label="Open calendar" title="Open calendar"><ArrowRight size={17} /></Link></div>{loading ? <LoadingSkeleton rows={4} /> : <DeadlineList items={deadlineItems} emptyTitle="No deadlines coming up" emptyDescription="Add a date to an application to keep it on your radar." />}</article></section>
      <section className="dashboard-grid dashboard-grid-secondary"><article className="panel interviews-panel"><div className="panel-header"><div><h2>Interview pipeline</h2><p>Roles currently in interview stage</p></div><span className="panel-count">{interviews.length}</span></div>{loading ? <LoadingSkeleton rows={2} /> : interviews.length ? <div className="interview-list">{interviews.map((item) => <Link to={`/applications/${item.id}`} className="interview-item" key={item.id}><span className="interview-icon"><Video size={17} /></span><span className="interview-copy"><strong>{item.companyName}</strong><small>{item.jobRole}</small></span><ArrowRight size={15} /></Link>)}</div> : <EmptyState icon={Video} title="Interviews will land here" description="Applications marked Interview will appear in this list." />}</article><article className="panel quick-panel"><div className="panel-header"><div><h2>Make a little progress</h2><p>Quick actions for your search</p></div></div><div className="quick-actions"><Link to="/applications?new=1" className="quick-action"><span className="quick-action-icon quick-blue"><FilePlus2 size={18} /></span><span><strong>Add application</strong><small>Track a new role</small></span><ArrowRight size={15} /></Link><Link to="/resumes" className="quick-action"><span className="quick-action-icon quick-green"><FileText size={18} /></span><span><strong>Manage resume</strong><small>Keep your documents close</small></span><ArrowRight size={15} /></Link><Link to="/assistant" className="quick-action"><span className="quick-action-icon quick-violet"><Sparkles size={18} /></span><span><strong>Ask AI</strong><small>Get application prep support</small></span><ArrowRight size={15} /></Link></div></article></section>
      <section className="panel recent-panel"><div className="panel-header"><div><h2>Recently updated</h2><p>Your latest application activity</p></div><Link className="panel-link" to="/applications">All applications <ArrowRight size={15} /></Link></div>{loading ? <LoadingSkeleton rows={4} /> : applications.length ? <div className="recent-list">{[...applications].sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || '')).slice(0, 5).map((item) => <Link to={`/applications/${item.id}`} className="recent-row" key={item.id}><span className="company-avatar">{item.companyName?.[0]?.toUpperCase() || '?'}</span><span className="recent-company"><strong>{item.companyName}</strong><small>{item.jobRole}</small></span><span className="recent-date">{item.updatedAt ? format(parseISO(item.updatedAt), 'MMM d') : 'New'}</span><StatusBadge status={item.status} /><ArrowRight size={15} className="recent-arrow" /></Link>)}</div> : <EmptyState icon={UsersRound} title="No recent applications" description="When you add a role, its progress will be easy to find here." />}</section>
    </>}
    <div className="dashboard-footnote"><CircleHelp size={14} /> Your dashboard reflects the applications currently available from your account.</div>
  </>
}