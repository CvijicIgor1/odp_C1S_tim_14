import { useCallback, useEffect, useState } from "react";
import { PageHeader, Table, TableHead, Empty, ErrorBox, Spinner } from "../../components/ui/UI";
import { teamsApi } from "../../api_services/team/TeamAPIService";
import type { TeamDto } from "../../models/team/TeamTypes";

export default function AllTeamsPage() {
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await teamsApi.getAllAsAdmin();
      if (res.success) setTeams(res.data?.items ?? []);
      else setError(res.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="All Teams" />
      {error && <ErrorBox message={error} />}
      {loading && <div className="flex justify-center py-12"><Spinner size={24} /></div>}
      {!loading && teams.length === 0 && !error && <Empty message="No teams found" />}
      {!loading && teams.length > 0 && (
        <Table>
          <TableHead columns={["ID", "Name", "Description"]} />
          <tbody>
            {teams.map(t => (
              <tr key={t.id} className="border-t border-white/5 hover:bg-white/3 transition-colors bg-[#111111]">
                <td className="px-5 py-3.5 text-white/30 font-mono text-xs">{t.id}</td>
                <td className="px-5 py-3.5 text-white/80 text-sm font-medium">{t.name}</td>
                <td className="px-5 py-3.5 text-white/40 text-sm">{t.description}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
