import { useState, useEffect, useRef, useCallback } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import CreateWorkspaceModal from '../components/CreateWorkspaceModal'
import { useWorkspace } from '../contexts/WorkspaceContext'

import { getProjects } from '../services/projectService'
import { getTasks } from '../services/taskService'

import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from '../services/notificationService'

import { toast } from 'sonner'

import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    Settings,
    Search,
    Bell,
    Plus,
    Command,
    LogOut,
    ChevronDown,

} from 'lucide-react'

const navigationItems = [
    {
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        label: 'Projects',
        path: '/projects',
        icon: FolderKanban,
    },
    {
        label: 'My Tasks',
        path: '/my-tasks',
        icon: CheckSquare,
    },
]

const AppLayout = () => {

    const navigate = useNavigate()
    const { user, profile, isProfileLoading } = useAuth()

    const {
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
        isLoading: isWorkspaceLoading,
        createWorkspace,
        isCreating,
    } = useWorkspace()

    const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false)
    const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false)

    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState({
        projects: [],
        tasks: [],
    })
    const [isSearching, setIsSearching] = useState(false)

    const [notifications, setNotifications] = useState([])
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)

    const notificationRef = useRef(null)


    const fetchNotifications = useCallback(async () => {
        setIsLoadingNotifications(true)

        try {
            const data = await getNotifications()
            setNotifications(data)
        } catch (error) {
            console.error('Failed to load notifications:', error)
            toast.error('Failed to load notifications.')
        } finally {
            setIsLoadingNotifications(false)
        }
    }, [])

    useEffect(() => {

        if (!user?.id) return

        const channel = supabase
            .channel('notifications-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    setNotifications((currentNotifications) => [
                        payload.new,
                        ...currentNotifications,
                    ])
                },
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user?.id])


    useEffect(() => {
        const query = searchQuery.trim()

        if (!query || !currentWorkspace?.id) {
            setSearchResults({
                projects: [],
                tasks: [],
            })
            setIsSearching(false)
            return
        }

        let isActive = true

        const searchWorkspace = async () => {
            setIsSearching(true)

            try {
                const [projects, tasks] = await Promise.all([
                    getProjects(currentWorkspace.id),
                    getTasks(currentWorkspace.id),
                ])

                if (!isActive) return

                const normalizedQuery = query.toLowerCase()

                setSearchResults({
                    projects: projects
                        .filter((project) =>
                            project.name?.toLowerCase().includes(normalizedQuery),
                        )
                        .slice(0, 5),

                    tasks: tasks
                        .filter((task) =>
                            task.title?.toLowerCase().includes(normalizedQuery),
                        )
                        .slice(0, 5),
                })
            } catch (error) {
                if (!isActive) return

                console.error('Search failed:', error)
                setSearchResults({
                    projects: [],
                    tasks: [],
                })
            } finally {
                if (isActive) {
                    setIsSearching(false)
                }
            }
        }

        searchWorkspace()

        return () => {
            isActive = false
        }
    }, [searchQuery, currentWorkspace?.id])


    useEffect(() => {
        if (!isNotificationsOpen) return

        const handleClickOutside = (event) => {
            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target)
            ) {
                setIsNotificationsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isNotificationsOpen])


    const handleSignOut = async () => {
        try {
            const { error } = await supabase.auth.signOut()

            if (error) {
                throw error
            }

            toast.success('Signed out successfully!')
            navigate('/auth', { replace: true })
        } catch (error) {
            console.error('Failed to sign out:', error.message)
            toast.error('Failed to sign out. Please try again.')
        }
    }


    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 md:flex">
            {/* Sidebar */}
            <aside className="flex w-full shrink-0 flex-col border-b border-slate-800 bg-slate-900 md:min-h-screen md:w-64 md:border-r md:border-b-0">
                {/* Brand */}
                <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600">
                        <Command size={21} />
                    </div>

                    <div>
                        <h1 className="font-bold tracking-tight">
                            Flowspace
                        </h1>
                        <p className="text-xs text-slate-500">
                            Project workspace
                        </p>
                    </div>
                </div>

                {/* Workspace selector */}
                <div className="p-4">
                    <button
                        type="button"
                        onClick={() => setIsWorkspaceMenuOpen((isOpen) => !isOpen)}
                        aria-expanded={isWorkspaceMenuOpen}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-left transition hover:border-slate-700"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 text-sm font-bold text-cyan-300">
                            FS
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                                {isWorkspaceLoading
                                    ? 'Loading workspace...'
                                    : currentWorkspace?.name || 'No workspace yet'}
                            </p>
                            <p className="text-xs text-slate-500">
                                Free workspace
                            </p>
                        </div>

                        <ChevronDown
                            size={16}
                            className={`shrink-0 text-slate-400 transition-transform duration-200 ${isWorkspaceMenuOpen ? 'rotate-180' : ''
                                }`}
                        />

                    </button>

                    {isWorkspaceMenuOpen && (
                        <div className="mt-2 rounded-xl border border-slate-800/80 bg-slate-900/95 p-2 shadow-lg shadow-black/20">
                            {workspaces.map((workspace) => (
                                <button
                                    key={workspace.id}
                                    type="button"
                                    onClick={() => {
                                        setCurrentWorkspace(workspace)
                                        setIsWorkspaceMenuOpen(false)
                                    }}
                                    className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-sm transition ${currentWorkspace?.id === workspace.id
                                        ? 'bg-violet-500/15 text-violet-300'
                                        : 'text-slate-300 hover:bg-slate-800/50'
                                        }`}
                                >
                                    <span className="min-w-0 flex-1 truncate">
                                        {workspace.name}
                                    </span>

                                    {currentWorkspace?.id === workspace.id && (
                                        <span className="ml-3 shrink-0 rounded-md bg-violet-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-violet-300">
                                            Current
                                        </span>
                                    )}
                                </button>
                            ))}

                            {workspaces.length === 0 && (
                                <p className="px-3 py-2 text-sm text-slate-400">
                                    No workspaces available.
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setIsWorkspaceMenuOpen(false)
                                    setIsCreateWorkspaceModalOpen(true)
                                }}
                                className="mt-2 flex w-full items-center gap-2 border-t border-slate-800 px-3 pt-3 pb-2 text-left text-sm font-medium text-violet-300 transition hover:text-violet-200"
                            >
                                <Plus size={16} />
                                Create workspace
                            </button>
                        </div>
                    )}

                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 px-3 pb-4">
                    <p className="px-3 pb-2 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Workspace
                    </p>

                    {navigationItems.map((item) => {
                        const Icon = item.icon

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive
                                        ? 'bg-violet-500/15 text-violet-300'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`
                                }
                            >
                                <Icon size={18} />
                                {item.label}
                            </NavLink>
                        )
                    })}

                    <div className="pt-5">
                        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Preferences
                        </p>

                        <NavLink
                            to="/settings"
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive
                                    ? 'bg-violet-500/15 text-violet-300'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`
                            }
                        >
                            <Settings size={18} />
                            Settings
                        </NavLink>
                    </div>
                </nav>

                {/* User profile */}

                <div className="flex items-center gap-3 border-t border-slate-800 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-500/15 text-sm font-semibold text-violet-300">
                        {profile?.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="Profile avatar"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            (profile?.full_name ||
                                user?.user_metadata?.full_name ||
                                user?.email ||
                                'U')
                                .charAt(0)
                                .toUpperCase()
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-200">
                            {isProfileLoading
                                ? 'Loading profile...'
                                : profile?.full_name ||
                                user?.user_metadata?.full_name ||
                                user?.email ||
                                'User'}
                        </p>

                        <p className="truncate text-xs text-slate-500">
                            {user?.email || 'Signed in'}
                        </p>
                    </div>
                </div>


            </aside>

            {/* Main application area */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Top navigation */}

                <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-800 bg-slate-950 px-8 sm:px-10 lg:px-14">
                    <div className="hidden min-w-0 items-center gap-2 text-sm text-slate-500 sm:flex">
                        <span className="shrink-0">Workspace</span>
                        <span>/</span>
                        <span className="truncate font-medium text-slate-200">
                            {currentWorkspace?.name || 'No workspace yet'}
                        </span>
                    </div>

                    <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
                        {/* Search bar */}
                        <div className="relative flex w-full min-w-0 max-w-sm items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 transition focus-within:border-violet-500/60">
                            <Search
                                size={17}
                                className="shrink-0 text-slate-400"
                            />

                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search projects and tasks..."
                                aria-label="Search projects and tasks"
                                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                            />

                            <kbd className="hidden shrink-0 rounded border border-slate-700 px-1.5 py-0.5 text-xs text-slate-500 sm:inline">
                                /
                            </kbd>


                            {(searchQuery.trim() || isSearching) && (
                                <div className="absolute left-0 top-full z-50 mt-2 w-full min-w-72 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-xl">
                                    {isSearching ? (
                                        <p className="px-4 py-3 text-sm text-slate-400">
                                            Searching...
                                        </p>
                                    ) : (
                                        <>
                                            {searchResults.projects.length > 0 && (
                                                <div className="p-2">
                                                    <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Projects
                                                    </p>

                                                    {searchResults.projects.map((project) => (
                                                        <button
                                                            key={project.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSearchQuery('')
                                                                navigate('/projects', {
                                                                    state: { selectedProjectId: project.id },
                                                                })
                                                            }}
                                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800"
                                                        >
                                                            <FolderKanban
                                                                size={16}
                                                                className="shrink-0 text-violet-400"
                                                            />
                                                            <span className="truncate">
                                                                {project.name}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {searchResults.tasks.length > 0 && (
                                                <div className="border-t border-slate-800 p-2">
                                                    <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                                        Tasks
                                                    </p>

                                                    {searchResults.tasks.map((task) => (
                                                        <button
                                                            key={task.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSearchQuery('')
                                                                navigate('/my-tasks', {
                                                                    state: { selectedTaskId: task.id },
                                                                })
                                                            }}
                                                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-slate-800"
                                                        >
                                                            <CheckSquare
                                                                size={16}
                                                                className="shrink-0 text-violet-400"
                                                            />

                                                            <div className="min-w-0">
                                                                <p className="truncate">
                                                                    {task.title}
                                                                </p>
                                                                <p className="truncate text-xs text-slate-500">
                                                                    {task.projects?.name || 'No project'}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {!searchResults.projects.length &&
                                                !searchResults.tasks.length && (
                                                    <p className="px-4 py-3 text-sm text-slate-400">
                                                        No matching projects or tasks found.
                                                    </p>
                                                )}
                                        </>
                                    )}
                                </div>
                            )}

                        </div>

                        {/* Notifications */}

                        <div ref={notificationRef} className="relative">
                            <button
                                type="button"
                                aria-label="Notifications"
                                aria-expanded={isNotificationsOpen}
                                onClick={() => {
                                    const shouldOpen = !isNotificationsOpen
                                    setIsNotificationsOpen(shouldOpen)

                                    if (shouldOpen) {
                                        fetchNotifications()
                                    }
                                }}
                                className="relative shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                            >
                                <Bell size={19} />

                                {notifications.some((notification) => !notification.is_read) && (
                                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-violet-500" />
                                )}
                            </button>

                            {isNotificationsOpen && (
                                <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-xl">
                                    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                                        <h3 className="text-sm font-semibold text-white">
                                            Notifications
                                        </h3>

                                        {notifications.some((notification) => !notification.is_read) && (
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    try {
                                                        await markAllNotificationsAsRead()

                                                        setNotifications((current) =>
                                                            current.map((notification) => ({
                                                                ...notification,
                                                                is_read: true,
                                                            })),
                                                        )

                                                        toast.success('All notifications marked as read.')
                                                    } catch (error) {
                                                        console.error(error)
                                                        toast.error('Failed to update notifications.')
                                                    }
                                                }}
                                                className="text-xs text-violet-400 transition hover:text-violet-300"
                                            >
                                                Mark all as read
                                            </button>
                                        )}
                                    </div>

                                    {isLoadingNotifications ? (
                                        <p className="px-4 py-6 text-center text-sm text-slate-400">
                                            Loading notifications...
                                        </p>
                                    ) : notifications.length === 0 ? (
                                        <p className="px-4 py-6 text-center text-sm text-slate-400">
                                            You're all caught up!
                                        </p>
                                    ) : (
                                        <div className="max-h-96 overflow-y-auto">
                                            {notifications.map((notification) => (
                                                <button
                                                    key={notification.id}
                                                    type="button"
                                                    onClick={async () => {
                                                        if (!notification.is_read) {
                                                            try {
                                                                await markNotificationAsRead(notification.id)

                                                                setNotifications((current) =>
                                                                    current.map((item) =>
                                                                        item.id === notification.id
                                                                            ? { ...item, is_read: true }
                                                                            : item,
                                                                    ),
                                                                )
                                                            } catch (error) {
                                                                console.error(error)
                                                                toast.error('Failed to update notification.')
                                                                return
                                                            }
                                                        }

                                                        if (notification.type === 'project' && notification.record_id) {
                                                            navigate('/projects', {
                                                                state: { selectedProjectId: notification.record_id },
                                                            })
                                                        } else if (notification.type === 'task' && notification.record_id) {
                                                            navigate('/my-tasks', {
                                                                state: { selectedTaskId: notification.record_id },
                                                            })
                                                        } else if (notification.link) {
                                                            navigate(notification.link)
                                                        }

                                                        setIsNotificationsOpen(false)
                                                    }}
                                                    className={`flex w-full items-start gap-3 border-b border-slate-800/70 px-4 py-3 text-left transition hover:bg-slate-800/70 ${notification.is_read ? 'opacity-70' : 'bg-violet-500/5'
                                                        }`}
                                                >
                                                    <span
                                                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.is_read
                                                            ? 'bg-slate-600'
                                                            : 'bg-violet-400'
                                                            }`}
                                                    />

                                                    <span className="min-w-0 flex-1">
                                                        <span className="block text-sm font-medium text-slate-200">
                                                            {notification.title}
                                                        </span>

                                                        {notification.message && (
                                                            <span className="mt-1 block text-xs text-slate-400">
                                                                {notification.message}
                                                            </span>
                                                        )}

                                                        <span className="mt-1 block text-xs text-slate-500">
                                                            {new Date(notification.created_at).toLocaleString()}
                                                        </span>
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>


                        {/* Sign out */}
                        <button
                            type="button"
                            onClick={handleSignOut}
                            className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-400 transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-violet-300"
                        >
                            <LogOut size={17} />
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </header>



                {/* Current page renders here */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>

            <CreateWorkspaceModal
                isOpen={isCreateWorkspaceModalOpen}
                onClose={() => setIsCreateWorkspaceModalOpen(false)}
                isCreating={isCreating}
                onCreate={async (workspaceData) => {
                    try {
                        const workspace = await createWorkspace(workspaceData)

                        setCurrentWorkspace(workspace)
                        toast.success('Workspace created successfully!')
                        setIsCreateWorkspaceModalOpen(false)
                    } catch (error) {
                        console.error('Failed to create workspace:', error.message)
                        toast.error(
                            error.message || 'Failed to create workspace. Please try again.',
                        )
                    }
                }}

            />

        </div>
    )
}

export default AppLayout
