
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react'

import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import {
    createWorkspace as createWorkspaceService,
    updateWorkspace as updateWorkspaceService,
    deleteWorkspace as deleteWorkspaceService,
} from '../services/workspaceService'

const WorkspaceContext = createContext(null)

export const WorkspaceProvider = ({ children }) => {
    const { user } = useAuth()

    const [workspaces, setWorkspaces] = useState([])
    const [currentWorkspace, setCurrentWorkspace] = useState(null)
    const [defaultWorkspaceId, setDefaultWorkspaceId] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)

    const fetchWorkspaces = useCallback(async () => {
        if (!user?.id) {
            setWorkspaces([])
            setCurrentWorkspace(null)
            setDefaultWorkspaceId(null)
            setIsLoading(false)
            return
        }

        setIsLoading(true)

        try {
            const { data: workspaceData, error: workspaceError } =
                await supabase
                    .from('workspaces')
                    .select('*')
                    .order('created_at', { ascending: false })

            if (workspaceError) {
                throw workspaceError
            }

            const { data: profileData, error: profileError } =
                await supabase
                    .from('profiles')
                    .select('default_workspace_id')
                    .eq('id', user.id)
                    .maybeSingle()

            if (profileError) {
                throw profileError
            }

            const availableWorkspaces = workspaceData ?? []
            const savedDefaultId = profileData?.default_workspace_id ?? null

            const savedDefaultWorkspace = availableWorkspaces.find(
                (workspace) => workspace.id === savedDefaultId,
            )

            setWorkspaces(availableWorkspaces)
            setDefaultWorkspaceId(
                savedDefaultWorkspace?.id ?? null,
            )

            setCurrentWorkspace((current) => {
                if (current) {
                    const existingWorkspace = availableWorkspaces.find(
                        (workspace) => workspace.id === current.id,
                    )

                    if (existingWorkspace) {
                        return existingWorkspace
                    }
                }

                return savedDefaultWorkspace ?? availableWorkspaces[0] ?? null
            })
        } finally {
            setIsLoading(false)
        }
    }, [user?.id])

    useEffect(() => {
        fetchWorkspaces().catch((error) => {
            console.error('Failed to fetch workspaces:', error.message)
        })
    }, [fetchWorkspaces])

    const setDefaultWorkspace = async (workspaceId) => {
        if (!user?.id) {
            throw new Error('You must be signed in to set a default workspace.')
        }

        const selectedWorkspace = workspaces.find(
            (workspace) => workspace.id === workspaceId,
        )

        if (!selectedWorkspace) {
            throw new Error('Please select an available workspace.')
        }

        const { error } = await supabase
            .from('profiles')
            .update({
                default_workspace_id: selectedWorkspace.id,
            })
            .eq('id', user.id)

        if (error) {
            throw error
        }

        setDefaultWorkspaceId(selectedWorkspace.id)
        setCurrentWorkspace(selectedWorkspace)
    }

    const createWorkspace = async (workspaceData) => {
        setIsCreating(true)

        try {
            const workspaceId = await createWorkspaceService(workspaceData)

            await fetchWorkspaces()

            const { data, error } = await supabase
                .from('workspaces')
                .select('*')
                .eq('id', workspaceId)
                .single()

            if (error) {
                throw error
            }

            setCurrentWorkspace(data)

            return data
        } finally {
            setIsCreating(false)
        }
    }

    const updateWorkspace = async (workspaceId, workspaceData) => {
        const updatedWorkspace = await updateWorkspaceService(
            workspaceId,
            workspaceData,
        )

        setWorkspaces((currentWorkspaces) =>
            currentWorkspaces.map((workspace) =>
                workspace.id === updatedWorkspace.id
                    ? updatedWorkspace
                    : workspace,
            ),
        )

        setCurrentWorkspace((current) =>
            current?.id === updatedWorkspace.id
                ? updatedWorkspace
                : current,
        )

        return updatedWorkspace
    }

    const deleteWorkspace = async (workspaceId) => {
        await deleteWorkspaceService(workspaceId)

        const remainingWorkspaces = workspaces.filter(
            (workspace) => workspace.id !== workspaceId,
        )

        setWorkspaces(remainingWorkspaces)

        setCurrentWorkspace((current) => {
            if (current?.id !== workspaceId) {
                return current
            }

            return remainingWorkspaces[0] ?? null
        })

        if (defaultWorkspaceId === workspaceId) {
            setDefaultWorkspaceId(null)
        }
    }

    const value = {
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
        defaultWorkspaceId,
        setDefaultWorkspace,
        isLoading,
        isCreating,
        fetchWorkspaces,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
    }

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    )
}

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext)

    if (!context) {
        throw new Error(
            'useWorkspace must be used within a WorkspaceProvider.',
        )
    }

    return context
}
