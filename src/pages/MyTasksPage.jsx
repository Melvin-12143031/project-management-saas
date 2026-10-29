import {
    CalendarDays,
    CheckCircle2,
    Circle,
    Filter,
    Flag,
    Search,
    Trash2,
    Pencil
} from 'lucide-react'

import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useWorkspace } from '../contexts/WorkspaceContext'
import {
    createTask,
    deleteTask,
    getTasks,
    updateTask,
    updateTaskStatus
} from '../services/taskService'

import DeleteTaskDialog from '../components/DeleteTaskDialog'

import { getProjects } from '../services/projectService'
import { createNotification } from '../services/notificationService'
import { useAuth } from '../contexts/AuthContext'

const MyTasksPage = () => {

    const { user } = useAuth()
    const { currentWorkspace } = useWorkspace()
    const location = useLocation()
    const navigate = useNavigate()

    const [tasks, setTasks] = useState([])
    const [isTasksLoading, setIsTasksLoading] = useState(false)
    const [tasksError, setTasksError] = useState('')
    const [projects, setProjects] = useState([])
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
    const [isProjectsLoading, setIsProjectsLoading] = useState(false)
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        project_id: '',
        priority: 'medium',
        due_date: '',
        status: 'todo',
    })

    const [isCreatingTask, setIsCreatingTask] = useState(false)
    const [taskToDelete, setTaskToDelete] = useState(null)
    const [isDeletingTask, setIsDeletingTask] = useState(false)
    const [taskToEdit, setTaskToEdit] = useState(null)
    const [isEditingTask, setIsEditingTask] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [priorityFilter, setPriorityFilter] = useState('all')
    const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false)
    const [projectFilter, setProjectFilter] = useState('all')
    const [dueDateFilter, setDueDateFilter] = useState('all')


    const handleCreateTask = async (event) => {
        event.preventDefault()

        if (isCreatingTask) return

        if (!currentWorkspace?.id) {
            toast.error('Please select a workspace first.')
            return
        }

        if (!taskForm.title.trim()) {
            toast.error('Task title is required.')
            return
        }

        if (!taskForm.project_id) {
            toast.error('Please select a project.')
            return
        }

        setIsCreatingTask(true)

        try {
            const newTask = await createTask(
                currentWorkspace.id,
                taskForm,
            )


            try {
                await createNotification({
                    userId: user.id,
                    workspaceId: currentWorkspace.id,
                    title: 'Task created',
                    message: `Your task "${newTask.title}" was created successfully.`,
                    type: 'task',
                    link: '/my-tasks',
                    recordId: newTask.id,
                })
            } catch (notificationError) {
                console.error(
                    'Failed to create notification:',
                    notificationError.message,
                )
            }

            const selectedProject = projects.find(
                (project) => project.id === newTask.project_id,
            )

            newTask.projects = {
                id: selectedProject?.id,
                name: selectedProject?.name || 'Unknown project',
            }

            setTasks((currentTasks) => [
                newTask,
                ...currentTasks,
            ])

            setTaskForm({
                title: '',
                description: '',
                project_id: '',
                priority: 'medium',
                due_date: '',
                status: 'todo',
            })

            setIsCreateTaskOpen(false)

            toast.success('Task created successfully!')
        } catch (error) {
            toast.error(error.message || 'Failed to create task.')
        } finally {
            setIsCreatingTask(false)
        }
    }

    const handleEditTask = (task) => {

        setTaskToEdit(task)

        setTaskForm({

            title: task.title || '',
            description: task.description || '',
            project_id: task.project_id || '',
            priority: task.priority || 'medium',
            due_date: task.due_date || '',
            status: task.status || 'todo',
        })

        setIsCreateTaskOpen(true)

    }

    const handleUpdateTask = async (e) => {
        e.preventDefault()

        if (isEditingTask) return

        setIsEditingTask(true)

        try {

            const updatedTask = await updateTask(
                taskToEdit.id,
                taskForm
            )

            const selectedProject = projects.find(
                (project) => project.id === updatedTask.project_id,
            )

            updatedTask.projects = selectedProject
                ? {
                    id: selectedProject.id,
                    name: selectedProject.name
                }
                : null

            setTasks((currentTasks) =>
                currentTasks.map((task) =>
                    task.id === updatedTask.id ? updatedTask : task,
                ),
            )

            setTaskToEdit(null)

            setTaskForm({
                title: '',
                description: '',
                project_id: '',
                priority: 'medium',
                due_date: '',
                status: 'todo',
            })

            setIsCreateTaskOpen(false)
            toast.success('Task updated successfully!')

        } catch (error) {
            toast.error(error.message || 'Failed to update task.')
        } finally {
            setIsEditingTask(false)
        }

    }



    const handleToggleTask = async (task) => {
        const nextStatus =
            task.status === 'completed' ? 'todo' : 'completed'

        try {
            const updatedTask = await updateTaskStatus(
                task.id,
                nextStatus,
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

            toast.success(
                nextStatus === 'completed'
                    ? 'Task completed!'
                    : 'Task reopened!',
            )
        } catch (error) {
            toast.error(
                error.message || 'Failed to update task status.',
            )
        }
    }

    const today = new Date()

    const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, '0'),
        String(today.getDate()).padStart(2, '0'),
    ].join('-')

    const filteredTasks = tasks.filter((task) => {
        const matchesSearch = task.title
            ?.toLowerCase()
            .includes(searchQuery.trim().toLowerCase())

        const matchesStatus =
            statusFilter === 'all' || task.status === statusFilter

        const matchesPriority =
            priorityFilter === 'all' || task.priority === priorityFilter

        const matchesProject =
            projectFilter === 'all' || task.project_id === projectFilter

        const dueDate = task.due_date

        const matchesDueDate =
            dueDateFilter === 'all' ||
            (dueDateFilter === 'no_date' && !dueDate) ||
            (
                dueDateFilter === 'overdue' &&
                dueDate &&
                dueDate < todayString &&
                task.status !== 'completed'
            ) ||
            (dueDateFilter === 'today' && dueDate === todayString) ||
            (dueDateFilter === 'upcoming' && dueDate && dueDate > todayString)

        return (
            matchesSearch &&
            matchesStatus &&
            matchesPriority &&
            matchesProject &&
            matchesDueDate
        )
    })

    const completedTasksCount = tasks.filter(
        (task) => task.status === 'completed',
    ).length

    const remainingTasksCount = tasks.filter(
        (task) => task.status !== 'completed',
    ).length

    useEffect(() => {
        let isActive = true

        const loadTasks = async () => {
            if (!currentWorkspace?.id) {
                setTasks([])
                setIsTasksLoading(false)
                setTasksError('')
                return
            }

            setIsTasksLoading(true)
            setTasksError('')

            try {
                const data = await getTasks(currentWorkspace.id)

                if (isActive) {
                    setTasks(data)
                }
            } catch (error) {
                if (isActive) {
                    setTasks([])
                    setTasksError(error.message || 'Failed to load tasks.')
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

    useEffect(() => {
        const selectedTaskId = location.state?.selectedTaskId

        if (!selectedTaskId || isTasksLoading || isProjectsLoading) return

        const selectedTask = tasks.find(
            (task) => task.id === selectedTaskId,
        )

        if (selectedTask) {
            handleEditTask(selectedTask)
        }

        navigate(location.pathname, {
            replace: true,
            state: {},
        })
    }, [
        location.state,
        location.pathname,
        tasks,
        isTasksLoading,
        isProjectsLoading,
        navigate,
    ])


    const handleDeleteTask = async (taskId) => {
        if (isDeletingTask) return

        setIsDeletingTask(true)

        try {
            await deleteTask(taskId)

            setTasks((currentTasks) =>
                currentTasks.filter((task) => task.id !== taskId),
            )

            setTaskToDelete(null)

            toast.success('Task deleted successfully!')
        } catch (error) {
            toast.error(
                error.message || 'Failed to delete task.',
            )
        } finally {
            setIsDeletingTask(false)
        }
    }

    useEffect(() => {

        setProjectFilter('all')

        let isActive = true

        const loadProjects = async () => {
            if (!currentWorkspace?.id) {
                setProjects([])
                setIsProjectsLoading(false)
                return
            }

            setIsProjectsLoading(true)

            try {
                const data = await getProjects(currentWorkspace.id)

                if (isActive) {
                    setProjects(data)
                }
            } catch (error) {
                if (isActive) {
                    setProjects([])
                    toast.error(error.message || 'Failed to load projects.')
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

    const handleCloseTaskForm = () => {
        setIsCreateTaskOpen(false)
        setTaskToEdit(null)

        setTaskForm({
            title: '',
            description: '',
            project_id: '',
            priority: 'medium',
            due_date: '',
            status: 'todo',
        })
    }

    return (
        <div className="mx-auto max-w-7xl space-y-8">
            {/* Header */}
            <div>
                <p className="text-sm text-slate-400">
                    Workspace / My Tasks
                </p>

                <div className="mt-2 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">
                            My Tasks
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            Stay on top of your work across every project.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                            <p className="text-xs text-slate-500">
                                Remaining
                            </p>

                            <p className="mt-1 text-lg font-semibold text-white">
                                {remainingTasksCount}
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                            <p className="text-xs text-slate-500">
                                Completed
                            </p>

                            <p className="mt-1 text-lg font-semibold text-emerald-400">
                                {completedTasksCount}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 lg:flex-row">
                <div className="relative flex-1">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />

                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tasks..."
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-500"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-violet-500"
                >
                    <option value="all">All statuses</option>
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>

                <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-violet-500"
                >
                    <option value="all">All priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>

                <button
                    type="button"
                    onClick={() => setIsMoreFiltersOpen((current) => !current)}
                    aria-expanded={isMoreFiltersOpen}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
                >
                    <Filter size={17} />
                    More filters
                </button>

                <button
                    type="button"
                    onClick={() => setIsCreateTaskOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                    <span className="text-lg leading-none">+</span>
                    Create Task
                </button>
            </div>

            {/* Advanced filters */}
            {isMoreFiltersOpen && (
                <div className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:grid-cols-2">
                    {/* Project filter */}
                    <div>
                        <label
                            htmlFor="task-project-filter"
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Project
                        </label>

                        <select
                            id="task-project-filter"
                            value={projectFilter}
                            onChange={(event) => setProjectFilter(event.target.value)}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-violet-500"
                        >
                            <option value="all">All projects</option>

                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Due date filter */}
                    <div>
                        <label
                            htmlFor="task-due-date-filter"
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Due date
                        </label>

                        <select
                            id="task-due-date-filter"
                            value={dueDateFilter}
                            onChange={(event) => setDueDateFilter(event.target.value)}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-violet-500"
                        >
                            <option value="all">All due dates</option>
                            <option value="overdue">Overdue</option>
                            <option value="today">Due today</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="no_date">No due date</option>
                        </select>
                    </div>
                </div>
            )}


            {/* Task list */}
            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
                {/* List header */}
                <div className="hidden border-b border-slate-800 px-5 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 lg:grid lg:grid-cols-[minmax(0,1fr)_140px_120px_120px_70px] lg:gap-4">
                    <span>Task</span>
                    <span>Status</span>
                    <span>Priority</span>
                    <span>Due date</span>
                    <span>Owner</span>
                </div>

                {isTasksLoading && (
                    <p className="px-5 py-8 text-center text-sm text-slate-400">
                        Loading tasks...
                    </p>
                )}

                {!isTasksLoading && tasksError && (
                    <p className="px-5 py-8 text-center text-sm text-rose-400">
                        {tasksError}
                    </p>
                )}

                {!isTasksLoading &&
                    !tasksError &&
                    filteredTasks.length === 0 && (
                        <p className="px-5 py-8 text-center text-sm text-slate-400">
                            {tasks.length === 0
                                ? 'No tasks yet. Create a task to see it here.'
                                : 'No tasks match your search or filters.'}
                        </p>
                    )}

                <div className="divide-y divide-slate-800">
                    {filteredTasks.map((task) => (
                        <div
                            key={task.id}
                            className="group px-5 py-4 transition hover:bg-slate-800/30"
                        >
                            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_140px_120px_120px_70px] lg:items-center lg:gap-4">
                                {/* Task */}
                                <div className="flex min-w-0 items-start gap-3">
                                    <button
                                        type="button"
                                        onClick={() => handleToggleTask(task)}
                                        aria-label={
                                            task.completed === 'completed'
                                                ? `Reopen ${task.title}`
                                                : `Complete ${task.title}`
                                        }
                                        className="mt-0.5 shrink-0 text-slate-600 transition hover:text-violet-400"
                                    >
                                        {task.status === 'completed' ? (
                                            <CheckCircle2
                                                size={20}
                                                className="text-emerald-400"
                                            />
                                        ) : (
                                            <Circle size={20} />
                                        )}
                                    </button>

                                    <div className="min-w-0">
                                        <h2
                                            className={`truncate text-sm font-medium ${task.status === 'completed'
                                                ? 'text-slate-500 line-through'
                                                : 'text-slate-200'
                                                }`}
                                        >
                                            {task.title}
                                        </h2>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {task.projects?.name || 'Unknown project'}
                                        </p>
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <span
                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${task.status === 'completed'
                                            ? 'bg-emerald-500/10 text-emerald-400'
                                            : task.status === 'in_progress'
                                                ? 'bg-sky-500/10 text-sky-400'
                                                : 'bg-slate-800 text-slate-400'
                                            }`}
                                    >
                                        {task.status === 'completed'
                                            ? 'Completed'
                                            : task.status === 'in_progress'
                                                ? 'In Progress'
                                                : 'To Do'}
                                    </span>
                                </div>

                                {/* Priority */}
                                <div
                                    className={`flex items-center gap-2 text-xs font-medium ${task.priority === 'high'
                                        ? 'text-rose-400'
                                        : task.priority === 'medium'
                                            ? 'text-amber-400'
                                            : 'text-emerald-400'
                                        }`}
                                >
                                    <Flag size={14} />
                                    {task.priority
                                        ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
                                        : 'Medium'}
                                </div>

                                {/* Due date */}
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <CalendarDays size={14} />
                                    {task.due_date
                                        ? new Date(`${task.due_date}T00:00:00`).toLocaleDateString(
                                            'en-US',
                                            {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            },
                                        )
                                        : 'No due date'}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-2">
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${task.assigneeStyle}`}
                                    >
                                        {task.assignee}
                                    </div>

                                    <button
                                        type='button'
                                        onClick={() => handleEditTask(task)}
                                        aria-label={`Edit ${task.title}`}
                                        className="rounded-lg p-2 text-slate-500 transition hover:bg-indigo-500/10 hover:text-indigo-400"
                                    >
                                        <Pencil size={16} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setTaskToDelete(task)}
                                        aria-label={`Delete ${task.title}`}
                                        className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            </section>


            {isCreateTaskOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white">
                                {taskToEdit ? 'Edit Task' : 'Create New Task'}
                            </h2>

                            <button
                                type="button"
                                onClick={handleCloseTaskForm}
                                className="text-slate-400 transition hover:text-white"
                                aria-label="Close task form"
                            >
                                ✕
                            </button>
                        </div>

                        <form
                            onSubmit={taskToEdit ? handleUpdateTask : handleCreateTask}
                            className="space-y-4">
                            <div>
                                <label
                                    htmlFor="task-title"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Task title
                                </label>
                                <input
                                    id="task-title"
                                    type="text"
                                    value={taskForm.title}
                                    onChange={(event) =>
                                        setTaskForm((current) => ({
                                            ...current,
                                            title: event.target.value,
                                        }))
                                    }
                                    placeholder="Enter task title"
                                    required
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="task-description"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Description
                                </label>
                                <textarea
                                    id="task-description"
                                    value={taskForm.description}
                                    onChange={(event) =>
                                        setTaskForm((current) => ({
                                            ...current,
                                            description: event.target.value,
                                        }))
                                    }
                                    placeholder="Describe the task (optional)"
                                    rows={3}
                                    className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="task-project"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Project
                                </label>
                                <select
                                    id="task-project"
                                    value={taskForm.project_id}
                                    onChange={(event) =>
                                        setTaskForm((current) => ({
                                            ...current,
                                            project_id: event.target.value,
                                        }))
                                    }
                                    required
                                    disabled={isProjectsLoading || projects.length === 0}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-500 disabled:opacity-50"
                                >
                                    <option value="">
                                        {isProjectsLoading
                                            ? 'Loading projects...'
                                            : projects.length === 0
                                                ? 'No projects available'
                                                : 'Select a project'}
                                    </option>

                                    {projects.map((project) => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="task-status"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Status
                                </label>

                                <select
                                    id="task-status"
                                    value={taskForm.status}
                                    onChange={(event) =>
                                        setTaskForm((current) => ({
                                            ...current,
                                            status: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
                                >
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>


                            <div>
                                <label
                                    htmlFor="task-priority"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Priority
                                </label>
                                <select
                                    id="task-priority"
                                    value={taskForm.priority}
                                    onChange={(event) =>
                                        setTaskForm((current) => ({
                                            ...current,
                                            priority: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="task-due-date"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Due date (optional)
                                </label>
                                <input
                                    id="task-due-date"
                                    type="date"
                                    value={taskForm.due_date}
                                    onChange={(event) =>
                                        setTaskForm((current) => ({
                                            ...current,
                                            due_date: event.target.value,
                                        }))
                                    }
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleCloseTaskForm}
                                    className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        isCreatingTask ||
                                        isEditingTask ||
                                        isProjectsLoading ||
                                        projects.length === 0

                                    }

                                    className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {
                                        isEditingTask
                                            ? 'Saving...'
                                            : isCreatingTask
                                                ? 'Creating...'
                                                : taskToEdit
                                                    ? 'Save Changes'
                                                    : 'Create Task'
                                    }
                                </button>

                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DeleteTaskDialog
                isOpen={taskToDelete !== null}
                task={taskToDelete}
                onClose={() => setTaskToDelete(null)}
                onConfirm={() => handleDeleteTask(taskToDelete.id)}
                isDeleting={isDeletingTask}
            />

        </div>


    )
}

export default MyTasksPage