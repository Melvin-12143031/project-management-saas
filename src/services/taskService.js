
import { supabase } from '../lib/supabase'


export const getTasks = async (workspaceId) => {
    if (!workspaceId) {
        throw new Error('A workspace must be selected to fetch tasks.')
    }

    const { data, error } = await supabase
        .from('tasks')
        .select(`
            *,
            projects!tasks_project_id_fkey (
                id,
                name
            )
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

    if (error) throw error

    return data
}



export const createTask = async (workspaceId, taskData) => {
    if (!workspaceId) {
        throw new Error('Please select a workspace first.')
    }

    if (!taskData.project_id) {
        throw new Error('Please select a project for this task.')
    }

    if (!taskData.title?.trim()) {
        throw new Error('Task title is required.')
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
        throw userError
    }

    if (!user) {
        throw new Error('You must be logged in to create a task.')
    }

    const { data, error } = await supabase
        .from('tasks')
        .insert({
            workspace_id: workspaceId,
            project_id: taskData.project_id,
            title: taskData.title.trim(),
            description: taskData.description || '',
            status: taskData.status || 'todo',
            priority: taskData.priority || 'medium',
            due_date: taskData.due_date || null,
            created_by: user.id,
        })
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export const updateTaskStatus = async (taskId, status) => {
    if (!taskId) {
        throw new Error('A task must be selected to update.')
    }

    if (!status) {
        throw new Error('A task status is required.')
    }

    const { data, error } = await supabase
        .from('tasks')
        .update({
            status,
        })
        .eq('id', taskId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export const updateTask = async (taskId, taskData) => {
    if (!taskId) {
        throw new Error('A task must be selected to update.')
    }

    if (!taskData.title?.trim()) {
        throw new Error('Task title is required.')
    }

    if (!taskData.project_id) {
        throw new Error('Please select a project for this task.')
    }

    const { data, error } = await supabase
        .from('tasks')
        .update({
            title: taskData.title.trim(),
            description: taskData.description || '',
            project_id: taskData.project_id,
            status: taskData.status || 'todo',
            priority: taskData.priority || 'medium',
            due_date: taskData.due_date || null,

        })
        .eq('id', taskId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}


export const deleteTask = async (taskId) => {
    if (!taskId) {
        throw new Error('A task must be selected to delete.')
    }

    const { data, error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .select('id')
        .maybeSingle()

    if (error) {
        throw error
    }

    if (!data) {
        throw new Error(
            'Task could not be deleted. It may not exist or you may not have permission.',
        )
    }

    return data
}
