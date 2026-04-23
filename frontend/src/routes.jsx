import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Login from "./pages/Login";

const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem("token");
  
  // BUG FIX: sessionStorage returns null if empty. 
  // Added checks for "null" or "undefined" strings to prevent unauthorized bypass.
  if (!token || token === "" || token === "null" || token === "undefined") {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      } />

      {/* BUG FIX: Catch-all route to prevent blank screens on invalid URLs */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}