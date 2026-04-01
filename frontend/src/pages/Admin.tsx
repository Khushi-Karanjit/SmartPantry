import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  BookOpen,
  Users,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Clock,
  Tag,
  Menu,
  Eye,
  EyeOff,
  Refrigerator,
  Zap,
  Flame,
  Utensils,
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import PageSkeleton from "../components/PageSkeleton";
import { getUser } from "../auth/auth";
import {
  getAdminStatsApi,
  getAdminActivitiesApi,
  updateRecipeStatusApi,
  deleteRecipeApi,
  type AdminStats,
  type AdminActivity
} from "../api/api";
import "../styles/admin.css";

function statusClass(status: string) {
  if (status === "published") return "tag green";
  if (status === "draft") return "tag yellow";
  return "tag gray";
}

function AdminTopbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const user = getUser();
  return (
    <div className="topbar admin-topbar">
      <div className="topbar-left">
        <button className="icon-btn hamburger" onClick={onOpenMenu} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div>
          <h1>Admin Control Center</h1>
          <p>
            Welcome {user?.username ?? "Admin"}. Manage recipes, reviews, and content health.
          </p>
        </div>
      </div>
      <button className="icon-btn admin-bell" aria-label="Admin alerts">
        <ShieldCheck size={20} />
      </button>
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recipes, setRecipes] = useState<AdminActivity[]>([]);
  const [popularRecipes, setPopularRecipes] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, activitiesRes] = await Promise.all([
        getAdminStatsApi(),
        getAdminActivitiesApi(),
      ]);
      setStats(statsRes.stats);
      setRecipes(activitiesRes.recentRecipes);
      setPopularRecipes(activitiesRes.popularRecipes);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "published" ? "draft" : "published";
      await updateRecipeStatusApi(id, newStatus);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) return;
    try {
      await deleteRecipeApi(id);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || "Failed to delete recipe");
    }
  };

  if (loading && !stats) {
    return (
      <DashboardLayout topbar={(openMenu) => <AdminTopbar onOpenMenu={openMenu} />}>
        <PageSkeleton cards={4} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout topbar={(openMenu) => <AdminTopbar onOpenMenu={openMenu} />}>
      {error && <div className="admin-error-banner">{error}</div>}

      <section className="admin-hero card">
        <div>
          <div className="admin-kicker">
            <Sparkles size={16} />
            Admin workspace
          </div>
          <h2>Keep SmartPantry clean, current, and curated.</h2>
          <p>
            Review new submissions, refine recipe quality, and keep content standards sharp.
          </p>
        </div>
        <div className="admin-actions">
          <button className="admin-btn primary" onClick={() => navigate("/admin/recipes/new")}>
            <Plus size={16} /> New Recipe
          </button>
          <button className="admin-btn ghost">
            <Tag size={16} /> Manage Tags
          </button>
        </div>
      </section>

      <div className="admin-grid-4">
        <div className="card admin-stat">
          <div className="stat-icon green">
            <BookOpen size={18} />
          </div>
          <div>
            <div className="stat-label">Total Recipes</div>
            <div className="stat-value">{stats?.totalRecipes ?? 0}</div>
            <div className="stat-sub">{stats?.publishedRecipes ?? 0} published</div>
          </div>
        </div>
        <div className="card admin-stat">
          <div className="stat-icon yellow">
            <Users size={18} />
          </div>
          <div>
            <div className="stat-label">Total Users</div>
            <div className="stat-value">{stats?.totalUsers ?? 0}</div>
            <div className="stat-sub">Active community</div>
          </div>
        </div>
        <div className="card admin-stat">
          <div className="stat-icon blue">
            <Refrigerator size={18} />
          </div>
          <div>
            <div className="stat-label">Pantry Items</div>
            <div className="stat-value">{stats?.totalPantryItems ?? 0}</div>
            <div className="stat-sub">Current stock tracked</div>
          </div>
        </div>
        <div className="card admin-stat">
          <div className="stat-icon red">
            <Zap size={18} />
          </div>
          <div>
            <div className="stat-label">Cooking Logs</div>
            <div className="stat-value">{stats?.totalCookingActivities ?? 0}</div>
            <div className="stat-sub">Actions recorded</div>
          </div>
        </div>
      </div>

      <div className="admin-grid-2" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card admin-stat highlight">
          <div className="stat-icon orange">
            <Flame size={18} />
          </div>
          <div>
            <div className="stat-label">Most Cooked Recipe</div>
            <div className="stat-value small">{stats?.mostCookedRecipe || "None"}</div>
          </div>
        </div>
        <div className="card admin-stat highlight">
          <div className="stat-icon purple">
            <Utensils size={18} />
          </div>
          <div>
            <div className="stat-label">Most Used Ingredient</div>
            <div className="stat-value small">{stats?.mostUsedIngredient || "None"}</div>
          </div>
        </div>
      </div>

      <div className="admin-grid-2">
        <section className="card admin-section">
          <div className="section-head">
            <h3 className="section-title">Recent Recipe Activity</h3>
            <button className="admin-btn small primary">
              <Plus size={14} /> Add recipe
            </button>
          </div>
          <div className="admin-table">
            <div className="admin-row admin-head">
              <div>Recipe</div>
              <div>Status</div>
              <div>Updated</div>
              <div>Actions</div>
            </div>
            {recipes.length === 0 && <div className="admin-empty">No recipes found.</div>}
            {recipes.map((recipe) => (
              <div className="admin-row" key={recipe._id}>
                <div className="cell-title">{recipe.name}</div>
                <div>
                  <span className={statusClass(recipe.status)}>{recipe.status}</span>
                </div>
                <div className="muted">{new Date(recipe.updatedAt).toLocaleDateString()}</div>
                <div className="row-actions">
                  <button
                    className="icon-action"
                    onClick={() => navigate(`/admin/recipes/edit/${recipe._id}`)}
                    aria-label={`Edit ${recipe.name}`}
                    title="Edit Recipe"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="icon-action"
                    onClick={() => handleStatusUpdate(recipe._id, recipe.status)}
                    aria-label={`Toggle status for ${recipe.name}`}
                    title={recipe.status === "published" ? "Unpublish" : "Publish"}
                  >
                    {recipe.status === "published" ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    className="icon-action danger"
                    onClick={() => handleDelete(recipe._id)}
                    aria-label={`Delete ${recipe.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-section">
          <div className="section-head">
            <h3 className="section-title">Popular Recipes</h3>
          </div>
          <div className="admin-list">
            {popularRecipes.length === 0 && <div className="admin-empty">No popular recipes yet.</div>}
            {popularRecipes.map((recipe) => (
              <div className="plan-item" key={recipe._id}>
                <div className="plan-day">{recipe.views ?? 0} views</div>
                <div>
                  <div className="plan-recipe">{recipe.name}</div>
                  <div className="plan-meta">{recipe.status}</div>
                </div>
                <button 
                  className="admin-btn tiny ghost" 
                  onClick={() => navigate(`/admin/recipes/edit/${recipe._id}`)}
                >
                  <Pencil size={12} /> Edit
                </button>
              </div>
            ))}
          </div>
          <div className="admin-subnote">
            <Clock size={14} /> Most viewed recipes by users.
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

