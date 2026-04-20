import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Login from "./pages/Login";

const ProtectedRoute = ({ children }) => {
  const token = sessionStorage.getItem("token");
  
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/admin" element={
          <ProtectedRoute><Admin /></ProtectedRoute>
        } />

      </Routes>
    </BrowserRouter>
  );
}

export default App;