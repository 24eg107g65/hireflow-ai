import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import './index.css'
import './App.css'

const savedTheme = localStorage.getItem('hireflow_theme') || 'light'
document.documentElement.dataset.theme = savedTheme === 'system'
	? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
	: savedTheme

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<BrowserRouter>
			<AuthProvider>
				<ToastProvider>
					<App />
				</ToastProvider>
			</AuthProvider>
		</BrowserRouter>
	</React.StrictMode>,
)
