
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = () => {
    const { user, isLoading } = useAuth()

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0b0b12] text-white">
                Loading Flowspace...
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/auth" replace />
    }

    return <Outlet />
}

export default ProtectedRoute
