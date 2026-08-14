"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectsPage } from "@/components/projects-page";
import { User, getStoredUser } from "@/lib/api";

export default function ProjectsRoute() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const existing = getStoredUser();
    if (existing) {
      setUser(existing);
    } else {
      // Not logged in — redirect to home (auth page)
      router.push("/");
    }
  }, [router]);

  if (!mounted || !user) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100 animate-spin" />
      </div>
    );
  }

  return <ProjectsPage user={user} onLogout={() => router.push("/")} />;
}
