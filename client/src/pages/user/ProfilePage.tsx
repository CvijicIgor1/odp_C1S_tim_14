import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader, ErrorBox, SuccessBox, Spinner, RoleBadge } from "../../components/ui/UI";
import { usersApi } from "../../api_services/users/UsersAPIService";
import { useAuth } from "../../hooks/auth/useAuthHook";
import type { UserDto } from "../../models/user/UserTypes";

export default function ProfilePage() {
  const { user: authUser } = useAuth();

  const [profile, setProfile] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");

  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    setError("");
    try {
      const res = await usersApi.getById(authUser.id);
      if (res.success && res.data) {
        setProfile(res.data);
        setEditUsername(res.data.username);
        setEditEmail(res.data.email);
        setEditAvatar(res.data.avatar ?? "");
        setAvatarPreview(res.data.avatar ?? "");
      } else {
        setError(res.message);
      }
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => { load(); }, [load]);

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setEditAvatar(base64);
      setAvatarPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!profile || !authUser) return;
    if (newPassword && newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await usersApi.updateProfile(
        authUser.id,
        editUsername.trim(),
        editEmail.trim(),
        editAvatar,
        newPassword || undefined,
      );
      if (res.success) {
        setSuccess("Profile updated successfully");
        setEditing(false);
        setNewPassword("");
        setConfirmPassword("");
        await load();
      } else {
        setError(res.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (profile) {
      setEditUsername(profile.username);
      setEditEmail(profile.email);
      setEditAvatar(profile.avatar ?? "");
      setAvatarPreview(profile.avatar ?? "");
    }
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setEditing(false);
  };

  return (
    <div className="space-y-8 max-w-xl">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        action={
          !editing ? (
            <button
              onClick={() => setEditing(true)}
              className="text-xs px-4 py-2 border border-white/10 text-white/50 rounded-xl hover:border-white/20 hover:text-white/80 transition-colors"
            >
              Edit profile
            </button>
          ) : (
            <button
              onClick={cancelEdit}
              className="text-xs px-4 py-2 border border-white/10 text-white/50 rounded-xl hover:border-white/20 hover:text-white/80 transition-colors"
            >
              Cancel
            </button>
          )
        }
      />

      {error && <ErrorBox message={error} />}
      {success && <SuccessBox message={success} />}

      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size={24} />
        </div>
      )}

      {!loading && profile && !editing && (
        <div className="bg-white/2 border border-white/6 rounded-2xl divide-y divide-white/5">
          <div className="flex items-center gap-4 px-6 py-5">
            <div className="w-12 h-12 rounded-full bg-white/6 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
              {profile.avatar
                ? <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
                : <span className="text-lg text-white/50 font-semibold">{profile.username[0].toUpperCase()}</span>
              }
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

      {!loading && editing && (
        <section className="bg-[#0d0d0d] border border-white/5 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold text-sm">Edit profile</h2>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/6 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
              {avatarPreview
                ? <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                : <span className="text-xl text-white/30">{editUsername[0]?.toUpperCase()}</span>
              }
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" id="avatar-edit" />
              <label htmlFor="avatar-edit" className="cursor-pointer text-xs text-white/40 hover:text-white/70 transition-colors underline underline-offset-2">
                Change avatar
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/30 font-mono block mb-1.5">Username</label>
              <input
                type="text"
                value={editUsername}
                onChange={e => setEditUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/30 font-mono block mb-1.5">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={e => setEditEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/30 font-mono block mb-1.5">New password <span className="text-white/15">(leave blank to keep current)</span></label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20"
              />
            </div>
            {newPassword && (
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/30 font-mono block mb-1.5">Confirm password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 ${
                    confirmPassword && confirmPassword !== newPassword ? "border-red-500/40" : "border-white/10"
                  }`}
                />
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !editUsername.trim() || !editEmail.trim() || (!!newPassword && newPassword !== confirmPassword)}
            className="px-8 py-3 bg-white text-black text-sm font-bold rounded-xl hover:bg-white/90 transition-colors disabled:opacity-40"
          >
            {saving ? <Spinner size={14} /> : "Save changes"}
          </button>
        </section>
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
