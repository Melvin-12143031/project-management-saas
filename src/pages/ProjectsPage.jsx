import {
    CalendarDays,
    FolderKanban,
    MoreHorizontal,
    Plus,
    Search,
    Users,
} from 'lucide-react'

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useWorkspace } from '../contexts/WorkspaceContext'
import {
    createProject,
    getProjects,
    updateProject,
    deleteProject
} from '../services/projectService'

import EditProjectModal from '../components/EditProjectModal'
import CreateProjectModal from '../components/CreateProjectModal'
import { createNotification } from '../services/notificationService'
import { useAuth } from '../contexts/AuthContext'

const ProjectsPage = () => {

    const { user } = useAuth()
    const { currentWorkspace } = useWorkspace()
    const location = useLocation()
    const navigate = useNavigate()

    const [projects, setProjects] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)
    const [isCreatingProject, setIsCreatingProject] = useState(false)
    const [openMenuId, setOpenMenuId] = useState(null)
    const [editingProject, setEditingProject] = useState(null)
    const [isSaving, setIsSaving] = useState(false)
    const [deletingProject, setDeletingProject] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')


    const filteredProjects = projects.filter((project) => {
        const matchesSearch = project.name
            ?.toLowerCase()
            .includes(searchQuery.trim().toLowerCase())

        const matchesStatus =
            statusFilter === 'all' || project.status === statusFilter

        return matchesSearch && matchesStatus
    })

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

            try {
                await createNotification({
                    userId: user.id,
                    workspaceId: currentWorkspace.id,
                    title: 'Project created',
                    message: `Your project "${newProject.name}" was created successfully.`,
                    type: 'project',
                    link: '/projects',
                    recordId: newProject.id,
                })
            } catch (notificationError) {
                console.error(
                    'Failed to create notification:',
                    notificationError.message,
                )
            }

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
        if (!editingProject || isSaving) return

        setIsSaving(true)

        try {
            const updatedProject = await updateProject(
                projectId,
                projectData,
            )

            setProjects((currentProjects) =>
                currentProjects.map((project) =>
                    project.id === updatedProject.id
                        ? updatedProject
                        : project,
                ),
            )

            setEditingProject(null)
            toast.success('Project updated successfully!')
        } catch (error) {
            console.error('Error updating project:', error)
            toast.error(error.message || 'Failed to update project.')
            throw error
        } finally {
            setIsSaving(false)
        }
    }


    const handleDeleteProject = async () => {
        if (!deletingProject || isDeleting) return

        setIsDeleting(true)

        try {
            await deleteProject(deletingProject.id)

            setProjects((currentProjects) =>
                currentProjects.filter(
                    (project) => project.id !== deletingProject.id,
                ),
            )

            setDeletingProject(null)
            toast.success('Project deleted successfully!')
        } catch (error) {
            console.error('Error deleting project:', error)
            toast.error(error.message || 'Failed to delete project.')
        } finally {
            setIsDeleting(false)
        }
    }


    useEffect(() => {

        const fetchProjects = async () => {
            setIsLoading(true)

            try {
                const data = await getProjects(currentWorkspace?.id)
                setProjects(data)

            } catch (error) {
                console.error('Error fetching projects:', error)
                toast.error('Failed to load projects.')

            } finally {
                setIsLoading(false)
            }

        }
        fetchProjects()

    }, [currentWorkspace?.id])

    useEffect(() => {
    const selectedProjectId = location.state?.selectedProjectId

    if (!selectedProjectId || isLoading) return

    const selectedProject = projects.find(
        (project) => project.id === selectedProjectId,
    )

    if (selectedProject) {
        setEditingProject(selectedProject)
    }

    navigate(location.pathname, {
        replace: true,
        state: {},
    })
}, [
    location.state,
    location.pathname,
    projects,
    isLoading,
    navigate,
])

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                <div>
                    <p className="text-sm text-slate-400">
                        Workspace / Projects
                    </p>

                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                        Projects
                    </h1>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                        Organize your team's work and keep every project moving
                        forward.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setIsProjectModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
                >
                    <Plus size={18} />
                    New Project
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:flex-row">
                <div className="relative flex-1">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                        type="search"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-violet-500"
                >
                    <option value="all">All statuses</option>
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            {/* Project count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">
                    Showing{' '}
                    <span className="font-medium text-slate-200">
                        {filteredProjects.length} projects
                    </span>
                </p>

                <button
                    type="button"
                    className="text-sm text-slate-400 transition hover:text-white"
                >
                    Sort: Recently updated
                </button>
            </div>




            {/* Project content */}
            {isLoading ? (
                <p className="text-sm text-slate-400">
                    Loading projects...
                </p>
            ) : filteredProjects.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
                    {projects.length === 0 ? (
                        <p>No projects yet. Create your first project.</p>
                    ) : (
                        <p>No projects match your search.</p>
                    )}
                </div>
            ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {filteredProjects.map((project) => (
                        <article
                            key={project.id}
                            className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 transition hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900"
                        >
                            {/* Accent */}
                            <div
                                className={`h-1 ${project.status === 'completed'
                                    ? 'bg-emerald-500'
                                    : project.status === 'in_progress'
                                        ? 'bg-sky-500'
                                        : 'bg-violet-500'
                                    }`}
                            />

                            <div className="p-5">
                                {/* Card header */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300">
                                            <FolderKanban size={20} />
                                        </div>

                                        <div className="min-w-0">
                                            <h2 className="truncate font-semibold text-white">
                                                {project.name}
                                            </h2>

                                            <span
                                                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${project.status === 'completed'
                                                    ? 'bg-emerald-500/10 text-emerald-400'
                                                    : project.status === 'in_progress'
                                                        ? 'bg-sky-500/10 text-sky-400'
                                                        : 'bg-slate-500/10 text-slate-400'
                                                    }`}
                                            >
                                                {project.status
                                                    ?.replaceAll('_', ' ')
                                                    .replace(/\b\w/g, (char) => char.toUpperCase())}
                                            </span>
                                        </div>
                                    </div>


                                    <div className="relative">
                                        <button
                                            type="button"
                                            aria-label={`More options for ${project.name}`}
                                            aria-expanded={openMenuId === project.id}
                                            onClick={() =>
                                                setOpenMenuId((currentId) =>
                                                    currentId === project.id ? null : project.id,
                                                )
                                            }
                                            className="rounded-lg p-2 text-slate-500 opacity-70 transition hover:bg-slate-800 hover:text-white group-hover:opacity-100"
                                        >
                                            <MoreHorizontal size={18} />
                                        </button>

                                        {openMenuId === project.id && (
                                            <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-xl">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setOpenMenuId(null)
                                                        setEditingProject(project)
                                                    }}
                                                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
                                                >
                                                    Edit Project
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setOpenMenuId(null)
                                                        setDeletingProject(project)
                                                    }}
                                                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 transition hover:bg-red-500/10"
                                                >
                                                    Delete Project
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                </div>

                                {/* Description */}
                                <p className="mt-5 min-h-12 text-sm leading-6 text-slate-400">
                                    {project.description}
                                </p>

                                {/* Progress */}
                                <div className="mt-6">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-slate-500">
                                            Progress
                                        </span>

                                        <span className="font-semibold text-slate-200">
                                            {project.progress ?? 0}%
                                        </span>
                                    </div>

                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                                        <div
                                            className={`h-full rounded-full ${project.status === 'completed'
                                                ? 'bg-emerald-500'
                                                : project.status === 'in_progress'
                                                    ? 'bg-sky-500'
                                                    : 'bg-violet-500'
                                                }`}
                                            style={{
                                                width: `${project.progress ?? 0}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div className="mt-6 flex items-center justify-end border-t border-slate-800 pt-4">
                                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <CalendarDays size={14} />
                                        {project.due_date
                                            ? new Date(`${project.due_date}T00:00:00`).toLocaleDateString(
                                                'en-US',
                                                {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                },
                                            )
                                            : 'No due date'}
                                    </span>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            <CreateProjectModal
                isOpen={isProjectModalOpen}
                onClose={() => setIsProjectModalOpen(false)}
                onCreate={handleCreateProject}
                isCreating={isCreatingProject}
            />

            {editingProject && (
                <EditProjectModal
                    isOpen={Boolean(editingProject)}
                    project={editingProject}
                    onClose={() => setEditingProject(null)}
                    onUpdate={handleUpdateProject}
                    isUpdating={isSaving}
                />
            )}


            {deletingProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <div
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="delete-project-title"
                        className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
                    >
                        <h2
                            id="delete-project-title"
                            className="text-lg font-semibold text-white"
                        >
                            Delete project?
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-slate-400">
                            Are you sure you want to delete{' '}
                            <span className="font-medium text-white">
                                {deletingProject.name}
                            </span>
                            ? This action cannot be undone.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setDeletingProject(null)}
                                disabled={isDeleting}
                                className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleDeleteProject}
                                disabled={isDeleting}
                                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Project'}
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    )
}

export default ProjectsPage