
import {
    createContext,
    useContext,
    useEffect,
    useState,
} from 'react'

import { supabase } from '../lib/supabase'


const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [profile, setProfile] = useState(null)
    const [isProfileLoading, setIsProfileLoading] = useState(false)



    const fetchProfile = async (userId) => {
        setIsProfileLoading(true)

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle()

            if (error) {
                console.error('Failed to fetch profile:', error.message)
                setProfile(null)
                return
            }

            setProfile(data)
        } finally {
            setIsProfileLoading(false)
        }
    }


    useEffect(() => {
        let isMounted = true

        const initializeSession = async () => {
            const { data, error } = await supabase.auth.getSession()

            if (!isMounted) return

            if (error) {
                console.error('Failed to retrieve session:', error.message)
            }

            setSession(data?.session ?? null)
            setIsLoading(false)
        }

        initializeSession()

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
            setIsLoading(false)
        })

        return () => {
            isMounted = false
            subscription.unsubscribe()
        }
    }, [])

    useEffect(() => {
        if (!session?.user?.id) {
            setProfile(null)
            return
        }

        fetchProfile(session.user.id)
    }, [session])

    const value = {
        session,
        user: session?.user ?? null,
        profile,
        refreshProfile: fetchProfile,
        isProfileLoading,
        isLoading,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error(
            'useAuth must be used within an AuthProvider.',
        )
    }

    return context
}
