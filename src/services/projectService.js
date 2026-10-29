
import { supabase } from '../lib/supabase'

export const getProjects = async (workspaceId) => {
    if (!workspaceId) {
        return []
    }

    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

    if (error) {
        throw error
    }

    return data ?? []
}


export const createProject = async (workspaceId, projectData) => {
    if (!workspaceId) {
        throw new Error('Please select a workspace first.')
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
        throw userError
    }

    if (!user) {
        throw new Error('You must be logged in to create a project.')
    }

    const { data, error } = await supabase
        .from('projects')
        .insert({
            workspace_id: workspaceId,
            name: projectData.name,
            description: projectData.description || '',
            status: projectData.status || 'planning',
            due_date: projectData.due_date || null,
            created_by: user.id,
        })
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export const updateProject = async (projectId, projectData) => {
    if (!projectId) {
        throw new Error('A project must be selected to update.')
    }

    if (!projectData.name.trim()) {
        throw new Error('Project name is required.')
    }

    const { data, error } = await supabase
        .from('projects')
        .update({
            name: projectData.name,
            description: projectData.description || '',
            status: projectData.status,
            due_date: projectData.due_date || null,
            progress: projectData.progress,
            updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
        .select()
        .single()

    if (error) throw error

    return data
}

export const deleteProject = async (projectId) => {

    if(!projectId) {
        throw new Error('A project must be selected to delete.')
    }

    const { data, error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .select('id')
        .maybeSingle()

        if(error) throw error

        if(!data) {
            throw new Error('Project could not be deleted. It may not exist or you may not have permission.',)
        }

        return data
}