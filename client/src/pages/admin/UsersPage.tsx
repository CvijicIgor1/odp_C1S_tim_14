import { useCallback, useEffect, useState } from "react";
import { PageHeader, Table, TableHead, RoleBadge, Empty, ErrorBox, SuccessBox, Spinner } from "../../components/ui/UI";
import { usersApi } from "../../api_services/users/UsersAPIService";
import type { UserDto } from "../../models/user/UserTypes";

export default function UsersPage() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);

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

  const handleRoleToggle = async (u: UserDto) => {
    const newRole = u.role === "admin" ? "user" : "admin";
    setUpdating(u.id);
    setError(""); setSuccess("");
    try {
      const res = await usersApi.updateRole(u.id, newRole);
      if (res.success) { setSuccess(`Role updated to ${newRole}`); await load(); }
      else setError(res.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleStatusToggle = async (u: UserDto) => {
    setUpdating(u.id);
    setError(""); setSuccess("");
    try {
      const res = await usersApi.updateStatus(u.id, !u.isActive);
      if (res.success) { setSuccess("Status updated"); await load(); }
      else setError(res.message);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Users" />
      {error && <ErrorBox message={error} />}
      {success && <SuccessBox message={success} />}
      {loading && <div className="flex justify-center py-12"><Spinner size={24} /></div>}
      {!loading && users.length === 0 && !error && <Empty message="No users found" />}
      {!loading && users.length > 0 && (
        <Table>
          <TableHead columns={["ID", "Username", "Email", "Role", "Status", "Actions"]} />
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-white/5 hover:bg-white/3 transition-colors bg-[#111111]">
                <td className="px-5 py-3.5 text-white/30 font-mono text-xs">{u.id}</td>
                <td className="px-5 py-3.5 text-white/80 text-sm">{u.username}</td>
                <td className="px-5 py-3.5 text-white/40 text-sm">{u.email}</td>
                <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                <td className="px-5 py-3.5 text-white/30 text-xs">{u.isActive ? "Active" : "Inactive"}</td>
                <td className="px-5 py-3.5">
                  {updating === u.id
                    ? <Spinner size={12} />
                    : (
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleRoleToggle(u)}
                          className="text-xs text-white/30 hover:text-amber-400 transition-colors underline underline-offset-2"
                        >
                          → {u.role === "admin" ? "user" : "admin"}
                        </button>
                        <button
                          onClick={() => handleStatusToggle(u)}
                          className={`text-xs transition-colors underline underline-offset-2 ${u.isActive ? "text-white/30 hover:text-red-400" : "text-white/30 hover:text-emerald-400"}`}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    )
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
