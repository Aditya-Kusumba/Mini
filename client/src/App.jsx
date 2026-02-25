import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';

// Import Layout and Page Components
import Layout from './Components/Layout/Layout';
import Home from './Pages/Home/Home';
import Login from './Pages/Auth/Login';
import Register from './Pages/Auth/Register';
import RecruiterRegister from './Pages/Auth/RecruiterRegister';
import RecruiterLogin from './Pages/Auth/RecruiterLogin';
import Dashboard from './Pages/Dashboard/Dashboard';
import DomainSelection from './Pages/Domain/DomainSelection';
import DomainOverview from './CandidateDomainDashboard';
import ExamSystem from './Pages/Exam/ExamSystem';
import ProblemLobby from './Pages/Problem/ProblemLobby';
import ProblemView from './Pages/Problem/ProblemView';
import RecruiterDashboard from './Pages/Recruiter/RecruiterDashboard';
import Profile from './Pages/Profile/Profile';
import DomainsList from './CandidateDomainDashboard'
import UpdateDashboard from './Pages/UpdateDashboard';
import DomainDash from './DomainDash';
import Coderunner from './Exam/CodeRunner';
import ExamLobby from './Exam/ExamLobby';
import ExamView from './Exam/ExamView'
import CreateEvent from './Exam/AdminAcess';
import ContestLobby from './Contests/ContestLobby';
import ContestView from './Contests/ContestView';
import AdminLogin from './Pages/Auth/AdminLogin';
import PastPerformance from './Pages/Dashboard/PastPerformance'
import RecCandidates from './Pages/Recruiter/RecCandidates';
import ProtectedRoute from './Pages/Auth/ProtectedRoute';

import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/recruiter/login" element={<RecruiterLogin />} />
              <Route path="/recruiter/register" element={<RecruiterRegister />} />
              <Route path="/adminlogin" element={<AdminLogin />} />

            <Route element={<ProtectedRoute/>}>
              <Route path="/admin" element={<CreateEvent />} />
              <Route element={<Layout />}>
                <Route path="/updatedashboard" element={<UpdateDashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/domain/selection" element={<DomainsList />} />
                <Route path="/domain/:domainId" element={<DomainDash />} />
                <Route path="/problems" element={<ProblemLobby />} />
                <Route path="/problem/:problemId" element={<ProblemView />} />
                <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
                <Route path="/recruiter/candidates" element={<RecCandidates />} />
                <Route path="/profile" element={<UpdateDashboard />} />
                <Route path="/pastperformance" element={<PastPerformance />} />
                <Route path="/contest/:contestId" element={<ContestView />} />
                <Route path="/contests" element={<ContestLobby />} />
                <Route path="/CodeRunner" element={<Coderunner/>}/>
                <Route path="/exams" element={<ExamLobby/>}/>
                <Route path="/exam/:problemId" element={<ExamView/>}/>
              </Route>
            </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;