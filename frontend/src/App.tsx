import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./routes/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import PantrySetup from "./pages/PantrySetup";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pantry-setup" element={<PantrySetup />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Placeholder routes so sidebar links don't 404 yet */}
        <Route path="/pantry" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/pantry-setup" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/recipes" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/meal-planner" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/shopping-list" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
