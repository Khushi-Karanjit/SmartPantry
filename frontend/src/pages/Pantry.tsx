// frontend/src/pages/Pantry.tsx
import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import Topbar from "../components/Topbar";
import "../styles/Pantry.css";
import IngredientSearchSelect from "../components/IngredientSearchSelect";
import Skeleton from "../components/Skeleton";
import {
  Plus,
  Search,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Loader2,
  RotateCcw,
  Eraser
} from "lucide-react";
import {
  getPantryItemsApi,
  addPantryItemApi,
  updatePantryItemApi,
  deletePantryItemApi,
  getCategoriesApi,
  cleanupExpiredPantryApi,
  restockPantryItemApi,
  type PantryItem,
  type Category,
  type Ingredient,
  type PaginationMeta
} from "../api/api";


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

  const [categories, setCategories] = useState<Category[]>([]);
  const [catLoading, setCatLoading] = useState(true);

  const [tab, setTab] = useState<"all" | "student" | "nepali" | "italian">("all");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const [openAdd, setOpenAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    category: "",
    ingredient: null as Ingredient | null,
    quantity: 1,
    unit: "",
  });

  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState<string>("");
  const [editForm, setEditForm] = useState({
    category: "",
    ingredient: null as Ingredient | null,
    quantity: 1,
    unit: "",
  });

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string>("");

  async function fetchCategories() {
    try {
      setCatLoading(true);
      setError("");
      const res = await getCategoriesApi();
      setCategories(res.categories || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load categories.");
    } finally {
      setCatLoading(false);
    }
  }

  async function fetchItems(pageToFetch = page) {
    try {
      setLoading(true);
      setError("");
      const res = await getPantryItemsApi({
        page: pageToFetch,
        search: q,
        category,
        tab,
        status
      });
      setItems(res.items || []);
      setPagination(res.pagination);
    } catch (e: any) {
      setError(e?.message || "Failed to load pantry items.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setPage(1); // Reset to page 1 on filter/search change
    setStatus(""); // Clear status filter when other filters are touched
    fetchItems(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category, tab]);

  useEffect(() => {
    fetchItems(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  useEffect(() => {
    if (!addForm.category && categories.length > 0) {
      setAddForm((p) => ({ ...p, category: categories[0].name }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);


  const filtered = items; // Backend handles filtering

  function openEditModal(it: PantryItem) {
    setEditId(it._id);
    setEditForm({
      category: it.category || addForm.category || "",
      ingredient: {
        _id: it.ingredientId ?? "",
        name: it.name,
        category: it.category ?? "",
        defaultUnit: it.unit ?? "",
        shelfLifeDays: it.shelfLifeDays || 0,
        isCustom: false,
      },
      quantity: it.quantity ?? 1,
      unit: it.unit || "",
    });
    setOpenEdit(true);
  }

  async function addItem() {
    try {
      setSaving(true);
      setError("");

      if (!addForm.ingredient) {
        setError("Please select an ingredient.");
        return;
      }

      await addPantryItemApi({
        ingredientId: addForm.ingredient._id,
        quantity: Number(addForm.quantity) || 1,
        unit: addForm.unit || addForm.ingredient.defaultUnit || "pcs",
      });

      setOpenAdd(false);
      setAddForm({
        category: categories[0]?.name || "",
        ingredient: null,
        quantity: 1,
        unit: "",
      });

      await fetchItems(1); // Refresh page 1
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

      if (!editForm.ingredient) {
        setError("Please select an ingredient.");
        return;
      }

      await updatePantryItemApi(editId, {
        ingredientId: editForm.ingredient._id,
        quantity: Number(editForm.quantity) || 1,
        unit: editForm.unit || editForm.ingredient.defaultUnit || "pcs",
      });

      setOpenEdit(false);
      setEditId("");
      await fetchItems(page);
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

      await deletePantryItemApi(id);
      await fetchItems(page);
    } catch (e: any) {
      setError(e?.message || "Failed to delete item.");
    } finally {
      setDeletingId("");
    }
  }

  async function cleanupAll() {
    try {
      const expiredCount = items.filter(i => statusOf(i).kind === 'expired').length;
      if (expiredCount === 0) return;

      const ok = confirm(`Are you sure you want to remove all ${expiredCount} expired items?`);
      if (!ok) return;

      setLoading(true);
      await cleanupExpiredPantryApi();
      await fetchItems(1);
    } catch (e: any) {
      setError(e?.message || "Failed to cleanup items.");
    } finally {
      setLoading(false);
    }
  }

  async function restockItem(id: string) {
    try {
      setSaving(true);
      await restockPantryItemApi(id);
      await fetchItems(page);
    } catch (e: any) {
      setError(e?.message || "Failed to restock item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout topbar={(openMenu) => <Topbar onOpenMenu={openMenu} />}>
      <div className="pantry-page">
        <div className="pantry-head">
          <div>
            <h2 className="pantry-title">Pantry Management</h2>
            <p className="pantry-sub">Track and manage your ingredients effectively.</p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
               className="pantry-btn ghost"
               onClick={cleanupAll}
               disabled={loading || items.filter(i => statusOf(i).kind === 'expired').length === 0}
               style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444' }}
            >
               <Eraser size={16} /> Cleanup Expired
            </button>
            <button
              className="pantry-btn ghost"
              onClick={() => window.location.href = '/recipe-suggester'}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Sparkles size={16} /> Find Recipes
            </button>
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
        </div>

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

        {pagination?.expiringSoonCount ? (
          <div className="pantry-warning">
            <div className="warning-left">
              <div className="warning-icon">
                <AlertCircle size={18} />
              </div>
              <div>
                <div className="warning-title">Use Soon</div>
                <div className="warning-sub">
                  These {pagination.expiringSoonCount} items will expire within the next 48 hours.
                </div>
              </div>
            </div>
            <button 
              className="warning-link" 
              onClick={() => { setStatus("expiring"); setPage(1); }}
            >
              {status === "expiring" ? "Showing Expiring" : "Show Items"}
            </button>
            {status === "expiring" && (
              <button 
                className="warning-link" 
                style={{ marginLeft: '10px', color: '#666' }}
                onClick={() => setStatus("")}
              >
                Clear
              </button>
            )}
          </div>
        ) : null}

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
                {['All', ...categories.map((c) => c.name)].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} />
            </div>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {loading ? (
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
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td><Skeleton width="120px" height="1rem" /></td>
                    <td><Skeleton width="60px" height="1rem" /></td>
                    <td><Skeleton width="80px" height="1.5rem" borderRadius="999px" /></td>
                    <td><Skeleton width="90px" height="1rem" /></td>
                    <td><Skeleton width="70px" height="1.5rem" borderRadius="999px" /></td>
                    <td style={{ textAlign: "right" }}>
                      <div className="actions">
                        <Skeleton width="32px" height="32px" borderRadius="10px" />
                        <Skeleton width="32px" height="32px" borderRadius="10px" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                      <td>{it.expiryDate ? it.expiryDate.slice(0, 10) : "-"}</td>
                      <td>
                        <span className={`badge ${st.kind}`}>{st.label}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="actions">
                          <button 
                            className="icon-btn" 
                            onClick={(e) => { e.stopPropagation(); restockItem(it._id); }} 
                            title="Restock (Reset Expiry)"
                            style={st.kind === 'expired' ? { color: '#22c55e', backgroundColor: '#f0fdf4' } : {}}
                            disabled={saving}
                          >
                            <RotateCcw size={16} />
                          </button>
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

        {pagination && pagination.totalPages > 1 && (
          <div className="pagination">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="page-btn"
            >
              Previous
            </button>
            <span className="page-info">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button 
              disabled={page === pagination.totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="page-btn"
            >
              Next
            </button>
          </div>
        )}

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
                  Category
                  <select
                    value={addForm.category}
                    onChange={(e) =>
                      setAddForm({
                        ...addForm,
                        category: e.target.value,
                        ingredient: null,
                        unit: "",
                      })
                    }
                    disabled={catLoading || categories.length === 0}
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <IngredientSearchSelect
                  category={addForm.category}
                  value={addForm.ingredient}
                  onChange={(ingredient) =>
                    setAddForm((prev) => ({
                      ...prev,
                      ingredient,
                      unit: ingredient ? ingredient.defaultUnit || prev.unit : "",
                    }))
                  }
                />

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
                  <input
                    value={addForm.unit}
                    onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
                    placeholder="pcs"
                  />
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
                  Category
                  <select
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        category: e.target.value,
                        ingredient: null,
                        unit: "",
                      })
                    }
                    disabled={catLoading || categories.length === 0}
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <IngredientSearchSelect
                  category={editForm.category}
                  value={editForm.ingredient}
                  onChange={(ingredient) =>
                    setEditForm((prev) => ({
                      ...prev,
                      ingredient,
                      unit: ingredient ? ingredient.defaultUnit || prev.unit : "",
                    }))
                  }
                />

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
                  <input
                    value={editForm.unit}
                    onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                    placeholder="pcs"
                  />
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
