
import {
    FolderKanban,
    CheckCircle2,
    Clock3,
    ListTodo,
    ArrowUpRight,
    Plus,
    CalendarDays,
    MoreHorizontal,
    Pencil,
    Trash2,
} from 'lucide-react'

import { toast } from 'sonner'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { useAuth } from '../contexts/AuthContext'
import CreateWorkspaceModal from '../components/CreateWorkspaceModal'
import CreateProjectModal from '../components/CreateProjectModal'
import EditProjectModal from '../components/EditProjectModal'
import DeleteProjectDialog from '../components/DeleteProjectDialog'

import EditWorkspaceModal from '../components/EditWorkspaceModal'
import DeleteWorkspaceDialog from '../components/DeleteWorkspaceDialog'

import { useNavigate } from 'react-router-dom'

import { useEffect, useState } from 'react'

import {
    getProjects,
    createProject,
    updateProject,
    deleteProject,
} from '../services/projectService'

import { getProjectStatus } from '../lib/projectUtils'
import {
    getTasks,
    updateTaskStatus
} from '../services/taskService'



const DashboardPage = () => {
    const { profile, user } = useAuth()
    const navigate = useNavigate()



    const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false)
    const [editingWorkspace, setEditingWorkspace] = useState(null)
    const [deletingWorkspace, setDeletingWorkspace] = useState(null)
    const [isUpdatingWorkspace, setIsUpdatingWorkspace] = useState(false)
    const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false)
    const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false)

    const {
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        currentWorkspace,
        isCreating,
    } = useWorkspace()

    const [projects, setProjects] = useState([])
    const [isProjectsLoading, setIsProjectsLoading] = useState(false)
    const [projectsError, setProjectsError] = useState('')
    const [isCreatingProject, setIsCreatingProject] = useState(false)
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
    const [openProjectMenuId, setOpenProjectMenuId] = useState(null)
    const [editingProject, setEditingProject] = useState(null)
    const [isUpdatingProject, setIsUpdatingProject] = useState(false)
    const [deletingProject, setDeletingProject] = useState(null)
    const [isDeletingProject, setIsDeletingProject] = useState(false)
    const [tasks, setTasks] = useState([])
    const [isTasksLoading, setIsTasksLoading] = useState(false)

    const handleCreateProject = async (projectData) => {
        if (!currentWorkspace?.id) {
            toast.error('Please select a workspace first.')
            return false
        }

        setIsCreatingProject(true)

        try {
            const newProject = await createProject(
                currentWorkspace.id,
                projectData,
            )

            setProjects((currentProjects) => [
                newProject,
                ...currentProjects,
            ])

            toast.success('Project created successfully!')

            setIsProjectModalOpen(false)

            return true
        } catch (error) {
            console.error('Failed to create project:', error.message)

            toast.error(
                error.message || 'Failed to create project. Please try again.',
            )

            return false
        } finally {
            setIsCreatingProject(false)
        }
    }


    const handleUpdateProject = async (projectId, projectData) => {

        if (!currentWorkspace?.id) {
            toast.error('Please select a workspace first.')
            return false
        }

        const projectToUpdate = projects.find(
            (project) => project.id === projectId
        )

        if (
            !projectToUpdate ||
            projectToUpdate.workspace_id !== currentWorkspace.id
        ) {
            toast.error(
                'This project does not belong to the selected workspace.'
            )
            return false
        }


        const normalizedProjectData = {
            ...projectData,

            progress:
                projectData.status === 'completed'
                    ? 100
                    : projectData.progress,

        }

        setIsUpdatingProject(true)

        try {
            const updatedProject = await updateProject(
                projectId,
                normalizedProjectData
            )

            // Update the project card without reloading the page.
            setProjects((currentProjects) =>
                currentProjects.map((project) =>
                    project.id === updatedProject.id
                        ? updatedProject
                        : project
                )
            )

            toast.success('Project updated successfully!')
            setEditingProject(null)
            return true
        } catch (error) {
            console.error('Failed to update project:', error.message)
            toast.error(
                error.message || 'Failed to update project. Please try again.'
            )
            return false
        } finally {
            setIsUpdatingProject(false)
        }
    }


    const handleDeleteProject = async () => {
        if (!deletingProject || isDeletingProject) return

        if (
            !currentWorkspace?.id ||
            deletingProject.workspace_id !== currentWorkspace.id
        ) {
            toast.error(
                'This project does not belong to the selected workspace.'
            )
            setDeletingProject(null)
            return
        }

        setIsDeletingProject(true)

        try {
            await deleteProject(deletingProject.id)

            setProjects((currentProjects) =>
                currentProjects.filter(
                    (project) => project.id !== deletingProject.id
                )
            )

            toast.success('Project deleted successfully!')
            setDeletingProject(null)
        } catch (error) {
            console.error('Failed to delete project:', error.message)

            toast.error(
                error.message ||
                'Failed to delete project. Please try again.'
            )
        } finally {
            setIsDeletingProject(false)
        }
    }

    const handleCompleteTask = async (task) => {
        if (!task?.id || task.status === 'completed') return

        try {
            const updatedTask = await updateTaskStatus(
                task.id,
                'completed',
            )

            setTasks((currentTasks) =>
                currentTasks.map((currentTask) =>
                    currentTask.id === updatedTask.id
                        ? {
                            ...currentTask,
                            status: updatedTask.status,
                        }
                        : currentTask,
                ),
            )

            toast.success('Task completed!')
        } catch (error) {
            toast.error(
                error.message || 'Failed to complete task.',
            )
        }
    }


    useEffect(() => {
        let isActive = true

        const loadProjects = async () => {
            if (!currentWorkspace?.id) {
                setProjects([])
                setIsProjectsLoading(false)
                setProjectsError('')
                return
            }

            setIsProjectsLoading(true)
            setProjectsError('')

            try {
                const data = await getProjects(currentWorkspace.id)

                if (isActive) {
                    setProjects(data)
                }
            } catch (error) {
                if (isActive) {
                    setProjects([])
                    setProjectsError(
                        error.message || 'Failed to load projects.',
                    )
                }
            } finally {
                if (isActive) {
                    setIsProjectsLoading(false)
                }
            }
        }

        loadProjects()

        return () => {
            isActive = false
        }
    }, [currentWorkspace?.id])

    useEffect(() => {
        let isActive = true

        const loadTasks = async () => {
            if (!currentWorkspace?.id) {
                setTasks([])
                setIsTasksLoading(false)
                return
            }

            setIsTasksLoading(true)

            try {
                const data = await getTasks(currentWorkspace.id)


                if (isActive) {
                    setTasks(data)
                }
            } catch (error) {
                if (isActive) {
                    setTasks([])
                    toast.error(error.message || 'Failed to load tasks.')
                }
            } finally {
                if (isActive) {
                    setIsTasksLoading(false)
                }
            }
        }

        loadTasks()

        return () => {
            isActive = false
        }
    }, [currentWorkspace?.id])


    const handleUpdateWorkspace = async (workspaceId, workspaceData) => {
        if (isUpdatingWorkspace) return

        setIsUpdatingWorkspace(true)

        try {
            await updateWorkspace(workspaceId, workspaceData)

            toast.success('Workspace updated successfully!')
            setEditingWorkspace(null)
        } catch (error) {
            console.error('Failed to update workspace:', error)
            toast.error(error.message || 'Failed to update workspace.')
        } finally {
            setIsUpdatingWorkspace(false)
        }
    }

    const handleDeleteWorkspace = async () => {
        if (!deletingWorkspace || isDeletingWorkspace) return

        setIsDeletingWorkspace(true)

        try {
            await deleteWorkspace(deletingWorkspace.id)

            toast.success('Workspace deleted successfully!')
            setDeletingWorkspace(null)
        } catch (error) {
            console.error('Failed to delete workspace:', error)
            toast.error(error.message || 'Failed to delete workspace.')
        } finally {
            setIsDeletingWorkspace(false)
        }
    }


    const completedTasksCount = tasks.filter(
        (task) => task.status === 'completed',
    ).length

    const inProgressTasksCount = tasks.filter(
        (task) => task.status === 'in_progress',
    ).length

    const pendingTasksCount = tasks.filter(
        (task) => task.status === 'todo',
    ).length

    const stats = [
        {
            label: 'Total Projects',
            value: isProjectsLoading ? '...' : projects.length,
            change: 'In this workspace',
            icon: FolderKanban,
            iconStyle: 'bg-violet-500/15 text-violet-400',
        },
        {
            label: 'Completed Tasks',
            value: isTasksLoading ? '...' : completedTasksCount,
            change: 'Tasks marked complete',
            icon: CheckCircle2,
            iconStyle: 'bg-emerald-500/15 text-emerald-400',
        },
        {
            label: 'In Progress Tasks',
            value: isTasksLoading ? '...' : inProgressTasksCount,
            change: 'Currently in progress',
            icon: Clock3,
            iconStyle: 'bg-amber-500/15 text-amber-400',
        },
        {
            label: 'Pending Tasks',
            value: isTasksLoading ? '...' : pendingTasksCount,
            change: 'Not yet completed',
            icon: ListTodo,
            iconStyle: 'bg-sky-500/15 text-sky-400',
        },
    ]

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })

    const today = new Date()

    const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
    ].join('-')

    const upcomingTasks = tasks
        .filter(
            (task) =>
                task.status !== 'completed' &&
                task.due_date &&
                task.due_date >= todayString,
        )
        .sort((a, b) => a.due_date.localeCompare(b.due_date))
        .slice(0, 3)
        .map((task) => ({
            ...task,
            project: task.projects?.name || 'Unknown project',
            date:
                task.due_date === todayString
                    ? 'Today'
                    : new Date(`${task.due_date}T00:00:00`).toLocaleDateString(
                        'en-US',
                        {
                            month: 'short',
                            day: 'numeric',
                        },
                    ),
            priorityStyle:
                task.priority === 'high'
                    ? 'text-rose-400'
                    : task.priority === 'medium'
                        ? 'text-amber-400'
                        : 'text-emerald-400',
        }))

    const currentHour = new Date().getHours()

    const greeting =
        currentHour < 12
            ? 'Good morning'
            : currentHour < 18
                ? 'Good afternoon'
                : 'Good evening'

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            {/* Page heading */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <p className="text-sm text-slate-400">
                        {currentDate}
                    </p>

                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                        {greeting}, {profile?.full_name || 'there'}
                    </h1>

                    <p className="mt-2 text-sm text-slate-400">
                        {currentWorkspace
                            ? `You're working in ${currentWorkspace.name}.`
                            : 'Select a workspace to get started.'}
                    </p>

                    {currentWorkspace?.owner_id === user?.id && (
                        <div className="relative mt-3 w-fit">
                            <button
                                type="button"
                                aria-label="Workspace actions"
                                aria-expanded={isWorkspaceMenuOpen}
                                onClick={() =>
                                    setIsWorkspaceMenuOpen((isOpen) => !isOpen)
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                            >
                                <MoreHorizontal size={18} />
                                Workspace options
                            </button>

                            {isWorkspaceMenuOpen && (
                                <div className="absolute left-0 top-full z-20 mt-2 w-48 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-xl">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingWorkspace(currentWorkspace)
                                            setIsWorkspaceMenuOpen(false)
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                                    >
                                        <Pencil size={16} />
                                        Edit workspace
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDeletingWorkspace(currentWorkspace)
                                            setIsWorkspaceMenuOpen(false)
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-400 transition hover:bg-rose-500/10"
                                    >
                                        <Trash2 size={16} />
                                        Delete workspace
                                    </button>
                                </div>
                            )}
                        </div>
                    )}


                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => setIsWorkspaceModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                    >
                        <Plus size={18} />
                        Create Workspace
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsProjectModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
                    >
                        <Plus size={18} />
                        Create Project
                    </button>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon

                    return (
                        <div
                            key={stat.label}
                            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-400">
                                    {stat.label}
                                </p>

                                <div
                                    className={`rounded-xl p-2.5 ${stat.iconStyle}`}
                                >
                                    <Icon size={20} />
                                </div>
                            </div>

                            <p className="mt-5 text-3xl font-bold tracking-tight text-white">
                                {stat.value}
                            </p>

                            <p className="mt-2 text-xs text-slate-500">
                                {stat.change}
                            </p>
                        </div>
                    )
                })}
            </div>

            {/* Projects and tasks */}
            <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                {/* Recent projects */}
                <section className="rounded-2xl border border-slate-800 bg-slate-900/60">
                    <div className="flex items-center justify-between border-b border-slate-800 p-5">
                        <div>
                            <h2 className="font-semibold text-white">
                                Recent Projects
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                Track progress across your workspace.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => navigate('/projects')}
                            className="flex items-center gap-1 text-sm font-medium text-violet-400 transition hover:text-violet-300 cursor-pointer"
                        >
                            View all
                            <ArrowUpRight size={16} />
                        </button>
                    </div>

                    <div className="divide-y divide-slate-800">


                        {isProjectsLoading ? (
                            <div className="p-8 text-center text-sm text-slate-400">
                                Loading projects...
                            </div>
                        ) : projectsError ? (
                            <div className="p-8 text-center">
                                <p className="text-sm text-rose-400">
                                    {projectsError}
                                </p>
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="p-8 text-center">
                                <h3 className="font-medium text-slate-200">
                                    No projects yet
                                </h3>
                                <p className="mt-2 text-sm text-slate-400">
                                    Create your first project to get started in this workspace.
                                </p>
                            </div>
                        ) : (
                            projects.map((project) => {
                                const status = getProjectStatus(project.status)

                                return (
                                    <div
                                        key={project.id}
                                        className="relative p-5 transition hover:bg-slate-800/30"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                                            <div className="flex min-w-0 flex-1 items-start gap-3">
                                                <div
                                                    className={`mt-1 h-10 w-1.5 shrink-0 rounded-full ${project.status === 'completed'
                                                        ? 'bg-emerald-500'
                                                        : project.status === 'in_progress'
                                                            ? 'bg-sky-500'
                                                            : 'bg-violet-500'
                                                        }`}
                                                />

                                                <div className="min-w-0 flex-1">
                                                    <h3 className="font-medium text-slate-100">
                                                        {project.name}
                                                    </h3>

                                                    <p className="mt-1 text-sm text-slate-400">
                                                        {project.description ||
                                                            'No description provided.'}
                                                    </p>




                                                </div>

                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${status.style}`}
                                                >
                                                    {status.label}
                                                </span>

                                                <button
                                                    type="button"
                                                    aria-label={`Project actions for ${project.name}`}
                                                    onClick={() =>
                                                        setOpenProjectMenuId((currentId) =>
                                                            currentId === project.id ? null : project.id,
                                                        )
                                                    }
                                                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>

                                                {openProjectMenuId === project.id && (
                                                    <div className="absolute right-5 top-14 z-10 w-40 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-xl">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setEditingProject(project)
                                                                setOpenProjectMenuId(null)
                                                            }}
                                                            className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                                                        >
                                                            Edit project
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setDeletingProject(project)
                                                                setOpenProjectMenuId(null)
                                                            }}
                                                            className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-400 transition hover:bg-rose-500/10"
                                                        >
                                                            Delete project
                                                        </button>
                                                    </div>
                                                )}

                                            </div>
                                        </div>

                                        <div className="mt-4 w-full">
                                            <div className="mb-2 flex items-center justify-between">
                                                <span className="text-xs font-medium text-slate-400">
                                                    Progress
                                                </span>

                                                <span className="text-xs font-semibold text-slate-300">
                                                    {project.progress ?? 0}%
                                                </span>
                                            </div>

                                            <div
                                                role="progressbar"
                                                aria-label={`${project.name} progress`}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                                aria-valuenow={project.progress ?? 0}
                                                className="h-2 overflow-hidden rounded-full bg-slate-800"
                                            >
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${project.status === 'completed'
                                                        ? 'bg-emerald-500'
                                                        : project.status === 'in_progress'
                                                            ? 'bg-sky-500'
                                                            : 'bg-violet-500'
                                                        }`}
                                                    style={{
                                                        width: `${Math.min(100, Math.max(0, project.progress ?? 0))}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}


                    </div>
                </section>

                {/* Upcoming tasks */}
                <section className="rounded-2xl border border-slate-800 bg-slate-900/60">
                    <div className="flex items-center justify-between border-b border-slate-800 p-5">
                        <div>
                            <h2 className="font-semibold text-white">
                                Upcoming Tasks
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                Your next priorities.
                            </p>
                        </div>

                        <button
                            type="button"
                            aria-label="More task options"
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                        >
                            <MoreHorizontal size={20} />
                        </button>
                    </div>

                    <div className="divide-y divide-slate-800">
                        {isTasksLoading ? (
                            <div className="p-8 text-center text-sm text-slate-400">
                                Loading upcoming tasks...
                            </div>
                        ) : upcomingTasks.length === 0 ? (
                            <div className="p-8 text-center">
                                <h3 className="font-medium text-slate-200">
                                    No upcoming tasks
                                </h3>

                                <p className="mt-2 text-sm text-slate-400">
                                    Tasks due today or later will appear here.
                                </p>
                            </div>
                        ) : (
                            upcomingTasks.map((task) => (
                                <div
                                    key={task.title}
                                    className="p-5 transition hover:bg-slate-800/30"
                                >
                                    <div className="flex items-start gap-3">
                                        <button
                                            type="button"
                                            onClick={() => handleCompleteTask(task)}
                                            aria-label={`Complete ${task.title}`}
                                            className="mt-0.5 rounded-full text-slate-500 transition hover:text-violet-400"
                                        >
                                            <CheckCircle2 size={20} />
                                        </button>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-medium text-slate-200">
                                                {task.title}
                                            </h3>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {task.project}
                                            </p>

                                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                                                    <CalendarDays size={14} />
                                                    {task.date}
                                                </span>

                                                <span
                                                    className={`text-xs font-medium ${task.priorityStyle}`}
                                                >
                                                    {task.priority} priority
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="border-t border-slate-800 p-4">
                        <button
                            type="button"
                            onClick={() => navigate('/my-tasks')}
                            className="w-full rounded-lg border cursor-pointer border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800"
                        >
                            View all tasks
                        </button>
                    </div>
                </section>
            </div>



            <CreateWorkspaceModal
                isOpen={isWorkspaceModalOpen}
                onClose={() => setIsWorkspaceModalOpen(false)}
                isCreating={isCreating}
                onCreate={async (workspaceData) => {
                    try {
                        await createWorkspace(workspaceData)

                        toast.success('Workspace created successfully!')
                        setIsWorkspaceModalOpen(false)
                    } catch (error) {
                        console.error('Failed to create workspace:', error.message)
                        toast.error(
                            error.message || 'Failed to create workspace. Please try again.',
                        )
                    }
                }}
            />


            <EditWorkspaceModal
                isOpen={Boolean(editingWorkspace)}
                workspace={editingWorkspace}
                onClose={() => setEditingWorkspace(null)}
                onUpdate={handleUpdateWorkspace}
                isUpdating={isUpdatingWorkspace}
            />

            <DeleteWorkspaceDialog
                isOpen={Boolean(deletingWorkspace)}
                workspace={deletingWorkspace}
                onClose={() => setDeletingWorkspace(null)}
                onConfirm={handleDeleteWorkspace}
                isDeleting={isDeletingWorkspace}
            />

            <CreateProjectModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                onCreate={handleCreateProject}
                isCreating={isCreatingProject}
            />


            <EditProjectModal
                isOpen={Boolean(editingProject)}
                project={editingProject}
                onClose={() => setEditingProject(null)}
                onUpdate={handleUpdateProject}
                isUpdating={isUpdatingProject}
            />

            <DeleteProjectDialog
                isOpen={Boolean(deletingProject)}
                project={deletingProject}
                onClose={() => setDeletingProject(null)}
                onConfirm={handleDeleteProject}
                isDeleting={isDeletingProject}
            />




        </div>


    )
}

export default DashboardPage
