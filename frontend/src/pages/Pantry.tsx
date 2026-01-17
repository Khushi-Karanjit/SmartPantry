// frontend/src/pages/Pantry.tsx
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import "../styles/Pantry.css";
import {
  Plus,
  Search,
  SlidersHorizontal,
  ChevronDown,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Loader2,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

type Category = {
  _id: string;
  name: string;
  shelfLifeDays: number;
};

type PantryItem = {
  _id: string;
  name: string;

  // Backend returns computed fields:
  category: string; // category name (computed in backend)
  categoryId?: string | { _id: string; name?: string; shelfLifeDays?: number }; // may be id or populated object
  shelfLifeDays?: number;

  quantity: number;
  unit: string;
  expiryDate: string | null; // computed by backend
  source?: "manual" | "preset";
  presetKey?: string | null;
};

function getToken() {
  return localStorage.getItem("token") || "";
}

function daysUntil(dateIso: string) {
  const now = new Date();
  const d = new Date(dateIso);
  const ms = d.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function statusOf(item: PantryItem) {
  if (!item.expiryDate) return { label: "Fresh", kind: "fresh" as const };
  const d = daysUntil(item.expiryDate);
  if (d < 0) return { label: "Expired", kind: "expired" as const };
  if (d <= 2) return { label: "Expiring Soon", kind: "soon" as const };
  return { label: "Fresh", kind: "fresh" as const };
}

export default function Pantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Categories (Option B)
  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);

  // UI state
  const [tab, setTab] = useState<"all" | "student" | "nepali" | "italian">("all");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");

  // Add modal (categoryId required)
  const [openAdd, setOpenAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    categoryId: "",
    quantity: 1,
    unit: "pcs",
  });

  // Edit modal (categoryId required)
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<string>("");
  const [editForm, setEditForm] = useState({
    name: "",
    categoryId: "",
    quantity: 1,
    unit: "pcs",
  });

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string>("");

  async function fetchCategories() {
    try {
      setCatLoading(true);
      setError("");

      const token = getToken();
      if (!token) throw new Error("No token found. Please login again.");

      const res = await fetch(`${API_BASE}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load categories.");

      setCategories(data.categories || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load categories.");
    } finally {
      setCatLoading(false);
    }
  }

  async function fetchItems() {
    try {
      setLoading(true);
      setError("");

      const token = getToken();
      if (!token) throw new Error("No token found. Please login again.");

      const res = await fetch(`${API_BASE}/api/pantry`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load pantry items.");

      setItems(data.items || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load pantry items.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select a default categoryId for Add modal
  useEffect(() => {
    if (!addForm.categoryId && categories.length > 0) {
      setAddForm((p) => ({ ...p, categoryId: categories[0]._id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const expiringSoon = useMemo(() => {
    return items.filter((i) => {
      if (!i.expiryDate) return false;
      const d = daysUntil(i.expiryDate);
      return d >= 0 && d <= 2;
    });
  }, [items]);

  const filtered = useMemo(() => {
    let list = [...items];

    if (tab !== "all") {
      list = list.filter((x) => (x.presetKey || "") === tab);
    }

    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((x) => x.name.toLowerCase().includes(s));
    }

    if (category !== "All") {
      list = list.filter((x) => (x.category || "Other") === category);
    }

    list.sort((a, b) => {
      const ad = a.expiryDate ? new Date(a.expiryDate).getTime() : Number.POSITIVE_INFINITY;
      const bd = b.expiryDate ? new Date(b.expiryDate).getTime() : Number.POSITIVE_INFINITY;
      return ad - bd;
    });

    return list;
  }, [items, tab, q, category]);

  function resolveCategoryId(it: PantryItem): string {
    const c = it.categoryId;
    if (!c) return "";
    if (typeof c === "string") return c;
    return c._id || "";
  }

  function openEditModal(it: PantryItem) {
    setEditId(it._id);
    setEditForm({
      name: it.name || "",
      categoryId: resolveCategoryId(it) || addForm.categoryId || "",
      quantity: it.quantity ?? 1,
      unit: it.unit || "pcs",
    });
    setOpenEdit(true);
  }

  async function addItem() {
    try {
      setSaving(true);
      setError("");

      if (!addForm.name.trim()) {
        setError("Item name is required.");
        return;
      }
      if (!addForm.categoryId) {
        setError("Please select a category.");
        return;
      }

      const token = getToken();
      if (!token) throw new Error("No token found. Please login again.");

      const res = await fetch(`${API_BASE}/api/pantry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: addForm.name.trim(),
          categoryId: addForm.categoryId, // ✅ Option B required
          quantity: Number(addForm.quantity) || 1,
          unit: addForm.unit,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to add item.");

      setOpenAdd(false);
      setAddForm({
        name: "",
        categoryId: categories[0]?._id || "",
        quantity: 1,
        unit: "pcs",
      });

      await fetchItems();
    } catch (e: any) {
      setError(e?.message || "Failed to add item.");
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    try {
      setSaving(true);
      setError("");

      if (!editId) return;

      if (!editForm.name.trim()) {
        setError("Item name is required.");
        return;
      }
      if (!editForm.categoryId) {
        setError("Please select a category.");
        return;
      }

      const token = getToken();
      if (!token) throw new Error("No token found. Please login again.");

      const res = await fetch(`${API_BASE}/api/pantry/${editId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          categoryId: editForm.categoryId, // ✅ Option B required
          quantity: Number(editForm.quantity) || 1,
          unit: editForm.unit,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to update item.");

      setOpenEdit(false);
      setEditId("");
      await fetchItems();
    } catch (e: any) {
      setError(e?.message || "Failed to update item.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: string) {
    try {
      setDeletingId(id);
      setError("");

      const ok = confirm("Delete this item? This cannot be undone.");
      if (!ok) return;

      const token = getToken();
      if (!token) throw new Error("No token found. Please login again.");

      const res = await fetch(`${API_BASE}/api/pantry/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to delete item.");

      await fetchItems();
    } catch (e: any) {
      setError(e?.message || "Failed to delete item.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      <div className="pantry-page">
        {/* Header row */}
        <div className="pantry-head">
          <div>
            <h2 className="pantry-title">Pantry Management</h2>
            <p className="pantry-sub">Track and manage your ingredients effectively.</p>
          </div>

          <button
            className="pantry-btn primary"
            onClick={() => {
              if (categories.length === 0) {
                setError('No categories found. Seed the "categories" collection first.');
                return;
              }
              setOpenAdd(true);
            }}
          >
            <Plus size={16} /> Add New Item
          </button>
        </div>

        {/* Tabs */}
        <div className="pantry-tabs">
          <button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>
            My Kitchen
          </button>
          <button className={tab === "student" ? "active" : ""} onClick={() => setTab("student")}>
            Student Essentials
          </button>
          <button className={tab === "nepali" ? "active" : ""} onClick={() => setTab("nepali")}>
            Nepali Kitchen
          </button>
          <button className={tab === "italian" ? "active" : ""} onClick={() => setTab("italian")}>
            Italian Basics
          </button>
        </div>

        {/* Expiry warning bar */}
        {expiringSoon.length > 0 && (
          <div className="pantry-warning">
            <div className="warning-left">
              <div className="warning-icon">
                <AlertCircle size={18} />
              </div>
              <div>
                <div className="warning-title">Use Soon</div>
                <div className="warning-sub">
                  These {expiringSoon.length} items will expire within the next 48 hours.
                </div>
              </div>
            </div>
            <button className="warning-link" onClick={() => setQ("")}>
              Show Items
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="pantry-controls card">
          <div className="search">
            <Search size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ingredients..." />
          </div>

          <button className="filter-btn" type="button">
            <SlidersHorizontal size={16} /> Filter
          </button>

          <div className="category">
            <span>Category</span>
            <div className="category-select">
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {["All", ...categories.map((c) => c.name)].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {/* Errors */}
        {error && <div className="error">{error}</div>}

        {/* Table */}
        {loading ? (
          <div className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Loader2 className="spin" size={16} /> Loading pantry items...
          </div>
        ) : (
          <div className="card pantry-table-wrap">
            <table className="pantry-table">
              <thead>
                <tr>
                  <th>INGREDIENT</th>
                  <th>QUANTITY</th>
                  <th>CATEGORY</th>
                  <th>EXPIRY DATE</th>
                  <th>STATUS</th>
                  <th style={{ textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((it) => {
                  const st = statusOf(it);
                  return (
                    <tr key={it._id}>
                      <td className="name">{it.name}</td>
                      <td>
                        {it.quantity}
                        {it.unit ? ` ${it.unit}` : ""}
                      </td>
                      <td>
                        <span className="tag">{it.category || "Other"}</span>
                      </td>
                      <td>{it.expiryDate ? it.expiryDate.slice(0, 10) : "—"}</td>
                      <td>
                        <span className={`badge ${st.kind}`}>{st.label}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="actions">
                          <button className="icon-btn" onClick={() => openEditModal(it)} title="Edit">
                            <Pencil size={16} />
                          </button>
                          <button
                            className="icon-btn danger"
                            onClick={() => deleteItem(it._id)}
                            title="Delete"
                            disabled={deletingId === it._id}
                          >
                            {deletingId === it._id ? <Loader2 className="spin" size={16} /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty">
                      No items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Modal */}
        {openAdd && (
          <div className="modal-overlay" onClick={() => setOpenAdd(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>Add New Item</h3>
                <button className="x" onClick={() => setOpenAdd(false)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="modal-grid">
                <label>
                  Name*
                  <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
                </label>

                <label>
                  Category
                  <select
                    value={addForm.categoryId}
                    onChange={(e) => setAddForm({ ...addForm, categoryId: e.target.value })}
                    disabled={catLoading || categories.length === 0}
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Quantity
                  <input
                    type="number"
                    min={0}
                    value={addForm.quantity}
                    onChange={(e) => setAddForm({ ...addForm, quantity: Number(e.target.value) })}
                  />
                </label>

                <label>
                  Unit
                  <select value={addForm.unit} onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}>
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                  </select>
                </label>
              </div>

              <div className="modal-actions">
                <button className="pantry-btn ghost" onClick={() => setOpenAdd(false)}>
                  Cancel
                </button>
                <button className="pantry-btn primary" onClick={addItem} disabled={saving}>
                  {saving ? "Saving..." : "Add Item"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {openEdit && (
          <div className="modal-overlay" onClick={() => setOpenEdit(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-head">
                <h3>Edit Item</h3>
                <button className="x" onClick={() => setOpenEdit(false)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="modal-grid">
                <label>
                  Name*
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </label>

                <label>
                  Category
                  <select
                    value={editForm.categoryId}
                    onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                    disabled={catLoading || categories.length === 0}
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Quantity
                  <input
                    type="number"
                    min={0}
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                  />
                </label>

                <label>
                  Unit
                  <select value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}>
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                  </select>
                </label>
              </div>

              <div className="modal-actions">
                <button className="pantry-btn ghost" onClick={() => setOpenEdit(false)}>
                  Cancel
                </button>
                <button className="pantry-btn primary" onClick={saveEdit} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
