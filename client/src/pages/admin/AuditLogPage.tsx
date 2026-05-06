import { useCallback, useEffect, useState } from "react";
import { PageHeader, Table, TableHead, Empty, ErrorBox, Spinner, Pagination } from "../../components/ui/UI";
import { auditLogApi } from "../../api_services/audit/AuditLogAPIService";
import type { AuditLogDto } from "../../api_services/audit/IAuditLogAPIService";

const PAGE_SIZE = 20;

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await auditLogApi.getLogs(page, PAGE_SIZE);
      if (res.success) {
        setLogs(res.data?.items ?? []);
        setTotal(res.data?.total ?? 0);
      } else {
        setError(res.message);
      }
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Admin" title="Audit Log" />

      {error && <ErrorBox message={error} />}

      {loading && <div className="flex justify-center py-12"><Spinner size={24} /></div>}

      {!loading && logs.length === 0 && !error && <Empty message="No audit entries found" />}

      {!loading && logs.length > 0 && (
        <Table>
          <TableHead columns={["ID", "User", "Action", "Entity", "Entity ID", "Detail", "IP", "Time"]} />
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-t border-white/4 hover:bg-white/2 transition-colors">
                <td className="px-5 py-3.5 text-white/30 font-mono text-xs">{log.id}</td>
                <td className="px-5 py-3.5 text-white/50 font-mono text-xs">{log.user_id ?? "—"}</td>
                <td className="px-5 py-3.5 text-white/80 text-sm">{log.action}</td>
                <td className="px-5 py-3.5 text-white/40 text-xs">{log.entity_type ?? "—"}</td>
                <td className="px-5 py-3.5 text-white/30 font-mono text-xs">{log.entity_id ?? "—"}</td>
                <td className="px-5 py-3.5 text-white/30 text-xs max-w-[180px] truncate">
                  {log.detail ? JSON.stringify(log.detail) : "—"}
                </td>
                <td className="px-5 py-3.5 text-white/30 font-mono text-xs">{log.ip_address ?? "—"}</td>
                <td className="px-5 py-3.5 text-white/30 font-mono text-xs">
                  {new Date(log.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
    </div>
  );
}
