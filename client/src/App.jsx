import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider }  from './contexts/ThemeContext';
import { AuthProvider }   from './contexts/AuthContext';
import ProtectedRoute     from './pages/Auth/ProtectedRoute';
import Layout             from './components/Layout/Layout';
import Home               from './pages/Home/Home';

// ── Auth ──
import Login             from './pages/Auth/Login';
import AdminLogin        from './pages/Auth/AdminLogin';
import Register          from './pages/Auth/Register';
import RecruiterRegister from './pages/Auth/RecruiterRegister';

// ── Profile setup (after register) ──
import ProfileSetup from './pages/Profile/ProfileSetup';

// ── Candidate ──
import Dashboard       from './pages/Dashboard/Dashboard';
import UpdateDashboard from './pages/Dashboard/UpdateDashboard';
import DomainSelection from './pages/Domain/DomainSelection';
import DomainDashboard from './pages/Domain/DomainDashboard';
import ProblemLobby    from './pages/Problem/ProblemLobby';
import ProblemView     from './pages/Problem/ProblemView';

// ── Admin ──
import AdminDashboard from './pages/Admin/AdminDashboard';

// ── Recruiter ──
import RecruiterDashboard from './pages/Recruiter/RecruiterDashboard';
import RecCandidates      from './pages/Recruiter/RecCandidates';

// ── Exam / Contest ──
import ExamLobby    from './Exam/ExamLobby';
import ExamView     from './Exam/ExamView';
import Coderunner   from './Exam/CodeRunner';
import CreateEvent  from './Exam/AdminAcess';
import ContestLobby from './Contests/ContestLobby';
import ContestView  from './Contests/ContestView';
// import examRouter   from './routes/exam.routes.jsx';
// import ContestLobby from './Contests/ContestLobby';
// import ContestView  from './Contests/ContestView';

import './styles/globals.css';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* ── Public ── */}
            <Route path="/"                   element={<Navigate to="/home" replace />} />
            <Route path="/login"              element={<Login />} />
            <Route path="/admin/login"        element={<AdminLogin />} />
            <Route path="/register"           element={<Register />} />
            <Route path="/recruiter/register" element={<RecruiterRegister />} />
            <Route path="/home"               element={<Home />} />

            {/* ── Profile setup: protected but no layout (standalone page) ── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile/setup" element={<ProfileSetup />} />
              <Route path="/admin/exam-creator" element={<CreateEvent />} />
            </Route>

            {/* ── Candidate (role: CANDIDATE) ── */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard"           element={<Dashboard />} />
                <Route path="/updatedashboard"     element={<UpdateDashboard />} />
                <Route path="/profile"             element={<ProfileSetup />} />
                <Route path="/domain/selection"    element={<DomainSelection />} />
                <Route path="/domain/:domainId"    element={<DomainDashboard />} />
                <Route path="/problems"            element={<ProblemLobby />} />
                <Route path="/problem/:problemId"  element={<ProblemView />} />
                <Route path="/exams"               element={<ExamLobby />} />
                <Route path="/exam/:problemId"     element={<ExamView />} />
                <Route path="/CodeRunner"          element={<Coderunner />} />
              </Route>
            </Route>

            {/* ── Admin (role: ADMIN) ── */}
            <Route element={<ProtectedRoute adminOnly />}>
              <Route element={<Layout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/students"  element={<AdminDashboard />} />
                <Route path="/admin/analytics" element={<AdminDashboard />} />
                <Route path="/admin/placement" element={<AdminDashboard />} />
              </Route>
            </Route>

            {/* ── Recruiter (role: RECRUITER) ── */}
            <Route element={<ProtectedRoute recruiterOnly />}>
              <Route element={<Layout />}>
                <Route path="/recruiter/dashboard"  element={<RecruiterDashboard />} />
                <Route path="/recruiter/candidates" element={<RecCandidates />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}