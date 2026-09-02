"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Check, Trash2, Type } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { validateCategoryName, sanitizeCategoryDisplayName } from "@/lib/categories";
import { Badge, ColorPicker, ConfirmDialog, Field, Modal, SWATCHES } from "@/components/ui";

export type EntityKind = "category" | "store";

interface EditData {
  id: string;
  nameDisplay: string;
  color: string;
}

/** Create / edit / delete for the two named-color entities (categories, grocery stores). */
export default function EntityFormModal({ kind, onClose, editData }: { kind: EntityKind; onClose: () => void; editData?: EditData }) {
  const isEdit = !!editData;
  const [name, setName] = useState(editData?.nameDisplay ?? "");
  const [color, setColor] = useState(() => editData?.color ?? SWATCHES[Math.floor(Math.random() * SWATCHES.length)]);
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const createCategory = useMutation(api.categories.createCategory);
  const updateCategory = useMutation(api.categories.updateCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);
  const createStore = useMutation(api.groceryStores.createStore);
  const updateStore = useMutation(api.groceryStores.updateStore);
  const deleteStore = useMutation(api.groceryStores.deleteStore);

  const close = () => {
    if (!busy) onClose();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameError(null);
    setError(null);
    const sanitized = sanitizeCategoryDisplayName(name);
    const validation = validateCategoryName(sanitized);
    if (!validation.valid) {
      setNameError(validation.error!);
      return;
    }
    setBusy(true);
    try {
      if (kind === "category") {
        if (isEdit) await updateCategory({ categoryId: editData.id as Id<"categories">, nameDisplay: sanitized, color });
        else await createCategory({ nameDisplay: sanitized, color });
      } else {
        if (isEdit) await updateStore({ storeId: editData.id as Id<"grocery_stores">, nameDisplay: sanitized, color });
        else await createStore({ nameDisplay: sanitized, color });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!editData) return;
    setBusy(true);
    setError(null);
    try {
      if (kind === "category") await deleteCategory({ categoryId: editData.id as Id<"categories"> });
      else await deleteStore({ storeId: editData.id as Id<"grocery_stores"> });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  const KIND = kind.toUpperCase();

  return (
    <>
      <Modal
        onClose={close}
        eyebrow={isEdit ? `EDIT ${KIND}` : `NEW ${KIND}`}
        title={isEdit ? `Edit ${kind}` : `New ${kind}`}
        footer={
          <>
            {isEdit && (
              <button type="button" className="gt-btn gt-btn-danger" style={{ marginRight: "auto" }} onClick={() => setConfirmDelete(true)} disabled={busy}>
                <Trash2 size={15} />
              </button>
            )}
            <button type="button" className="gt-btn gt-btn-ghost" onClick={close} disabled={busy}>
              CANCEL
            </button>
            <button type="submit" form="entity-form" className="gt-btn gt-btn-primary" disabled={busy}>
              <Check size={15} />
              {busy ? "SAVING…" : isEdit ? "SAVE" : "CREATE"}
            </button>
          </>
        }
      >
        <form id="entity-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {error && <div className="gt-error-box">{error}</div>}
          <Field
            label="NAME"
            icon={<Type size={15} />}
            placeholder={kind === "category" ? "e.g. Groceries" : "e.g. Trader Joe's"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={nameError}
            hint={`${name.trim().length}/30 · 1–3 words`}
            autoFocus={!isEdit}
          />
          <div>
            <span className="eyebrow" style={{ display: "block", marginBottom: 10 }}>
              COLOR
            </span>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
            <span className="eyebrow">PREVIEW</span>
            <Badge color={color}>{name.trim() || (kind === "category" ? "Category" : "Store")}</Badge>
          </div>
        </form>
      </Modal>

      {confirmDelete && editData && (
        <ConfirmDialog
          onClose={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
          busy={busy}
          error={error}
          title={`Delete "${editData.nameDisplay}"?`}
          body={
            kind === "category"
              ? "Transactions keep their data and just lose this category. This cannot be undone."
              : "Grocery items keep their data and just lose this store. This cannot be undone."
          }
        />
      )}
    </>
  );
}
