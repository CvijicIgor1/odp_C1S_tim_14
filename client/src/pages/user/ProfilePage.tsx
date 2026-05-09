import { useCallback, useEffect, useState } from "react";
import { PageHeader, ErrorBox, Spinner, RoleBadge } from "../../components/ui/UI";
import { usersApi } from "../../api_services/users/UsersAPIService";
import { useAuth } from "../../hooks/auth/useAuthHook";
import type { UserDto } from "../../models/user/UserTypes";

export default function ProfilePage() {
  const { user: authUser } = useAuth();

  const [profile, setProfile] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const load = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    setError("");
    try {
      const res = await usersApi.getById(authUser.id);
      if (res.success && res.data) setProfile(res.data);
      else setError(res.message);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-8 max-w-xl">
      <PageHeader eyebrow="Account" title="Profile" />

      {error && <ErrorBox message={error} />}

      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size={24} />
        </div>
      )}

      {!loading && profile && (
        <div className="bg-white/2 border border-white/6 rounded-2xl divide-y divide-white/5">
          <div className="flex items-center gap-4 px-6 py-5">
            <div className="w-12 h-12 rounded-full bg-white/6 border border-white/10 flex items-center justify-center shrink-0">
              <span className="text-lg text-white/50 font-semibold">
                {profile.username[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">{profile.username}</p>
              <p className="text-white/35 text-xs mt-0.5">{profile.email}</p>
            </div>
            <div className="ml-auto">
              <RoleBadge role={profile.role} />
            </div>
          </div>

          <Row label="User ID"  value={`#${profile.id}`} mono />
          <Row label="Username" value={profile.username} />
          <Row label="Email"    value={profile.email} />
          <Row label="Role"     value={profile.role} />
          <Row label="Status"   value={profile.isActive ? "Active" : "Inactive"} />
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <span className="text-xs text-white/30 uppercase tracking-widest font-mono">{label}</span>
      <span className={`text-sm text-white/70 ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
