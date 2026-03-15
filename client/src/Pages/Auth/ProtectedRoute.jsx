import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// adminOnly  → only ADMIN can pass
// recruiterOnly → only RECRUITER can pass
// default    → any authenticated user (CANDIDATE) can pass
export default function ProtectedRoute({ adminOnly = false, recruiterOnly = false }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (adminOnly && user?.role !== 'ADMIN')
    return <Navigate to="/dashboard" replace />;

  if (recruiterOnly && user?.role !== 'RECRUITER')
    return <Navigate to="/dashboard" replace />;

  // Prevent candidates from accessing admin/recruiter routes accidentally
  if (!adminOnly && !recruiterOnly && user?.role === 'ADMIN')
    return <Navigate to="/admin/dashboard" replace />;

  if (!adminOnly && !recruiterOnly && user?.role === 'RECRUITER')
    return <Navigate to="/recruiter/dashboard" replace />;

  return <Outlet />;
}