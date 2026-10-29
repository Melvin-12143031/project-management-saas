
import { useEffect, useState } from 'react'
import { X, FolderKanban } from 'lucide-react'

const EditProjectModal = ({
    isOpen,
    project,
    onClose,
    onUpdate,
    isUpdating = false,
}) => {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState('planning')
    const [dueDate, setDueDate] = useState('')
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        if (isOpen && project) {
            setName(project.name ?? '')
            setDescription(project.description ?? '')
            setStatus(project.status ?? 'planning')
            setDueDate(project.due_date ?? '')
            setProgress(project.progress ?? 0)
        }
    }, [isOpen, project])

    const handleClose = () => {
        if (isUpdating) return
        onClose()
    }

    if (!isOpen || !project) return null

    const handleSubmit = async (event) => {
        event.preventDefault()

        const trimmedName = name.trim()

        if (!trimmedName || isUpdating) return

        try {
            await onUpdate(project.id, {
                name: trimmedName,
                description: description.trim(),
                status,
                due_date: dueDate || null,
                progress,
            })
        } catch (error) {
            console.error('Failed to update project:', error)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !isUpdating
                ) {
                    handleClose()
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-project-title"
                className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:p-8"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-violet-500/15 p-3 text-violet-400">
                            <FolderKanban size={22} />
                        </div>

                        <div>
                            <h2
                                id="edit-project-title"
                                className="text-xl font-semibold text-white"
                            >
                                Edit project
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                Update your project's details and status.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isUpdating}
                        aria-label="Close dialog"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                    <div>
                        <label
                            htmlFor="edit-project-name"
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Project name
                        </label>

                        <input
                            id="edit-project-name"
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="e.g. Website Redesign"
                            maxLength={100}
                            required
                            autoFocus
                            disabled={isUpdating}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="edit-project-description"
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Description
                            <span className="ml-2 text-slate-500">
                                (Optional)
                            </span>
                        </label>

                        <textarea
                            id="edit-project-description"
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            placeholder="What is this project about?"
                            rows={3}
                            maxLength={500}
                            disabled={isUpdating}
                            className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="edit-project-status"
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Status
                        </label>

                        <select
                            id="edit-project-status"
                            value={status}
                            onChange={(e) => {
                                const newStatus = e.target.value

                                setStatus(newStatus)

                                if(newStatus === 'completed') {
                                    setProgress(100) 
                                }
    
                            }}
                            disabled={isUpdating}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                        >
                            <option value="planning">Planning</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="edit-project-due-date"
                            className="mb-2 block text-sm font-medium text-slate-300"
                        >
                            Due date
                            <span className="ml-2 text-slate-500">
                                (Optional)
                            </span>
                        </label>


                        <input
                            id="edit-project-due-date"
                            type="date"
                            value={dueDate}
                            onChange={(event) =>
                                setDueDate(event.target.value)
                            }
                            disabled={isUpdating}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <label
                                htmlFor="edit-project-progress"
                                className="block text-sm font-medium text-slate-300"
                            >
                                Project progress
                            </label>

                            <span className="text-sm font-semibold text-violet-400">
                                {progress}%
                            </span>
                        </div>

                        <input
                            id="edit-project-progress"
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={progress}
                            onChange={(event) =>
                                setProgress(Number(event.target.value))
                            }
                            disabled={isUpdating}
                            className="w-full cursor-pointer accent-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                        />

                        <div className="mt-1 flex justify-between text-xs text-slate-500">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isUpdating}
                            className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isUpdating || !name.trim()}
                            className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isUpdating ? 'Saving changes...' : 'Save changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EditProjectModal
