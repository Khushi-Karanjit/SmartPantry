import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import AdminUsers from "./pages/AdminUsers";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminLogs from "./pages/AdminLogs";
import AdminManageRecipes from "./pages/AdminManageRecipes";
import SavedRecipes from "./pages/SavedRecipes";
import Profile from "./pages/Profile";
import RecipeSuggester from "./pages/RecipeSuggester";
import Analytics from "./pages/Analytics";
import Notifications from "./pages/Notifications";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pantry-setup" element={<ProtectedRoute><PantrySetup /></ProtectedRoute>} />
        <Route path="/home" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />
        <Route path="/admin/recipes" element={<ProtectedRoute requiredRole="admin"><AdminManageRecipes /></ProtectedRoute>} />
        <Route path="/admin/recipes/new" element={<ProtectedRoute requiredRole="admin"><AdminCreateRecipe /></ProtectedRoute>} />
        <Route path="/admin/recipes/edit/:id" element={<ProtectedRoute requiredRole="admin"><AdminCreateRecipe /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute requiredRole="admin"><AdminAnalytics /></ProtectedRoute>} />
        <Route path="/admin/logs" element={<ProtectedRoute requiredRole="admin"><AdminLogs /></ProtectedRoute>} />
        <Route path="/pantry" element={<ProtectedRoute><Pantry /></ProtectedRoute>} />
        <Route path="/recipes/favourites" element={<ProtectedRoute><SavedRecipes /></ProtectedRoute>} />
        <Route path="/recipes" element={<ProtectedRoute><Recipes /></ProtectedRoute>} />
        <Route path="/recipes/:id" element={<ProtectedRoute><RecipeDetail /></ProtectedRoute>} />
        <Route path="/recipe-suggester" element={<ProtectedRoute><RecipeSuggester /></ProtectedRoute>} />
        <Route path="/meal-planner" element={<ProtectedRoute><MealPlanner /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
