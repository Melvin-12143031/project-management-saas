
import { AlertTriangle, X } from "lucide-react"

const DeleteProjectDialog = ({
    isOpen,
    project,
    onClose,
    onConfirm,
    isDeleting = false,
}) => {

    if(!isOpen || !project) return null

  return (
    <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isDeleting) {
                    onClose()
                }
            }}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="delete-project-title"
                aria-describedby="delete-project-description"
                className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-rose-500/10 p-3 text-rose-400">
                            <AlertTriangle size={22} />
                        </div>

                        <div>
                            <h2
                                id="delete-project-title"
                                className="text-xl font-semibold text-white"
                            >
                                Delete project?
                            </h2>

                            <p
                                id="delete-project-description"
                                className="mt-2 text-sm leading-6 text-slate-400"
                            >
                                This will permanently delete{' '}
                                <span className="font-medium text-slate-200">
                                    {project.name}
                                </span>
                                . This action cannot be undone.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        aria-label="Close dialog"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isDeleting ? 'Deleting project...' : 'Delete project'}
                    </button>
                </div>
            </div>
        </div>
  )
}

export default DeleteProjectDialog
