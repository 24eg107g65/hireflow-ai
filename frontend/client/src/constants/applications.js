export const APPLICATION_STATUSES = ['SAVED', 'APPLIED', 'ASSESSMENT', 'INTERVIEW', 'OFFER', 'REJECTED']

export const STATUS_META = {
  SAVED: { label: 'Saved', tone: 'neutral' },
  APPLIED: { label: 'Applied', tone: 'blue' },
  ASSESSMENT: { label: 'Assessment', tone: 'amber' },
  INTERVIEW: { label: 'Interview', tone: 'violet' },
  OFFER: { label: 'Offer', tone: 'green' },
  REJECTED: { label: 'Rejected', tone: 'red' },
}

export const STATUS_COLORS = {
  SAVED: '#8b95a5',
  APPLIED: '#3979ed',
  ASSESSMENT: '#d99521',
  INTERVIEW: '#7959c9',
  OFFER: '#20a16b',
  REJECTED: '#db5964',
}

export const NAV_ITEMS = [
  { label: 'Overview', to: '/', icon: 'LayoutDashboard' },
  { label: 'Applications', to: '/applications', icon: 'BriefcaseBusiness' },
  { label: 'Calendar', to: '/calendar', icon: 'CalendarDays' },
  { label: 'Resume manager', to: '/resumes', icon: 'FileText' },
  { label: 'AI assistant', to: '/assistant', icon: 'Sparkles' },
]