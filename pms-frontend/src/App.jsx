import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebars from "./components/Sidebars";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import HowItWorks from "./pages/HowItWorks";
import AboutSane from "./pages/AboutSane";
import Resources from "./pages/Resources";
import Pricing from "./pages/Pricing";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AcceptInvite from "./pages/AcceptInvite";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Tasks from "./pages/Tasks";
import TaskDetails from "./pages/TaskDetails";
import Users from "./pages/Users";
import "bootstrap/dist/css/bootstrap.min.css";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="app-shell">
      {/* Mobile top bar — hidden on desktop via CSS */}
      <div className="mobile-topbar">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <span /><span /><span />
        </button>
        <div className="mobile-brand-mark">S</div>
        <span className="mobile-brand-name">SANE</span>
      </div>

      {/* Backdrop overlay — visible only on mobile when sidebar open */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebars isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/welcome"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LandingPage />}
        />
        <Route
          path="/how-it-works"
          element={isAuthenticated ? <Navigate to="/" replace /> : <HowItWorks />}
        />
        <Route
          path="/about"
          element={isAuthenticated ? <Navigate to="/" replace /> : <AboutSane />}
        />
        <Route
          path="/resources"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Resources />}
        />
        <Route
          path="/pricing"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Pricing />}
        />
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Signup />}
        />
        <Route
          path="/forgot-password"
          element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />}
        />
        <Route
          path="/reset-password"
          element={isAuthenticated ? <Navigate to="/" replace /> : <ResetPassword />}
        />
        <Route
          path="/accept-invite"
          element={<AcceptInvite />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/:id" element={<TaskDetails />} />
          <Route path="users" element={<Users />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  try {
    return (
      <AuthProvider>
        <AppRoutes />
        <SpeedInsights />
      </AuthProvider>
    );
  } catch (error) {
    console.error("Error in App:", error);
    return <div>Error: {error.message}</div>;
  }
}

export default App;
