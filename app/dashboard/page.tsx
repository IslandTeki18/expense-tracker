"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

export default function DashboardPage() {
  const { isUnlocked, isLoading, lock } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isUnlocked) {
      router.replace("/unlock");
    }
  }, [isLoading, isUnlocked, router]);

  if (isLoading || !isUnlocked) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8">
      <div className="rounded-lg bg-white p-8 shadow-md">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Dashboard content coming soon.</p>
        <button
          onClick={() => {
            lock();
            router.replace("/unlock");
          }}
          className="mt-6 rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
        >
          Lock
        </button>
      </div>
    </main>
  );
}
