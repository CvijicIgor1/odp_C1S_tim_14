import LandingPage from "./pages/LandingPage";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/protected_route/ProtectedRoute";

import LoginPage    from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import NotFoundPage from "./pages/not_found/NotFoundPage";

import UserDashboard from "./pages/user/UserDashboard";
import UserTeams     from "./pages/user/UserTeams";
import TeamProjectsPage from "./pages/user/TeamProjectsPage";
import ProjectKanbanPage from "./pages/user/ProjectKanbanPage";
import TaskDetailPage from "./pages/user/TaskDetailPage";
import MyTasksPage from "./pages/user/MyTasksPage";
import ProfilePage from "./pages/user/ProfilePage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersPage from "./pages/admin/UsersPage";
import AllTeamsPage from "./pages/admin/AllTeamsPage";
import AllProjectsPage from "./pages/admin/AllProjectsPage";
import HealthDashboard from "./pages/admin/HealthDashboard";
import TagsPage from "./pages/admin/TagsPage";
import AuditLogPage from "./pages/admin/AuditLogPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* User routes */}
      <Route path="/dashboard" element={<ProtectedRoute requiredRole="user"><UserDashboard /></ProtectedRoute>} />
      <Route path="/teams"     element={<ProtectedRoute requiredRole="user"><UserTeams /></ProtectedRoute>} />
      <Route path="/teams/:teamId/projects" element={<ProtectedRoute requiredRole="user"><TeamProjectsPage /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute requiredRole="user"><ProjectKanbanPage /></ProtectedRoute>} />
      <Route path="/tasks/:id" element={<ProtectedRoute requiredRole="user"><TaskDetailPage /></ProtectedRoute>} />
      <Route path="/my-tasks" element={<ProtectedRoute requiredRole="user"><MyTasksPage /></ProtectedRoute>} />
      <Route path="/profile"  element={<ProtectedRoute requiredRole="user"><ProfilePage /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin"       element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><UsersPage /></ProtectedRoute>} />
      <Route path="/admin/teams" element={<ProtectedRoute requiredRole="admin"><AllTeamsPage /></ProtectedRoute>} />
      <Route path="/admin/projects" element={<ProtectedRoute requiredRole="admin"><AllProjectsPage /></ProtectedRoute>} />
      <Route path="/admin/health" element={<ProtectedRoute requiredRole="admin"><HealthDashboard /></ProtectedRoute>} />
      <Route path="/admin/tags" element={<ProtectedRoute requiredRole="admin"><TagsPage /></ProtectedRoute>} />
      <Route path="/admin/audit-log"  element={<ProtectedRoute requiredRole="admin"><AuditLogPage /></ProtectedRoute>} />

      <Route path="/" element={<LandingPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*"    element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
