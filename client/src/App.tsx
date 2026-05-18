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
import { UserRole } from "./models/user/UserRole";

export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* User routes */}
      <Route path="/dashboard" element={<ProtectedRoute requiredRole={UserRole.USER}><UserDashboard /></ProtectedRoute>} />
      <Route path="/teams"     element={<ProtectedRoute requiredRole={UserRole.USER}><UserTeams /></ProtectedRoute>} />
      <Route path="/teams/:teamId/projects" element={<ProtectedRoute requiredRole={UserRole.USER}><TeamProjectsPage /></ProtectedRoute>} />
      <Route path="/projects/:id" element={<ProtectedRoute requiredRole={UserRole.USER}><ProjectKanbanPage /></ProtectedRoute>} />
      <Route path="/tasks/:id" element={<ProtectedRoute requiredRole={UserRole.USER}><TaskDetailPage /></ProtectedRoute>} />
      <Route path="/my-tasks" element={<ProtectedRoute requiredRole={UserRole.USER}><MyTasksPage /></ProtectedRoute>} />
      <Route path="/profile"  element={<ProtectedRoute requiredRole={UserRole.USER}><ProfilePage /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin"       element={<ProtectedRoute requiredRole={UserRole.ADMIN}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requiredRole={UserRole.ADMIN}><UsersPage /></ProtectedRoute>} />
      <Route path="/admin/teams" element={<ProtectedRoute requiredRole={UserRole.ADMIN}><AllTeamsPage /></ProtectedRoute>} />
      <Route path="/admin/projects" element={<ProtectedRoute requiredRole={UserRole.ADMIN}><AllProjectsPage /></ProtectedRoute>} />
      <Route path="/admin/health" element={<ProtectedRoute requiredRole={UserRole.ADMIN}><HealthDashboard /></ProtectedRoute>} />
      <Route path="/admin/tags" element={<ProtectedRoute requiredRole={UserRole.ADMIN}><TagsPage /></ProtectedRoute>} />
      <Route path="/admin/audit-log"  element={<ProtectedRoute requiredRole={UserRole.ADMIN}><AuditLogPage /></ProtectedRoute>} />

      <Route path="/" element={<LandingPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*"    element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
