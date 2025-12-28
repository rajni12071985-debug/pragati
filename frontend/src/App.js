import '@fontsource/outfit/600.css';
import '@fontsource/outfit/700.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import InterestSelection from './pages/InterestSelection';
import Dashboard from './pages/Dashboard';
import CreateTeam from './pages/CreateTeam';
import JoinTeam from './pages/JoinTeam';
import TeamRequests from './pages/TeamRequests';
import TeamDetails from './pages/TeamDetails';
import TeamChat from './pages/TeamChat';
import Events from './pages/Events';
import Notifications from './pages/Notifications';
import Svietbook from './pages/Svietbook';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import LeaveApplication from './pages/LeaveApplication';

function App() {
  const [currentStudent, setCurrentStudent] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const savedStudent = localStorage.getItem('camplink_student');
    const savedAdmin = localStorage.getItem('camplink_admin');
    
    if (savedStudent) {
      setCurrentStudent(JSON.parse(savedStudent));
    }
    if (savedAdmin === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const handleLogin = (student) => {
    setCurrentStudent(student);
    localStorage.setItem('camplink_student', JSON.stringify(student));
  };

  const handleAdminLogin = () => {
    setIsAdmin(true);
    localStorage.setItem('camplink_admin', 'true');
  };

  const handleLogout = () => {
    setCurrentStudent(null);
    localStorage.removeItem('camplink_student');
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('camplink_admin');
  };

  return (
    <div className="App min-h-screen bg-[#020617]">
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              currentStudent ? (
                <Navigate to="/interests" replace />
              ) : (
                <LoginPage onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/interests"
            element={
              currentStudent ? (
                <InterestSelection student={currentStudent} onUpdate={handleLogin} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              currentStudent ? (
                <Dashboard student={currentStudent} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/create-team"
            element={
              currentStudent ? (
                <CreateTeam student={currentStudent} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/join-team"
            element={
              currentStudent ? (
                <JoinTeam student={currentStudent} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/team-requests"
            element={
              currentStudent ? (
                <TeamRequests student={currentStudent} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/team/:teamId"
            element={
              currentStudent ? (
                <TeamDetails student={currentStudent} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/team/:teamId/chat"
            element={
              currentStudent ? (
                <TeamChat student={currentStudent} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/events"
            element={
              currentStudent ? (
                <Events student={currentStudent} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/notifications"
            element={
              currentStudent ? (
                <Notifications student={currentStudent} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/svietbook"
            element={
              currentStudent ? (
                <Svietbook student={currentStudent} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/admin"
            element={
              isAdmin ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <AdminLogin onLogin={handleAdminLogin} />
              )
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              isAdmin ? (
                <AdminDashboard onLogout={handleAdminLogout} />
              ) : (
                <Navigate to="/admin" replace />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
