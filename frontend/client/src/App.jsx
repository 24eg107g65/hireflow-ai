import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { AppLayout } from './layouts/AppLayout.jsx'

const LoginPage = lazy(() => import('./pages/AuthPages.jsx').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('./pages/AuthPages.jsx').then((module) => ({ default: module.RegisterPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx').then((module) => ({ default: module.DashboardPage })))
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage.jsx').then((module) => ({ default: module.ApplicationsPage })))
const ApplicationDetailsPage = lazy(() => import('./pages/ApplicationDetailsPage.jsx').then((module) => ({ default: module.ApplicationDetailsPage })))
const CalendarPage = lazy(() => import('./pages/WorkspacePages.jsx').then((module) => ({ default: module.CalendarPage })))
const ResumePage = lazy(() => import('./pages/ResumeManagerPage.jsx'))
const AssistantPage = lazy(() => import('./pages/WorkspacePages.jsx').then((module) => ({ default: module.AssistantPage })))
const ProfilePage = lazy(() => import('./pages/WorkspacePages.jsx').then((module) => ({ default: module.ProfilePage })))
const SettingsPage = lazy(() => import('./pages/WorkspacePages.jsx').then((module) => ({ default: module.SettingsPage })))

export default function App() {
	return (
		<Suspense fallback={<div className="auth-loading"><div className="brand-mark">p</div><span className="loader-dot" /></div>}>
		<Routes>
			<Route path="/login" element={<LoginPage />} />
			<Route path="/register" element={<RegisterPage />} />
			<Route element={<ProtectedRoute />}>
				<Route element={<AppLayout />}>
					<Route index element={<DashboardPage />} />
					<Route path="applications" element={<ApplicationsPage />} />
					<Route path="applications/:id" element={<ApplicationDetailsPage />} />
					<Route path="calendar" element={<CalendarPage />} />
					<Route path="resumes" element={<ResumePage />} />
					<Route path="assistant" element={<AssistantPage />} />
					<Route path="profile" element={<ProfilePage />} />
					<Route path="settings" element={<SettingsPage />} />
					<Route path="*" element={<Navigate to="/" replace />} />
				</Route>
			</Route>
		</Routes>
		</Suspense>
	)
}
