
import { useState } from 'react'
import { X, FolderKanban } from 'lucide-react'

const CreateWorkspaceModal = ({ isOpen, onClose, onCreate, isCreating }) => {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')


        const handleClose = () => {
        setName('')
        setDescription('')
        onClose()
    }
    
    if (!isOpen) return null

    const handleSubmit = async (event) => {
        event.preventDefault()

        const trimmedName = name.trim()

        if (!trimmedName || isCreating) return

        await onCreate({
            name: trimmedName,
            description: description.trim(),
        })

        setName('')
        setDescription('')
    }





    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose()
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-workspace-title"
                className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-violet-500/15 p-3 text-violet-400">
                            <FolderKanban size={22} />
                        </div>

                        <div>
                            <h2
                                id="create-workspace-title"
                                className="text-xl font-semibold text-white"
                            >
                                Create a workspace
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                Set up a space for your team and projects.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isCreating}
                        aria-label="Close dialog"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                    <div>
                        <label
                            htmlFor="workspace-name"
                            className="mb-2 block text-sm font-medium text-slate-200"
                        >
                            Workspace name
                        </label>

                        <input
                            id="workspace-name"
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            placeholder="e.g. My Team"
                            maxLength={100}
                            required
                            autoFocus
                            disabled={isCreating}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="workspace-description"
                            className="mb-2 block text-sm font-medium text-slate-200"
                        >
                            Description <span className="text-slate-500">(optional)</span>
                        </label>

                        <textarea
                            id="workspace-description"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="What is this workspace for?"
                            rows={3}
                            maxLength={500}
                            disabled={isCreating}
                            className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
                        />
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isCreating}
                            className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={isCreating || !name.trim()}
                            className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isCreating ? 'Creating workspace...' : 'Create workspace'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CreateWorkspaceModal
