import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './auth/authProvider.tsx'
import { ToastProvider } from './components/Toast/Toast.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
        <ToastProvider>
            <App />
        </ToastProvider>
    </AuthProvider>
  </StrictMode>,
)
