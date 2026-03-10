import { useEffect, useState } from "react";
import { createCustomIngredientApi, type Ingredient } from "../api/api";

export default function AddCustomIngredientModal({
  open,
  name,
  category,
  onClose,
  onCreated,
}: {
  open: boolean;
  name: string;
  category: string;
  onClose: () => void;
  onCreated: (ingredient: Ingredient) => void;
}) {
  const [draftName, setDraftName] = useState(name);
  const [defaultUnit, setDefaultUnit] = useState("pcs");
  const [shelfLifeDays, setShelfLifeDays] = useState(0);
  const [keywords, setKeywords] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraftName(name);
      setDefaultUnit("pcs");
      setShelfLifeDays(0);
      setKeywords("");
      setError(null);
    }
  }, [name, open]);

  if (!open) return null;

  const tooShort = draftName.trim().length < 2;
  const badShelf = shelfLifeDays < 0 || shelfLifeDays > 365;

  async function submit() {
    if (tooShort || badShelf) return;
    try {
      setSaving(true);
      setError(null);
      const res = await createCustomIngredientApi({
        name: draftName.trim(),
        category,
        defaultUnit,
        shelfLifeDays,
        keywords: keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      });
      onCreated(res.ingredient);
    } catch (e: any) {
      setError(e?.message || "Failed to create ingredient");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Add Custom Ingredient</h3>
          <button className="x" onClick={onClose} aria-label="Close">
            X
          </button>
        </div>

        <div className="modal-grid">
          <label>
            Name*
            <input value={draftName} onChange={(e) => setDraftName(e.target.value)} />
          </label>

          <label>
            Category
            <input value={category} disabled />
          </label>

          <label>
            Default Unit
            <input value={defaultUnit} onChange={(e) => setDefaultUnit(e.target.value)} />
          </label>

          <label>
            Shelf Life Days
            <input
              type="number"
              min={0}
              max={365}
              value={shelfLifeDays}
              onChange={(e) => setShelfLifeDays(Number(e.target.value))}
            />
          </label>

          <label>
            Keywords
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="tomato, tamatar"
            />
          </label>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="modal-actions">
          <button className="pantry-btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="pantry-btn primary"
            onClick={submit}
            disabled={saving || tooShort || badShelf}
          >
            {saving ? "Saving..." : "Create Ingredient"}
          </button>
        </div>
      </div>
    </div>
  );
}
