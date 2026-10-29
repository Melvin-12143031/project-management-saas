
import { AlertTriangle, X } from 'lucide-react'

const DeleteWorkspaceDialog = ({
    isOpen,
    workspace,
    onClose,
    onConfirm,
    isDeleting,
}) => {
    if (!isOpen || !workspace) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !isDeleting
                ) {
                    onClose()
                }
            }}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="delete-workspace-title"
                aria-describedby="delete-workspace-description"
                className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
            >
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-red-500/15 p-3 text-red-400">
                            <AlertTriangle size={22} />
                        </div>

                        <div>
                            <h2
                                id="delete-workspace-title"
                                className="text-xl font-semibold text-white"
                            >
                                Delete workspace?
                            </h2>

                            <p
                                id="delete-workspace-description"
                                className="mt-2 text-sm leading-6 text-slate-400"
                            >
                                You are about to permanently delete{' '}
                                <span className="font-semibold text-white">
                                    {workspace.name}
                                </span>
                                .
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

                <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <p className="text-sm font-medium text-red-300">
                        This action cannot be undone.
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                        All projects, tasks, and workspace membership
                        records associated with this workspace will
                        also be permanently deleted.
                    </p>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isDeleting ? 'Deleting workspace...' : 'Delete workspace'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default DeleteWorkspaceDialog
