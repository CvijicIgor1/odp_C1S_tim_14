import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Empty, ErrorBox, PageHeader, Pagination, Spinner, StatusBadge } from "../../components/ui/UI";
import { projectsApi } from "../../api_services/project/ProjectAPIService";
import type { ProjectDto } from "../../models/project/ProjectTypes";

const PAGE_SIZE = 12;

export default function WatchedProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await projectsApi.getWatched(page, PAGE_SIZE);
      if (res.success) {
        setProjects(res.data?.items ?? []);
        setTotal(res.data?.total ?? 0);
      } else {
        setError(res.message);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const allTags = useMemo(
    () => Array.from(new Set(projects.flatMap((project) => project.tags.map((tag) => tag.name)))).sort(),
    [projects],
  );

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Projects" title="Watched Projects" />

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <span key={tag} className="text-[10px] px-2.5 py-1 bg-white/5 border border-white/10 text-white/40 rounded-lg">
              {tag}
            </span>
          ))}
        </div>
      )}

      {error && <ErrorBox message={error} />}
      {loading && <div className="flex justify-center py-12"><Spinner size={24} /></div>}

      {!loading && projects.length === 0 && !error && (
        <Empty message="You are not watching any projects yet" />
      )}

      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="text-left bg-[#0d0d0d] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-white font-medium text-sm leading-tight">{project.name}</h3>
                <StatusBadge status={project.status} />
              </div>
              <p className="text-white/40 text-xs line-clamp-2">{project.description}</p>
              <div className="flex items-center gap-3 text-[10px] text-white/25 font-mono">
                <span>Priority: {project.priority}</span>
                {project.deadline && <span>Due: {project.deadline.slice(0, 10)}</span>}
                <span>{project.watcherCount} watchers</span>
              </div>
              {project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <span key={tag.id} className="text-[10px] px-2 py-0.5 bg-white/5 border border-white/10 text-white/40 rounded">
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
    </div>
  );
}
