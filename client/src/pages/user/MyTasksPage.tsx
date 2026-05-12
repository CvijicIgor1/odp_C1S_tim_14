import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Empty, ErrorBox, Spinner, StatusBadge } from "../../components/ui/UI";
import { tasksApi } from "../../api_services/task/TaskAPIService";
import type { TaskDto } from "../../models/project/ProjectTypes";

export default function MyTasksPage() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await tasksApi.getMyTasks();
      if (res.success && res.data) setTasks(res.data);
      else setError(res.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader eyebrow="Tasks" title="My Tasks" />

      {error && <ErrorBox message={error} />}

      {loading && <div className="flex justify-center py-12"><Spinner size={24} /></div>}

      {!loading && tasks.length === 0 && !error && (
        <Empty message="You have no assigned tasks" />
      )}

      {!loading && tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <button
              key={task.id}
              onClick={() => navigate(`/tasks/${task.id}`)}
              className="w-full text-left bg-[#0d0d0d] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-white font-medium text-sm leading-tight">{task.title}</h3>
                <StatusBadge status={task.status} />
              </div>
              <p className="text-white/40 text-xs line-clamp-2">{task.description}</p>
              <div className="flex items-center gap-5 text-[10px] text-white/25 font-mono">
                <span>Priority: <span className="text-white/40">{task.priority}</span></span>
                {task.deadline && <span>Deadline: <span className="text-white/40">{task.deadline.slice(0, 10)}</span></span>}
                {task.estimatedHours > 0 && <span>Est: <span className="text-white/40">{task.estimatedHours}h</span></span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
