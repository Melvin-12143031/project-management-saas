
import { supabase } from '../lib/supabase'

export const getNotifications = async () => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

    if (error) {
        throw error
    }

    return data ?? []
}

export const markNotificationAsRead = async (notificationId) => {
    if (!notificationId) {
        throw new Error('A notification must be selected.')
    }

    const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}

export const markAllNotificationsAsRead = async () => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false)

    if (error) {
        throw error
    }
}


export const createNotification = async ({
    userId,
    workspaceId,
    title,
    message,
    type = 'general',
    link = null,
    recordId = null,
}) => {
    if (!userId) {
        throw new Error('A user is required to create a notification.')
    }

    const { data, error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            workspace_id: workspaceId || null,
            title,
            message,
            type,
            link,
            record_id: recordId,
        })
        .select()
        .single()

    if (error) {
        throw error
    }

    return data
}
