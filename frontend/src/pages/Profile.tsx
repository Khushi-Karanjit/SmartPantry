import { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Edit2, 
  Lock, 
  History, 
  Bookmark, 
  Save, 
  X,
  ChefHat,
  Refrigerator,
  Utensils,
  Trash2
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import PageSkeleton from "../components/PageSkeleton";
import { 
  getProfileApi, 
  updateProfileApi, 
  changePasswordApi, 
  toggleSaveRecipeApi,
  type UserProfile,
} from "../api/api";
import "../styles/admin.css"; // Reuse admin styles for consistency

export default function Profile() {
  const [data, setData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "security" | "activity">("overview");

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: "", email: "", avatarUrl: "" });
  const [updateLoading, setUpdateLoading] = useState(false);

  // Password State
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passLoading, setPassLoading] = useState(false);
  const [passSuccess, setPassSuccess] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getProfileApi();
      setData(res);
      setEditForm({ 
        username: res.profile.username, 
        email: res.profile.email, 
        avatarUrl: res.profile.avatarUrl || "" 
      });
    } catch (err: any) {
      alert(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdateLoading(true);
      await updateProfileApi(editForm);
      setIsEditing(false);
      fetchProfile();
    } catch (err: any) {
      alert(err.message || "Update failed");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      return alert("New passwords do not match");
    }
    try {
      setPassLoading(true);
      await changePasswordApi({ 
        currentPassword: passForm.currentPassword, 
        newPassword: passForm.newPassword 
      });
      setPassSuccess("Password updated successfully!");
      setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPassSuccess(""), 3000);
    } catch (err: any) {
      alert(err.message || "Password change failed");
    } finally {
      setPassLoading(false);
    }
  };

  const handleUnsave = async (id: string) => {
    try {
      await toggleSaveRecipeApi(id);
      fetchProfile();
    } catch (err: any) {
      alert("Failed to unsave recipe");
    }
  };

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      {loading && !data ? (
        <PageSkeleton cards={2} />
      ) : (
        <div className="admin-page-content">
          <div className="admin-grid-2">
          {/* Left Column: Essential Info & Tabs */}
          <div className="profile-main-stack">
            <section className="card person-hero">
              <div className="person-avatar-wrap">
                {data?.profile.avatarUrl ? (
                  <img src={data.profile.avatarUrl} alt="Avatar" className="person-avatar" />
                ) : (
                  <div className="person-avatar-placeholder">
                    {data?.profile.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="person-meta">
                <h2>{data?.profile.username}</h2>
                <div className="muted">{data?.profile.email}</div>
                <div className="tag-row" style={{ marginTop: 8 }}>
                  <span className={`tag ${data?.profile.role === 'admin' ? 'purple' : 'gray'}`}>
                    {data?.profile.role?.toUpperCase()}
                  </span>
                </div>
              </div>
            </section>

            <div className="profile-tabs">
              <button 
                className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <User size={16} /> Overview
              </button>
              <button 
                className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <Lock size={16} /> Security
              </button>
              <button 
                className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
                onClick={() => setActiveTab('activity')}
              >
                <History size={16} /> Activity
              </button>
            </div>

            {activeTab === 'overview' && (
              <section className="card admin-section">
                <div className="section-head">
                  <h3 className="section-title">Personal Details</h3>
                  {!isEditing ? (
                    <button className="admin-btn small ghost" onClick={() => setIsEditing(true)}>
                      <Edit2 size={14} /> Edit Profile
                    </button>
                  ) : (
                    <button className="admin-btn small ghost danger" onClick={() => setIsEditing(false)}>
                      <X size={14} /> Cancel
                    </button>
                  )}
                </div>

                {!isEditing ? (
                  <div className="details-list">
                    <div className="detail-item">
                      <Mail size={16} />
                      <div>
                        <div className="muted label">Email Address</div>
                        <div>{data?.profile.email}</div>
                      </div>
                    </div>
                    <div className="detail-item">
                      <Shield size={16} />
                      <div>
                        <div className="muted label">Account Role</div>
                        <div>{data?.profile.role}</div>
                      </div>
                    </div>
                    <div className="detail-item">
                      <Calendar size={16} />
                      <div>
                        <div className="muted label">Member Since</div>
                        <div>{new Date(data?.profile.createdAt || "").toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateProfile} className="profile-form">
                    <div className="input-group">
                      <label>Username</label>
                      <input 
                        type="text" 
                        value={editForm.username}
                        onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label>Email Address</label>
                      <input 
                        type="email" 
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label>Avatar URL (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="https://example.com/photo.jpg"
                        value={editForm.avatarUrl}
                        onChange={(e) => setEditForm({...editForm, avatarUrl: e.target.value})}
                      />
                    </div>
                    <button type="submit" className="admin-btn primary" disabled={updateLoading}>
                      <Save size={16} /> {updateLoading ? "Saving..." : "Save Changes"}
                    </button>
                  </form>
                )}
              </section>
            )}

            {activeTab === 'security' && (
              <section className="card admin-section">
                <div className="section-head">
                  <h3 className="section-title">Change Password</h3>
                </div>
                {passSuccess && <div className="status-success">{passSuccess}</div>}
                <form onSubmit={handleChangePassword} className="profile-form">
                  <div className="input-group">
                    <label>Current Password</label>
                    <input 
                      type="password" 
                      value={passForm.currentPassword}
                      onChange={(e) => setPassForm({...passForm, currentPassword: e.target.value})}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>New Password</label>
                    <input 
                      type="password" 
                      value={passForm.newPassword}
                      onChange={(e) => setPassForm({...passForm, newPassword: e.target.value})}
                      minLength={6}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Confirm New Password</label>
                    <input 
                      type="password" 
                      value={passForm.confirmPassword}
                      onChange={(e) => setPassForm({...passForm, confirmPassword: e.target.value})}
                      required
                    />
                  </div>
                  <button type="submit" className="admin-btn primary" disabled={passLoading}>
                    <Lock size={16} /> {passLoading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </section>
            )}

            {activeTab === 'activity' && (
              <section className="card admin-section">
                <div className="section-head">
                  <h3 className="section-title">Cooking History</h3>
                </div>
                <div className="admin-table">
                  <div className="admin-row admin-head" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
                    <div>Recipe</div>
                    <div style={{ textAlign: 'right' }}>Date</div>
                  </div>
                  {data?.recentLogs.length === 0 && <div className="admin-empty">No recipes cooked yet.</div>}
                  {data?.recentLogs.map((log: any) => (
                    <div className="admin-row" key={log._id} style={{ gridTemplateColumns: '1.5fr 1fr' }}>
                      <div className="cell-icon-wrap">
                        <ChefHat size={14} className="muted" />
                        <span className="cell-title">{log.recipeId?.name || "Recipe"}</span>
                      </div>
                      <div className="muted" style={{ textAlign: 'right' }}>
                        {new Date(log.performedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Stats & Saved Recipes */}
          <div className="profile-side-stack">
            <section className="card mini-stats">
              <div className="mini-stat">
                <Refrigerator size={20} className="blue" />
                <div>
                  <div className="stat-val">{data?.stats.totalPantryItems}</div>
                  <div className="stat-lbl">Pantry Items</div>
                </div>
              </div>
              <div className="mini-stat">
                <ChefHat size={20} className="green" />
                <div>
                  <div className="stat-val">{data?.stats.totalCooked}</div>
                  <div className="stat-lbl">Times Cooked</div>
                </div>
              </div>
              <div className="mini-stat">
                <Utensils size={20} className="orange" />
                <div>
                  <div className="stat-val h-text">{data?.stats.mostStoredIngredient}</div>
                  <div className="stat-lbl">Main Ingredient</div>
                </div>
              </div>
            </section>

            <section className="card admin-section">
              <div className="section-head">
                <h3 className="section-title"><Bookmark size={18} /> Saved Recipes</h3>
              </div>
              <div className="saved-list">
                {data?.savedRecipes.length === 0 && <div className="admin-empty small">No saved recipes.</div>}
                {data?.savedRecipes.map((item: any) => (
                  <div className="saved-recipe-card" key={item._id}>
                    <div className="saved-body">
                      <div className="cell-title">{item.recipeId?.name}</div>
                      <div className="muted small-tags">
                        <span>{item.recipeId?.cuisine}</span>
                        <span>•</span>
                        <span>{item.recipeId?.prepMinutes}m</span>
                      </div>
                    </div>
                    <button className="icon-action danger" onClick={() => handleUnsave(item.recipeId._id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
      )}
    </DashboardLayout>
  );
}
