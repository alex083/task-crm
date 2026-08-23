import React from 'react';

const PRIORITY_STYLES = {
  high: 'bg-rose-100 text-rose-700 ring-rose-200',
  medium: 'bg-amber-100 text-amber-800 ring-amber-200',
  low: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
};

const COLUMNS = [
  { key: 'todo', title: 'To Do', accent: 'border-slate-300' },
  { key: 'in_progress', title: 'In Progress', accent: 'border-sky-400' },
  { key: 'done', title: 'Done', accent: 'border-emerald-400' },
];

function KanbanBoard({
  tasks,
  priorityLabels,
  canManage,
  onOpenTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.key);
        return (
          <section
            key={column.key}
            className={`flex min-h-[420px] flex-col rounded-xl border-t-4 bg-slate-200/70 ${column.accent}`}
          >
            <header className="flex items-center justify-between px-3 py-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                {column.title}
              </h4>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500 shadow-sm">
                {columnTasks.length}
              </span>
            </header>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3">
              {columnTasks.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-300 bg-white/50 px-3 py-6 text-center text-sm text-slate-400">
                  No tasks
                </p>
              )}

              {columnTasks.map((task) => (
                <article
                  key={task.id}
                  onClick={() => onOpenTask(task)}
                  className="cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h5 className="text-sm font-semibold text-slate-800">{task.title}</h5>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium}`}
                    >
                      {priorityLabels[task.priority] || task.priority}
                    </span>
                  </div>

                  {task.description?.trim() && (
                    <p className="mb-2 line-clamp-2 text-xs text-slate-500">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-slate-500">
                    {task.department_name && <span>{task.department_name}</span>}
                    {task.assigned_to_username && (
                      <span className="font-medium text-slate-600">
                        → {task.assigned_to_username}
                      </span>
                    )}
                  </div>

                  {canManage && (
                    <div
                      className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                        value={task.status}
                        onChange={(e) => onStatusChange(task, e.target.value)}
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.key} value={c.key}>{c.title}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="rounded bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700"
                        onClick={() => onEditTask(task.id)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700"
                        onClick={() => onDeleteTask(task.id)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default KanbanBoard;
