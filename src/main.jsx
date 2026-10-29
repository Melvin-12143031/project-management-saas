
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { WorkspaceProvider } from './contexts/WorkspaceContext.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <WorkspaceProvider>
                    <App />
                </WorkspaceProvider>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>,
)
