"use client";

import Link from "next/link";
import { Paperclip } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { formatCents } from "@/lib/money";
import { fmtDate, PEOPLE } from "@/lib/display";
import type { Person, TxnType } from "@/lib/types";

export interface TxnRowData {
  _id: Id<"transactions">;
  type: TxnType;
  amountCents: number;
  entryDate: string | null;
  description: string | null;
  spentBy: Person | null;
  enteredBy: Person;
  receiptFileId: Id<"_storage"> | null;
  categoryName: string | null;
  categoryColor: string | null;
}

export default function TxnRow({ txn }: { txn: TxnRowData }) {
  const inc = txn.type === "income";
  return (
    <Link href={`/transaction/${txn._id}`} className="m-node">
      <span className={`gt-type-pill ${inc ? "gt-type-in" : "gt-type-out"}`}>{inc ? "IN" : "OUT"}</span>
      <div className="m-node-main">
        <div className="m-node-id">{txn.description || "—"}</div>
        <div className="m-node-region">
          <span>{fmtDate(txn.entryDate)}</span>
          {txn.categoryName && (
            <>
              <span>·</span>
              <span style={{ color: txn.categoryColor ?? undefined, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {txn.categoryName}
              </span>
            </>
          )}
          {txn.receiptFileId && <Paperclip size={10} color="var(--accent)" />}
        </div>
      </div>
      <div className="m-node-meta">
        <div className={`m-node-load gt-amt ${inc ? "gt-amt-in" : ""}`}>
          {inc ? "+" : "−"}
          {formatCents(txn.amountCents)}
        </div>
        <div className="m-node-lat">{PEOPLE[txn.spentBy ?? txn.enteredBy].name}</div>
      </div>
    </Link>
  );
}
