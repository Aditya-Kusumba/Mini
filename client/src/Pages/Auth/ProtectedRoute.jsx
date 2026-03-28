import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ adminOnly = false, recruiterOnly = false }) {
  const { isAuthenticated, user, loading } = useAuth();

  // Still checking auth — show nothing (prevents flash redirect)
  if (loading) return null;

  // Not logged in → go to login
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Wrong role checks
  if (adminOnly    && user?.role !== 'ADMIN')     return <Navigate to="/dashboard" replace />;
  if (recruiterOnly && user?.role !== 'RECRUITER') return <Navigate to="/dashboard" replace />;

  // Candidate trying to access admin/recruiter routes
  if (!adminOnly && !recruiterOnly && user?.role === 'ADMIN')
    return <Navigate to="/admin/dashboard" replace />;
  if (!adminOnly && !recruiterOnly && user?.role === 'RECRUITER')
    return <Navigate to="/recruiter/dashboard" replace />;

  return <Outlet />;
}