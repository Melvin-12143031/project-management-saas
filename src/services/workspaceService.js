
import { supabase } from '../lib/supabase'

export const createWorkspace = async ({
    name,
    description = '',
}) => {
    const { data, error } = await supabase.rpc('create_workspace', {
        workspace_name: name,
        workspace_description: description,
    })

    if (error) {
        throw error
    }

    return data
}


export const updateWorkspace = async (workspaceId, {
    name,
    description = '',
}) => {
    if (!workspaceId) {
        throw new Error('A workspace ID is required.')
    }

    const trimmedName = name?.trim()

    if (!trimmedName) {
        throw new Error('Workspace name is required.')
    }

    const { data, error } = await supabase
        .from('workspaces')
        .update({
            name: trimmedName,
            description: description.trim(),
            updated_at: new Date().toISOString(),
        })
        .eq('id', workspaceId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export const deleteWorkspace = async (workspaceId) => {
    if (!workspaceId) {
        throw new Error('A workspace ID is required.')
    }

    const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId)

    if (error) {
        throw error
    }
}
