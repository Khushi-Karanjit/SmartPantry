import { useState, useEffect } from "react";
import { 
  Search, 
  UserX, 
  UserCheck, 
  Trash2, 
  Users
} from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import PageSkeleton from "../components/PageSkeleton";
import { 
  getAdminUsersApi, 
  toggleUserStatusApi, 
  deleteUserApi, 
} from "../api/api";
import type { AdminUser } from "../api/api";
import "../styles/admin.css";

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [q]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAdminUsersApi(q);
      setUsers(res.users);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleUserStatusApi(id);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to update user status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      await deleteUserApi(id);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || "Failed to delete user");
    }
  };

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      {loading && users.length === 0 ? (
        <PageSkeleton cards={5} />
      ) : (
        <div className="admin-page-content">
        <section className="card admin-section">
          <div className="section-head">
            <h3 className="section-title"><Users size={18} /> Community Directory</h3>
            <div className="search-wrap">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="admin-error-banner">{error}</div>}

          <div className="admin-table">
            <div className="admin-row admin-head">
              <div>User</div>
              <div>Role</div>
              <div>Status</div>
              <div>Joined</div>
              <div style={{ textAlign: 'right' }}>Actions</div>
            </div>

            {!loading && users.length === 0 && <div className="admin-empty">No users found.</div>}

            {users.map((user) => (
              <div className="admin-row" key={user._id}>
                <div>
                  <div className="cell-title">{user.username}</div>
                  <div className="muted">{user.email}</div>
                </div>
                <div>
                  <span className={`tag ${user.role === 'admin' ? 'purple' : 'gray'}`}>{user.role}</span>
                </div>
                <div>
                  <span className={`tag ${user.isActive ? 'green' : 'red'}`}>
                    {user.isActive ? "Active" : "Deactivated"}
                  </span>
                </div>
                <div className="muted">{new Date(user.createdAt).toLocaleDateString()}</div>
                <div className="row-actions">
                  <button 
                    className="icon-action" 
                    onClick={() => handleToggleStatus(user._id)}
                    title={user.isActive ? "Deactivate" : "Activate"}
                  >
                    {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                  </button>
                  <button 
                    className="icon-action danger" 
                    onClick={() => handleDelete(user._id)}
                    title="Delete User"
                    disabled={user.role === 'admin'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      )}
    </DashboardLayout>
  );
}
