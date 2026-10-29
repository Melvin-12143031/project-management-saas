import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

import AppLayout from './layouts/AppLayout'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import MyTasksPage from './pages/MyTasksPage'
import SettingsPage from './pages/SettingsPage'
import AuthPage from './pages/AuthPage'

import { Toaster } from 'sonner'

import './lib/supabase'

const App = () => {

    return (
        <>
            <Toaster
                position="top-right"
                richColors
                closeButton
                duration={3000}
                theme="dark"
            />

            <Routes>
                {/* Public route: anyone can open the auth page */}
                <Route path="/auth" element={<AuthPage />} />

                {/* Protected routes: sign-in required */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                        <Route
                            path="/"
                            element={<Navigate to="/dashboard" replace />}
                        />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/projects" element={<ProjectsPage />} />
                        <Route path="/my-tasks" element={<MyTasksPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                    </Route>
                </Route>
            </Routes>
        </>
    )

}

export default App