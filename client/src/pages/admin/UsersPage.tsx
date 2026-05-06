import { useCallback, useEffect, useState } from "react";
import { PageHeader, Table, TableHead, RoleBadge, Empty, ErrorBox, Spinner } from "../../components/ui/UI";
import { usersApi } from "../../api_services/users/UsersAPIService";
import type { UserDto } from "../../models/user/UserTypes";

export default function UsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await usersApi.getAll();
      if (res.success) setUsers(res.data ?? []);
      else setError(res.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Users" />
      {error && <ErrorBox message={error} />}
      {loading && <div className="flex justify-center py-12"><Spinner size={24} /></div>}
      {!loading && users.length === 0 && !error && <Empty message="No users found" />}
      {!loading && users.length > 0 && (
        <Table>
          <TableHead columns={["ID", "Username", "Email", "Role", "Status"]} />
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-white/4 hover:bg-white/2 transition-colors">
                <td className="px-5 py-3.5 text-white/30 font-mono text-xs">{u.id}</td>
                <td className="px-5 py-3.5 text-white/80 text-sm">{u.username}</td>
                <td className="px-5 py-3.5 text-white/40 text-sm">{u.email}</td>
                <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                <td className="px-5 py-3.5 text-white/30 text-xs">{u.isActive ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
