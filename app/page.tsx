"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Home() {
  const result = useQuery(api.test.ping);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <div className="rounded-lg bg-white p-8 shadow-md">
        <h1 className="text-2xl font-bold text-gray-900">Expense Tracker</h1>
        {result === undefined ? (
          <p className="mt-2 text-sm text-gray-500">Connecting to Convex...</p>
        ) : (
          <div className="mt-4 rounded bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
            {result.message} — {new Date(result.timestamp).toLocaleString()}
          </div>
        )}
      </div>
    </main>
  );
}
