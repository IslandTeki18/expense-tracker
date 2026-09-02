"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Check, ShoppingBasket } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useActor } from "@/components/ActorContext";
import { Chip, Field, Modal } from "@/components/ui";

interface EditData {
  itemId: Id<"grocery_items">;
  name: string;
  quantity: number;
  storeId: Id<"grocery_stores"> | null;
}

export default function GroceryItemModal({ onClose, editData }: { onClose: () => void; editData?: EditData }) {
  const isEdit = !!editData;
  const { actor } = useActor();
  const [name, setName] = useState(editData?.name ?? "");
  const [qty, setQty] = useState(editData?.quantity ?? 1);
  const [storeId, setStoreId] = useState<Id<"grocery_stores"> | null>(editData?.storeId ?? null);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stores = useQuery(api.groceryStores.listStores, {});
  const addItem = useMutation(api.grocery.addItem);
  const editItem = useMutation(api.grocery.editItem);

  const nameError = !name.trim() ? "Item name is required" : null;
  const close = () => {
    if (!isSubmitting) onClose();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (nameError) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = { name: name.trim(), quantity: qty, storeId };
      if (isEdit) await editItem({ itemId: editData.itemId, ...payload });
      else await addItem({ ...payload, addedBy: actor });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      onClose={close}
      eyebrow={isEdit ? "EDIT ITEM" : "NEW ITEM"}
      title={isEdit ? "Edit grocery item" : "Add grocery item"}
      footer={
        <>
          <button type="button" className="gt-btn gt-btn-ghost" onClick={close} disabled={isSubmitting}>
            CANCEL
          </button>
          <button type="submit" form="grocery-form" className="gt-btn gt-btn-primary" disabled={isSubmitting}>
            <Check size={15} />
            {isSubmitting ? "SAVING…" : isEdit ? "SAVE" : "ADD ITEM"}
          </button>
        </>
      }
    >
      <form id="grocery-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {error && <div className="gt-error-box">{error}</div>}
        <Field
          label="ITEM"
          icon={<ShoppingBasket size={15} />}
          placeholder="e.g. Oat milk"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={touched ? nameError : null}
          autoFocus
        />
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 14, alignItems: "start" }}>
          <div>
            <span className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
              QTY
            </span>
            <div className="gt-field-box" style={{ justifyContent: "space-between", padding: "0 6px" }}>
              <button type="button" className="gt-key-fn" style={{ background: "none", border: "none", fontSize: 18, padding: "6px 8px" }} onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">
                −
              </button>
              <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{qty}</span>
              <button type="button" className="gt-key-fn" style={{ background: "none", border: "none", fontSize: 18, padding: "6px 8px" }} onClick={() => setQty((q) => q + 1)} aria-label="Increase">
                +
              </button>
            </div>
          </div>
          <div>
            <span className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
              STORE (OPTIONAL)
            </span>
            <div className="gt-chips">
              <Chip active={!storeId} onClick={() => setStoreId(null)}>
                Any
              </Chip>
              {stores?.map((s) => (
                <Chip key={s._id} active={storeId === s._id} color={s.color} onClick={() => setStoreId(s._id)}>
                  {s.nameDisplay}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
