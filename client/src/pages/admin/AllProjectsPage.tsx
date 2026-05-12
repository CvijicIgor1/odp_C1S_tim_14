import { useCallback, useEffect, useState } from "react";
import { PageHeader, Table, TableHead, StatusBadge, Empty, ErrorBox, Spinner } from "../../components/ui/UI";
import { projectsApi } from "../../api_services/project/ProjectAPIService";
import type { ProjectDto } from "../../models/project/ProjectTypes";

export default function AllProjectsPage() {
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await projectsApi.getAllAsAdmin();
      if (res.success) setProjects(res.data?.items ?? []);
      else setError(res.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="All Projects" />
      {error && <ErrorBox message={error} />}
      {loading && <div className="flex justify-center py-12"><Spinner size={24} /></div>}
      {!loading && projects.length === 0 && !error && <Empty message="No projects found" />}
      {!loading && projects.length > 0 && (
        <Table>
          <TableHead columns={["ID", "Name", "Status", "Priority", "Team ID", "Deadline"]} />
          <tbody>
            {projects.map(p => (
              <tr key={p.id} className="border-t border-white/5 hover:bg-white/3 transition-colors bg-[#111111]">
                <td className="px-5 py-3.5 text-white/30 font-mono text-xs">{p.id}</td>
                <td className="px-5 py-3.5 text-white/80 text-sm font-medium">{p.name}</td>
                <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                <td className="px-5 py-3.5"><StatusBadge status={p.priority} /></td>
                <td className="px-5 py-3.5 text-white/30 font-mono text-xs">{p.teamId}</td>
                <td className="px-5 py-3.5 text-white/40 text-xs">
                  {p.deadline ? new Date(p.deadline).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
