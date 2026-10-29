
export const getProjectStatus = (status) => {
    const statuses = {
        planning: {
            label: 'Planning',
            style: 'bg-violet-500/10 text-violet-400',
        },
        in_progress: {
            label: 'In Progress',
            style: 'bg-sky-500/10 text-sky-400',
        },
        completed: {
            label: 'Completed',
            style: 'bg-emerald-500/10 text-emerald-400',
        },
    }

    return statuses[status] ?? {
        label: status,
        style: 'bg-slate-500/10 text-slate-400',
    }
}
