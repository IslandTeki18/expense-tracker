"use client";

import { formatCents } from "@/lib/money";
import { Id } from "@/convex/_generated/dataModel";

interface VersionData {
  _id: Id<"transaction_versions">;
  type: "income" | "expense";
  amountCents: number;
  entryDate: string | null;
  description: string | null;
  spentBy: "landon" | "emma" | null;
  enteredBy: "landon" | "emma";
  receiptFileId: Id<"_storage"> | null;
  createdAt: number;
  supersedesVersionId: Id<"transaction_versions"> | null;
}

interface HistoryPanelProps {
  versions: VersionData[];
  activeVersionId: string;
}

function formatPersonLabel(person: "landon" | "emma"): string {
  return person === "landon" ? "Landon" : "Emma";
}

function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString();
}

export default function HistoryPanel({
  versions,
  activeVersionId,
}: HistoryPanelProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          History ({versions.length} version{versions.length !== 1 ? "s" : ""})
        </h2>
      </div>

      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {versions.map((version) => {
          const isActive = version._id === activeVersionId;

          return (
            <li
              key={version._id}
              className={`px-4 py-3 ${isActive ? "" : "opacity-60"}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimestamp(version.createdAt)}
                </span>
                {isActive && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    Current
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span
                  className={`font-semibold ${
                    version.type === "income"
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-700 dark:text-red-400"
                  }`}
                >
                  {version.type === "income" ? "+" : "-"}
                  {formatCents(version.amountCents)}
                </span>

                <span className="text-gray-500 dark:text-gray-400">
                  {version.entryDate ?? "--"}
                </span>

                {version.description && (
                  <span className="text-gray-700 dark:text-gray-300">{version.description}</span>
                )}

                {version.spentBy && (
                  <span className="text-gray-500 dark:text-gray-400">
                    by {formatPersonLabel(version.spentBy)}
                  </span>
                )}

                <span className="text-gray-400 dark:text-gray-500">
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
