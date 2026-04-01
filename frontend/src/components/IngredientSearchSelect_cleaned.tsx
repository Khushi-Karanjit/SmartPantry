import { useEffect, useMemo, useState } from "react";
import { searchIngredientsApi, type Ingredient } from "../api/api";
import AddCustomIngredientModal from "./AddCustomIngredientModal";

export default function IngredientSearchSelect({
  category,
  value,
  onChange,
}: {
  category: string;
  value: Ingredient | null;
  onChange: (ingredient: Ingredient | null) => void;
}) {
  const [query, setQuery] = useState(value?.name || "");
  const [results, setResults] = useState<Ingredient[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setQuery(value?.name || "");
  }, [value?._id]);

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await searchIngredientsApi({
          q: query,
          category,
          limit: 10,
        });
        setResults(res.ingredients || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query, category, open]);

  const empty = useMemo(() => !loading && query.trim() && results.length === 0, [loading, query, results]);

  function selectIngredient(ingredient: Ingredient) {
    onChange(ingredient);
    setOpen(false);
  }

  function clearSelection() {
    onChange(null);
    setQuery("");
    setOpen(true);
  }

  return (
    <div className="ingredient-select">
      <label>
        Ingredient
        <div className="ingredient-input">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search ingredients..."
          />
          {value && (
            <button type="button" className="mini-btn" onClick={clearSelection}>
              Clear
            </button>
          )}
        </div>
      </label>

      {open && (
        <div className="ingredient-dropdown">
          {loading && <div className="ingredient-item muted">Searching...</div>}
          {!loading &&
            results.map((item) => (
              <button
                type="button"
                key={item._id}
                className="ingredient-item"
                onClick={() => selectIngredient(item)}
              >
                <span className="ingredient-name">{item.name}</span>
                <span className="ingredient-meta">
                  {item.category} · {item.isCustom ? "Custom" : "Master"}
                </span>
              </button>
            ))}

          {empty && (
            <button
              type="button"
              className="ingredient-item add-custom"
              onClick={() => setShowModal(true)}
            >
              Can't find it? Add as custom ingredient
            </button>
          )}
        </div>
      )}

      <AddCustomIngredientModal
        open={showModal}
        name={query}
        category={category}
        onClose={() => setShowModal(false)}
        onCreated={(ingredient) => {
          setShowModal(false);
          selectIngredient(ingredient);
        }}
      />
    </div>
  );
}
