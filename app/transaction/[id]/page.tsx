"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { Paperclip, Pencil, SearchX, Trash2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatCents } from "@/lib/money";
import { fmtDate, fmtDateTime, PEOPLE } from "@/lib/display";
import AppShell, { AppBar } from "@/components/AppShell";
import { Badge, ConfirmDialog, Empty, PersonChip } from "@/components/ui";
import TransactionFormModal from "@/components/TransactionFormModal";
import ReceiptUploader from "@/components/ReceiptUploader";
import QueryErrorBoundary from "@/components/QueryErrorBoundary";

export default function TransactionDetailPage() {
  return (
    <AppShell>
      <QueryErrorBoundary fallbackMessage="Failed to load transaction.">
        <DetailScreen />
      </QueryErrorBoundary>
    </AppShell>
  );
}

function DetailScreen() {
  const router = useRouter();
  const transactionId = useParams().id as Id<"transactions">;
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const txn = useQuery(api.transactions.getTransaction, { transactionId });
  const history = useQuery(api.transactions.listTransactionHistory, { transactionId });
  const categories = useQuery(api.categories.listCategories, {});
  const receiptUrl = useQuery(api.transactions.getReceiptUrl, txn?.receiptFileId ? { storageId: txn.receiptFileId } : "skip");
  const replaceReceipt = useMutation(api.transactions.replaceReceipt);
  const deleteTransaction = useMutation(api.transactions.deleteTransaction);

  async function handleDelete() {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteTransaction({ transactionId });
      router.push("/transactions");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete transaction");
      setIsDeleting(false);
    }
  }

  if (txn === undefined || history === undefined) {
    return (
      <>
        <AppBar sub="BACK" backHref="/transactions" title="Transaction" />
        <div className="gt-skel" style={{ height: 170, marginBottom: 10 }} />
        <div className="gt-skel" style={{ height: 160, marginBottom: 10 }} />
      </>
    );
  }

  if (txn === null) {
    return (
      <>
        <AppBar sub="BACK" backHref="/transactions" title="Not found" />
        <Empty icon={<SearchX size={26} />}>Transaction not found. It may have been deleted.</Empty>
      </>
    );
  }

  const inc = txn.type === "income";
  const cat = txn.categoryId ? categories?.find((c) => c._id === txn.categoryId) : undefined;
  const sign = inc ? "+" : "−";

  return (
    <>
      <AppBar
        sub="BACK"
        backHref="/transactions"
        title="Transaction"
        right={
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="m-icon-btn" onClick={() => setShowEdit(true)} aria-label="Edit">
              <Pencil size={15} />
            </button>
            <button type="button" className="m-icon-btn" style={{ color: "var(--danger)" }} onClick={() => setConfirmDelete(true)} aria-label="Delete">
              <Trash2 size={15} />
            </button>
          </div>
        }
      />

      <div className="m-hero" style={{ marginBottom: 10 }}>
        <span className={`gt-type-pill ${inc ? "gt-type-in" : "gt-type-out"}`}>{inc ? "INCOME" : "EXPENSE"}</span>
        <div className="m-hero-val" style={{ fontSize: 38, color: inc ? "var(--highlight)" : "var(--fg)" }}>
          {sign}
          {formatCents(txn.amountCents)}
        </div>
        <div style={{ color: "var(--fg-muted)", fontSize: 13, marginTop: 8 }}>{txn.description || "No description"}</div>
        <div className="m-hero-sub" style={{ marginTop: 10 }}>
          {fmtDate(txn.entryDate)}
          {history.length > 1 && ` · ${history.length} versions`}
        </div>
      </div>

      <div className="m-card">
        <span className="eyebrow">DETAILS</span>
        <div className="gt-kv">
          {!inc && (
            <div className="gt-kv-row">
              <span className="k">Category</span>
              <span className="v">{cat ? <Badge color={cat.color}>{cat.nameDisplay}</Badge> : "Uncategorized"}</span>
            </div>
          )}
          {!inc && (
            <div className="gt-kv-row">
              <span className="k">Spent by</span>
              <span className="v">
                <PersonChip id={txn.spentBy} />
              </span>
            </div>
          )}
          <div className="gt-kv-row">
            <span className="k">Entered by</span>
            <span className="v">
              <PersonChip id={txn.enteredBy} />
            </span>
          </div>
          <div className="gt-kv-row">
            <span className="k">Added</span>
            <span className="v">{fmtDateTime(txn.createdAt)}</span>
          </div>
          <div className="gt-kv-row">
            <span className="k">Updated</span>
            <span className="v">{fmtDateTime(txn.updatedAt)}</span>
          </div>
        </div>
      </div>

      {!inc && (
        <div className="m-card">
          <span className="eyebrow">RECEIPT</span>
          <div style={{ marginTop: 12 }}>
            <ReceiptUploader
              hasReceipt={!!txn.receiptFileId}
              previewUrl={receiptUrl ?? null}
              onUploaded={async (storageId) => {
                await replaceReceipt({ transactionId, newReceiptFileId: storageId });
              }}
            />
          </div>
        </div>
      )}

      <div className="m-card">
        <span className="eyebrow">VERSION HISTORY</span>
        <div className="gt-hist">
          {history.map((ver, i) => {
            const active = ver._id === txn.activeVersionId;
            return (
              <div className="gt-hist-item" key={ver._id}>
                <div className="gt-hist-rail">
                  <span className="gt-hist-node" data-active={active ? "1" : "0"} />
                  {i < history.length - 1 && <span className="gt-hist-line" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <b className="gt-amt" style={{ color: inc ? "var(--highlight)" : "var(--fg)" }}>
                      {sign}
                      {formatCents(ver.amountCents)}
                    </b>
                    {active ? (
                      <span className="gt-badge gt-badge-live" style={{ fontSize: 9 }}>
                        <span className="gt-dot" />
                        ACTIVE
                      </span>
                    ) : (
                      <span className="gt-badge" style={{ fontSize: 9 }}>
                        SUPERSEDED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 3 }}>
                    {ver.description || "No description"} · {fmtDate(ver.entryDate)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--fg-subtle)", marginTop: 4, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <span>{fmtDateTime(ver.createdAt)}</span>
                    <span>· by {PEOPLE[ver.enteredBy].name}</span>
                    {ver.receiptFileId && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        · <Paperclip size={10} /> receipt
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showEdit && (
        <TransactionFormModal
          mode={txn.type}
          onClose={() => setShowEdit(false)}
          editData={{
            transactionId: txn._id,
            amountCents: txn.amountCents,
            entryDate: txn.entryDate ?? "",
            description: txn.description,
            spentBy: txn.spentBy,
            enteredBy: txn.enteredBy,
            receiptFileId: txn.receiptFileId,
            categoryId: txn.categoryId,
          }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          onClose={() => {
            if (!isDeleting) {
              setConfirmDelete(false);
              setDeleteError(null);
            }
          }}
          onConfirm={handleDelete}
          busy={isDeleting}
          error={deleteError}
          title="Delete this transaction?"
          body="Removes the transaction, all versions and receipts. Balance recomputes. Cannot be undone."
        />
      )}
    </>
  );
}
