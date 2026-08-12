"use client";

import React, { useEffect, useState } from "react";
import { AuthCard } from "@/components/auth-card";
import { KanbanBoard } from "@/components/kanban-board";
import { User, getStoredUser } from "@/lib/api";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const existing = getStoredUser();
    if (existing) {
      setUser(existing);
    }
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100 animate-spin" />
      </div>
    );
  }

  if (user) {
    return <KanbanBoard user={user} onLogout={() => setUser(null)} />;
  }

  return <AuthCard onSuccess={(loggedUser) => setUser(loggedUser)} />;
}
