"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";

export default function Home() {
  const { isUnlocked, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isUnlocked ? "/dashboard" : "/unlock");
  }, [isLoading, isUnlocked, router]);

  return null;
}
