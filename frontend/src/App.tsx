import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./routes/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import PantrySetup from "./pages/PantrySetup";
import Pantry from "./pages/Pantry";
import MealPlanner from "./pages/MealPlanner";
import Recipes from "./pages/Recipes";
import RecipeDetail from "./pages/RecipeDetail";
import AdminCreateRecipe from "./pages/AdminCreateRecipe";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pantry-setup" element={<PantrySetup />} />
        <Route path="pantry" element={<Pantry />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/recipes/new"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminCreateRecipe />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/recipes/edit/:id"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminCreateRecipe />
            </ProtectedRoute>
          }
        />

        {/* Placeholder routes so sidebar links don't 404 yet */}
        <Route path="/pantry" element={<ProtectedRoute><Pantry /></ProtectedRoute>} />
        <Route path="/pantry-setup" element={<ProtectedRoute><PantrySetup /></ProtectedRoute>} />
        <Route path="/recipes" element={<ProtectedRoute><Recipes /></ProtectedRoute>} />
        <Route path="/recipes/:id" element={<ProtectedRoute><RecipeDetail /></ProtectedRoute>} />
        <Route path="/meal-planner" element={<ProtectedRoute><MealPlanner /></ProtectedRoute>} />
        <Route path="/shopping-list" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
