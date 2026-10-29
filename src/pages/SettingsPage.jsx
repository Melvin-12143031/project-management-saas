
import {
    Bell,
    Check,
    Lock,
    Mail,
    Save,
    Shield,
    User,
    Users,
} from 'lucide-react'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

const DEFAULT_NOTIFICATION_PREFERENCES = {
    task_assignments: true,
    project_activity: true,
    weekly_summary: true,
}

const SettingsPage = () => {


    const {
        user,
        profile,
        refreshProfile,
        isProfileLoading,
    } = useAuth()

    const {
        workspaces,
        defaultWorkspaceId,
        setDefaultWorkspace,
        isLoading: isWorkspaceLoading,
    } = useWorkspace()

    const [fullName, setFullName] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [selectedAvatar, setSelectedAvatar] = useState(null)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

    const avatarInputRef = useRef(null)

    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('')
    const [isSavingWorkspace, setIsSavingWorkspace] = useState(false)

    const [notificationPreferences, setNotificationPreferences] = useState(
        DEFAULT_NOTIFICATION_PREFERENCES,
    )
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)
    const [isSavingNotifications, setIsSavingNotifications] = useState(false)

    const [showPasswordForm, setShowPasswordForm] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isSavingPassword, setIsSavingPassword] = useState(false)



    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '')
        }
    }, [profile])

    useEffect(() => {
        setSelectedWorkspaceId(defaultWorkspaceId || '')
    }, [defaultWorkspaceId])

    useEffect(() => {
        let isActive = true

        const loadNotificationPreferences = async () => {
            if (!user?.id) {
                setIsLoadingNotifications(false)
                return
            }

            setIsLoadingNotifications(true)

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('notification_preferences')
                    .eq('id', user.id)
                    .maybeSingle()

                if (error) throw error

                if (isActive) {
                    setNotificationPreferences({
                        ...DEFAULT_NOTIFICATION_PREFERENCES,
                        ...(data?.notification_preferences ?? {}),
                    })
                }
            } catch (error) {
                console.error(
                    'Failed to load notification preferences:',
                    error.message,
                )

                if (isActive) {
                    toast.error(
                        'Failed to load notification preferences.',
                    )
                }
            } finally {
                if (isActive) {
                    setIsLoadingNotifications(false)
                }
            }
        }

        loadNotificationPreferences()

        return () => {
            isActive = false
        }
    }, [user?.id])

    const handleSaveProfile = async () => {
        if (isSaving || !user) return

        const trimmedName = fullName.trim()

        if (!trimmedName) {
            toast.error('Full name cannot be empty.')
            return
        }

        setIsSaving(true)

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: trimmedName,
                })
                .eq('id', user.id)

            if (error) throw error

            await refreshProfile(user.id)
            setFullName(trimmedName)

            toast.success('Profile updated successfully!')
        } catch (error) {
            console.error('Failed to update profile:', error.message)
            toast.error('Failed to update profile. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    const getAvatarStoragePath = (avatarUrl) => {
        if (!avatarUrl) return null

        const marker = '/storage/v1/object/public/avatars/'
        const markerIndex = avatarUrl.indexOf(marker)

        if (markerIndex === -1) return null

        return decodeURIComponent(
            avatarUrl.slice(markerIndex + marker.length).split('?')[0],
        )
    }

    const handleUploadAvatar = async () => {
        if (!user || !selectedAvatar || isUploadingAvatar) return

        setIsUploadingAvatar(true)

        try {
            const previousAvatarPath = getAvatarStoragePath(profile?.avatar_url)

            const fileExtension = selectedAvatar.name.split('.').pop().toLowerCase()

            const filePath = `${user.id}/avatar.${fileExtension}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, selectedAvatar, {
                    upsert: true,
                    contentType: selectedAvatar.type,
                })

            if (uploadError) throw uploadError

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    avatar_url: data.publicUrl,
                })
                .eq('id', user.id)

            if (profileError) throw profileError

            if (previousAvatarPath && previousAvatarPath !== filePath) {
                const { error: deleteError } = await supabase.storage
                    .from('avatars')
                    .remove([previousAvatarPath])

                if (deleteError) {
                    console.error(
                        'Failed to delete previous avatar:',
                        deleteError.message,
                    )
                }
            }

            await refreshProfile(user.id)
            setSelectedAvatar(null)

            if (avatarInputRef.current) {
                avatarInputRef.current.value = ''
            }

            toast.success('Profile picture updated successfully!')
        } catch (error) {
            console.error('Failed to upload avatar:', error.message)
            toast.error('Failed to upload profile picture. Please try again.')
        } finally {
            setIsUploadingAvatar(false)
        }
    }

    const handleRemoveAvatar = async () => {
        if (!user || !profile?.avatar_url || isUploadingAvatar) return

        setIsUploadingAvatar(true)

        try {
            const avatarPath = getAvatarStoragePath(profile.avatar_url)

            const { error: profileError } = await supabase
                .from('profiles')
                .update({ avatar_url: null })
                .eq('id', user.id)

            if (profileError) throw profileError

            await refreshProfile(user.id)

            if (avatarPath) {
                const { error: deleteError } = await supabase.storage
                    .from('avatars')
                    .remove([avatarPath])

                if (deleteError) {
                    console.error(
                        'Failed to delete avatar file:',
                        deleteError.message,
                    )
                }
            }

            toast.success('Profile picture removed successfully!')
        } catch (error) {
            console.error('Failed to remove avatar:', error.message)
            toast.error('Failed to remove profile picture. Please try again.')
        } finally {
            setIsUploadingAvatar(false)
        }
    }


    const handleSaveDefaultWorkspace = async () => {
        if (isSavingWorkspace) return

        if (!selectedWorkspaceId) {
            toast.error('Please select a workspace.')
            return
        }

        setIsSavingWorkspace(true)

        try {
            await setDefaultWorkspace(selectedWorkspaceId)
            toast.success('Default workspace saved successfully!')
        } catch (error) {
            console.error(
                'Failed to save default workspace:',
                error.message,
            )
            toast.error(
                'Failed to save default workspace. Please try again.',
            )
        } finally {
            setIsSavingWorkspace(false)
        }
    }

    const handleNotificationChange = (preference, checked) => {
        setNotificationPreferences((current) => ({
            ...current,
            [preference]: checked,
        }))
    }

    const handleSaveNotifications = async () => {
        if (!user || isSavingNotifications || isLoadingNotifications) return

        setIsSavingNotifications(true)

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    notification_preferences: notificationPreferences,
                })
                .eq('id', user.id)

            if (error) throw error

            toast.success('Notification preferences saved!')
        } catch (error) {
            console.error(
                'Failed to save notification preferences:',
                error.message,
            )
            toast.error(
                'Failed to save notification preferences. Please try again.',
            )
        } finally {
            setIsSavingNotifications(false)
        }
    }

    const validatePassword = () => {
        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters long.')
            return false
        }

        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match.')
            return false
        }

        return true
    }

    const handleChangePassword = async () => {
        if (isSavingPassword) return

        if (!validatePassword()) return

        setIsSavingPassword(true)

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            })

            if (error) throw error

            toast.success('Password updated successfully!')

            setNewPassword('')
            setConfirmPassword('')
            setShowPasswordForm(false)
        } catch (error) {
            console.error('Failed to update password:', error.message)

            toast.error(
                error.message || 'Failed to update password. Please try again.',
            )
        } finally {
            setIsSavingPassword(false)
        }
    }

    return (
        <div className="mx-auto max-w-5xl space-y-8">
            {/* Header */}
            <div>
                <p className="text-sm text-slate-400">
                    Workspace / Settings
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                    Settings
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                    Manage your profile, workspace, notifications, and
                    security preferences.
                </p>
            </div>

            {/* Profile */}
            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
                <div className="border-b border-slate-800 p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
                            <User size={20} />
                        </div>

                        <div>
                            <h2 className="font-semibold text-white">
                                Profile
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Manage your personal account information.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 border-b border-slate-800 p-6 sm:flex-row sm:items-center">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-violet-500/15 text-2xl font-semibold text-violet-300">
                        {selectedAvatar ? (
                            <img
                                src={URL.createObjectURL(selectedAvatar)}
                                alt="Selected profile avatar"
                                className="h-full w-full object-cover"
                            />
                        ) : profile?.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="Profile avatar"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            (profile?.full_name || user?.email || 'U')
                                .charAt(0)
                                .toUpperCase()
                        )}
                    </div>

                    <div className="flex-1">
                        <h3 className="font-medium text-white">
                            Profile picture
                        </h3>

                        <p className="mt-1 text-sm text-slate-400">
                            JPG, PNG, or WebP. Maximum file size: 2 MB.
                        </p>

                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0]

                                if (!file) return

                                if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                                    toast.error('Please select a JPG, PNG, or WebP image.')
                                    event.target.value = ''
                                    return
                                }

                                if (file.size > 2 * 1024 * 1024) {
                                    toast.error('Image must be 2 MB or smaller.')
                                    event.target.value = ''
                                    return
                                }

                                setSelectedAvatar(file)
                            }}
                        />

                        <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={isUploadingAvatar}
                            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Choose image
                        </button>

                        {profile?.avatar_url && !selectedAvatar && (
                            <button
                                type="button"
                                onClick={handleRemoveAvatar}
                                disabled={isUploadingAvatar}
                                className="ml-2 inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Remove picture
                            </button>
                        )}

                        {selectedAvatar && (
                            <button
                                type="button"
                                onClick={handleUploadAvatar}
                                disabled={isUploadingAvatar}
                                className="ml-2 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Save size={16} />
                                {isUploadingAvatar ? 'Uploading...' : 'Upload picture'}
                            </button>
                        )}
                        {selectedAvatar && (
                            <p className="mt-2 text-xs text-slate-400">
                                Selected: {selectedAvatar.name}
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 p-6 md:grid-cols-2">
                    <div>
                        <label
                            htmlFor="full-name"
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Full name
                        </label>

                        <input
                            id="full-name"
                            type="text"
                            value={fullName}
                            onChange={(event) =>
                                setFullName(event.target.value)
                            }
                            disabled={isProfileLoading}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Email address
                        </label>

                        <div className="relative">
                            <Mail
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                            />

                            <input
                                id="email"
                                type="email"
                                value={user?.email || ''}
                                readOnly
                                className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-slate-200 outline-none transition focus:border-violet-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end border-t border-slate-800 px-6 py-4">
                    <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={isSaving || isProfileLoading}
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Save size={17} />
                        {isSaving ? 'Saving...' : 'Save changes'}
                    </button>
                </div>
            </section>

            {/* Default workspace */}
            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
                <div className="border-b border-slate-800 p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
                            <Users size={20} />
                        </div>

                        <div>
                            <h2 className="font-semibold text-white">
                                Default workspace
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Choose which of your existing workspaces
                                Flowspace should open by default.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 p-6">
                    <div>
                        <label
                            htmlFor="default-workspace"
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Choose workspace
                        </label>

                        <select
                            id="default-workspace"
                            value={selectedWorkspaceId}
                            onChange={(event) =>
                                setSelectedWorkspaceId(event.target.value)
                            }
                            disabled={
                                isWorkspaceLoading ||
                                isSavingWorkspace ||
                                workspaces.length === 0
                            }
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none transition focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <option value="">
                                {isWorkspaceLoading
                                    ? 'Loading workspaces...'
                                    : workspaces.length === 0
                                        ? 'No workspaces available'
                                        : 'Select a workspace'}
                            </option>

                            {workspaces.map((workspace) => (
                                <option
                                    key={workspace.id}
                                    value={workspace.id}
                                >
                                    {workspace.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs leading-5 text-slate-500">
                            Your selection is saved to your account and
                            can be used across devices.
                        </p>

                        <button
                            type="button"
                            onClick={handleSaveDefaultWorkspace}
                            disabled={
                                isWorkspaceLoading ||
                                isSavingWorkspace ||
                                !selectedWorkspaceId ||
                                selectedWorkspaceId === defaultWorkspaceId
                            }
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save size={17} />
                            {isSavingWorkspace
                                ? 'Saving...'
                                : 'Save default workspace'}
                        </button>
                    </div>
                </div>
            </section>

            {/* Notifications */}
            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
                <div className="border-b border-slate-800 p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                            <Bell size={20} />
                        </div>

                        <div>
                            <h2 className="font-semibold text-white">
                                Notifications
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Choose which activity you want to be notified
                                about.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="divide-y divide-slate-800">
                    <label className="flex cursor-pointer items-center justify-between gap-6 p-6 transition hover:bg-slate-800/20">
                        <div>
                            <p className="text-sm font-medium text-slate-200">
                                Task assignments
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                Get notified when someone assigns a task to you.
                            </p>
                        </div>

                        <input
                            type="checkbox"
                            checked={notificationPreferences.task_assignments}
                            onChange={(event) =>
                                handleNotificationChange(
                                    'task_assignments',
                                    event.target.checked,
                                )
                            }
                            disabled={isLoadingNotifications || isSavingNotifications}
                            className="h-4 w-4 accent-violet-600"
                        />
                    </label>

                    <label className="flex cursor-pointer items-center justify-between gap-6 p-6 transition hover:bg-slate-800/20">
                        <div>
                            <p className="text-sm font-medium text-slate-200">
                                Project activity
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                Get updates about activity in your projects.
                            </p>
                        </div>

                        <input
                            type="checkbox"
                            checked={notificationPreferences.project_activity}
                            onChange={(event) =>
                                handleNotificationChange(
                                    'project_activity',
                                    event.target.checked,
                                )
                            }
                            disabled={isLoadingNotifications || isSavingNotifications}
                            className="h-4 w-4 accent-violet-600"
                        />
                    </label>

                    <label className="flex cursor-pointer items-center justify-between gap-6 p-6 transition hover:bg-slate-800/20">
                        <div>
                            <p className="text-sm font-medium text-slate-200">
                                Weekly summary
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                Receive a weekly overview of your workspace.
                            </p>
                        </div>

                        <input
                            type="checkbox"
                            checked={notificationPreferences.weekly_summary}
                            onChange={(event) =>
                                handleNotificationChange(
                                    'weekly_summary',
                                    event.target.checked,
                                )
                            }
                            disabled={isLoadingNotifications || isSavingNotifications}
                            className="h-4 w-4 accent-violet-600"
                        />
                    </label>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-slate-800 px-6 py-4">
                    <p className="text-xs text-slate-500">
                        {isLoadingNotifications
                            ? 'Loading your preferences...'
                            : 'Your preferences are saved to your account.'}
                    </p>

                    <button
                        type="button"
                        onClick={handleSaveNotifications}
                        disabled={
                            isLoadingNotifications ||
                            isSavingNotifications ||
                            !user
                        }
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Save size={17} />
                        {isSavingNotifications
                            ? 'Saving...'
                            : 'Save notification preferences'}
                    </button>
                </div>
            </section>

            {/* Security */}
            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
                <div className="border-b border-slate-800 p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
                            <Shield size={20} />
                        </div>

                        <div>
                            <h2 className="font-semibold text-white">
                                Security
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Keep your account secure.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {showPasswordForm && (
                        <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                            <h3 className="font-medium text-white">
                                Change your password
                            </h3>

                            <p className="mt-1 text-sm text-slate-400">
                                Choose a new password for your account.
                            </p>

                            <div className="mt-5 space-y-4">
                                <div>
                                    <label
                                        htmlFor="new-password"
                                        className="mb-2 block text-sm font-medium text-slate-300"
                                    >
                                        New password
                                    </label>

                                    <input
                                        id="new-password"
                                        type="password"
                                        value={newPassword}
                                        onChange={(event) =>
                                            setNewPassword(event.target.value)
                                        }
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
                                        placeholder="Enter your new password"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="confirm-password"
                                        className="mb-2 block text-sm font-medium text-slate-300"
                                    >
                                        Confirm new password
                                    </label>

                                    <input
                                        id="confirm-password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(event) =>
                                            setConfirmPassword(event.target.value)
                                        }
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
                                        placeholder="Re-enter your new password"
                                    />


                                </div>

                                <p className="text-xs text-slate-500">
                                    Use at least 8 characters.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={handleChangePassword}
                                disabled={isSavingPassword}
                                className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSavingPassword ? 'Updating password...' : 'Update password'}
                            </button>
                        </div>
                    )}
                    <div className="flex flex-col justify-between gap-5 rounded-xl border border-slate-800 bg-slate-950/60 p-5 sm:flex-row sm:items-center">
                        <div className="flex items-start gap-4">
                            <div className="rounded-lg bg-slate-800 p-2.5 text-slate-400">
                                <Lock size={18} />
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-slate-200">
                                    Password
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Manage your account password.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowPasswordForm((current) => !current)}
                            className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                        >
                            {showPasswordForm ? 'Cancel' : 'Change password'}
                        </button>
                    </div>
                </div>
            </section>

            {/* Account status */}
            <div className="flex items-center justify-center gap-2 pb-4 text-xs text-slate-500">
                <Check size={14} className="text-emerald-400" />
                Your account settings are available.
            </div>
        </div>
    )
}

export default SettingsPage
