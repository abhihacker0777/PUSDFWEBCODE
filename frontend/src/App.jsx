import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
// BUG FIX: Ensuring the import matches your previous LoginPage component
import Login from "./pages/Login"; 

const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem("token");
  
  // BUG FIX: Strengthened check to prevent "undefined" strings from bypassing security
  if (!token || token === "undefined" || token === "null") {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Home Route */}
        <Route path="/" element={<Home />} />

        {/* Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Admin Route */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        } />

        {/* BUG FIX: Catch-all route to prevent blank screens on typos */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;