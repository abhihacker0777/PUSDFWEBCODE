import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useState, useEffect } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const Admin = lazy(() => import("./pages/Admin"));

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null means "checking"

  useEffect(() => {
    // 🛡️ SECURITY: Verify the session with the server via the secure cookie
    fetch(`${BACKEND_URL}/me`, { 
      method: "GET",
      credentials: "include" 
    })
      .then(res => setIsAuthenticated(res.ok))
      .catch(() => setIsAuthenticated(false));
  }, []);

  // While checking, show a minimal loading state or nothing
  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">Verifying session...</div>;
  }

  // If check finished and user is not authenticated, kick to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated
  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/admin" element={
        <ProtectedRoute>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading admin...</div>}>
            <Admin />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
