"use client";

import { formatCents } from "@/lib/money";
import { Id } from "@/convex/_generated/dataModel";

interface VersionData {
  _id: Id<"transaction_versions">;
  type: "income" | "expense";
  amountCents: number;
  entryDate: string | null;
  description: string | null;
  spentBy: "you" | "wife" | null;
  enteredBy: "you" | "wife";
  receiptFileId: Id<"_storage"> | null;
  createdAt: number;
  supersedesVersionId: Id<"transaction_versions"> | null;
}

interface HistoryPanelProps {
  versions: VersionData[];
  activeVersionId: string;
}

function formatPersonLabel(person: "you" | "wife"): string {
  return person === "you" ? "You" : "Wife";
}

function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString();
}

export default function HistoryPanel({
  versions,
  activeVersionId,
}: HistoryPanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">
          History ({versions.length} version{versions.length !== 1 ? "s" : ""})
        </h2>
      </div>

      <ul className="divide-y divide-gray-100">
        {versions.map((version) => {
          const isActive = version._id === activeVersionId;

          return (
            <li
              key={version._id}
              className={`px-4 py-3 ${isActive ? "" : "opacity-60"}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {formatTimestamp(version.createdAt)}
                </span>
                {isActive && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    Current
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span
                  className={`font-semibold ${
                    version.type === "income"
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {version.type === "income" ? "+" : "-"}
                  {formatCents(version.amountCents)}
                </span>

                <span className="text-gray-500">
                  {version.entryDate ?? "--"}
                </span>

                {version.description && (
                  <span className="text-gray-700">{version.description}</span>
                )}

                {version.spentBy && (
                  <span className="text-gray-500">
                    by {formatPersonLabel(version.spentBy)}
                  </span>
                )}

                <span className="text-gray-400">
                  entered by {formatPersonLabel(version.enteredBy)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
