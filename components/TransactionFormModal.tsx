"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Check, DollarSign, Text } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { parseMoneyToCents } from "@/lib/money";
import { validateIncome, validateExpense } from "@/lib/validation";
import { todayISO } from "@/lib/display";
import type { TxnType, Person } from "@/lib/types";
import { useActor } from "@/components/ActorContext";
import { Chip, Field, Modal, PersonPick } from "@/components/ui";
import ReceiptUploader from "@/components/ReceiptUploader";

interface EditData {
  transactionId: Id<"transactions">;
  amountCents: number;
  entryDate: string;
  description: string | null;
  spentBy: Person | null;
  enteredBy: Person;
  receiptFileId?: Id<"_storage"> | null;
  categoryId?: Id<"categories"> | null;
}

interface TransactionFormModalProps {
  /** Initial type. Type is switchable when creating, fixed when editing. */
  mode: TxnType;
  onClose: () => void;
  editData?: EditData;
}

export default function TransactionFormModal({ mode, onClose, editData }: TransactionFormModalProps) {
  const isEdit = !!editData;
  const { actor } = useActor();

  const [type, setType] = useState<TxnType>(mode);
  const [amount, setAmount] = useState(() => (editData ? (editData.amountCents / 100).toFixed(2) : ""));
  const [entryDate, setEntryDate] = useState(() => editData?.entryDate ?? todayISO());
  const [description, setDescription] = useState(() => editData?.description ?? "");
  const [enteredBy, setEnteredBy] = useState<Person>(() => editData?.enteredBy ?? actor);
  const [spentBy, setSpentBy] = useState<Person>(() => editData?.spentBy ?? actor);
  const [receiptFileId, setReceiptFileId] = useState<Id<"_storage"> | null>(null);
  const [categoryId, setCategoryId] = useState<Id<"categories"> | null>(() => editData?.categoryId ?? null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = useQuery(api.categories.listCategories, {});
  const createIncome = useMutation(api.transactions.createIncome);
  const createExpense = useMutation(api.transactions.createExpense);
  const editIncome = useMutation(api.transactions.editIncome);
  const editExpense = useMutation(api.transactions.editExpense);

  const close = () => {
    if (!isSubmitting) onClose();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setSubmitError(null);

    let amountCents: number;
    try {
      amountCents = parseMoneyToCents(amount);
    } catch {
      setFieldErrors({ amountCents: "Enter a valid amount" });
      return;
    }
    const trimmedDesc = description.trim();

    const result =
      type === "income"
        ? validateIncome({ amountCents, entryDate, enteredBy, description: trimmedDesc || undefined })
        : validateExpense({ amountCents, entryDate, enteredBy, description: trimmedDesc, spentBy });
    if (!result.valid) {
      setFieldErrors(result.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (type === "income") {
        const payload = { amountCents, entryDate, enteredBy, description: trimmedDesc || null };
        if (isEdit) await editIncome({ transactionId: editData.transactionId, ...payload });
        else await createIncome(payload);
      } else {
        const payload = {
          amountCents,
          entryDate,
          enteredBy,
          description: trimmedDesc,
          spentBy,
          categoryId: categoryId ?? null,
          ...(receiptFileId ? { receiptFileId } : {}),
        };
        if (isEdit) await editExpense({ transactionId: editData.transactionId, ...payload });
        else await createExpense(payload);
      }
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  const isExpense = type === "expense";

  return (
    <Modal
      onClose={close}
      eyebrow={isEdit ? "EDIT · NEW VERSION" : "NEW TRANSACTION"}
      title={isEdit ? "Edit transaction" : isExpense ? "Record expense" : "Record income"}
      footer={
        <>
          <button type="button" className="gt-btn gt-btn-ghost" onClick={close} disabled={isSubmitting}>
            CANCEL
          </button>
          <button type="submit" form="txn-form" className="gt-btn gt-btn-primary" disabled={isSubmitting}>
            <Check size={15} />
            {isSubmitting ? "SAVING…" : isEdit ? "SAVE VERSION" : "ADD ENTRY"}
          </button>
        </>
      }
    >
      <form id="txn-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {submitError && <div className="gt-error-box">{submitError}</div>}

        {!isEdit && (
          <div>
            <span className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
              TYPE
            </span>
            <div className="gt-seg" data-full="1">
              <button type="button" className="gt-seg-btn" data-active={isExpense ? "1" : "0"} onClick={() => setType("expense")}>
                − EXPENSE
              </button>
              <button type="button" className="gt-seg-btn" data-active={!isExpense ? "1" : "0"} onClick={() => setType("income")}>
                + INCOME
              </button>
            </div>
          </div>
        )}

        <Field
          label="AMOUNT"
          icon={<DollarSign size={15} />}
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={fieldErrors.amountCents}
          autoFocus={!isEdit}
        />
        <Field label="DATE" error={fieldErrors.entryDate}>
          <input className="gt-field-input" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
        </Field>

        <Field
          label={isExpense ? "DESCRIPTION" : "DESCRIPTION (OPTIONAL)"}
          icon={<Text size={15} />}
          placeholder={isExpense ? "What was it for?" : "Source / note"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={fieldErrors.description}
        />

        <div style={{ display: "grid", gridTemplateColumns: isExpense ? "1fr 1fr" : "1fr", gap: 14 }}>
          {isExpense && (
            <div>
              <span className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
                SPENT BY
              </span>
              <PersonPick value={spentBy} onChange={setSpentBy} />
              {fieldErrors.spentBy && <span className="gt-field-err">{fieldErrors.spentBy}</span>}
            </div>
          )}
          <div>
            <span className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
              ENTERED BY
            </span>
            <PersonPick value={enteredBy} onChange={setEnteredBy} />
          </div>
        </div>

        {isExpense && (
          <>
            <div>
              <span className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
                CATEGORY (OPTIONAL)
              </span>
              <div className="gt-chips">
                <Chip active={!categoryId} onClick={() => setCategoryId(null)}>
                  None
                </Chip>
                {categories?.map((c) => (
                  <Chip key={c._id} active={categoryId === c._id} color={c.color} onClick={() => setCategoryId(c._id)}>
                    {c.nameDisplay}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <span className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
                RECEIPT (OPTIONAL)
              </span>
              <ReceiptUploader
                onUploaded={(id) => setReceiptFileId(id)}
                hasReceipt={!!(receiptFileId || editData?.receiptFileId)}
                disabled={isSubmitting}
              />
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
