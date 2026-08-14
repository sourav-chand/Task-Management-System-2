"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiCreateTask } from "@/lib/api";

function NewTaskRedirector() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const created      = useRef(false);

  useEffect(() => {
    // Guard against double-invocation in React StrictMode
    if (created.current) return;
    created.current = true;

    const status   = searchParams.get("status") || "To Do";
    const priority = searchParams.get("priority") || "MEDIUM";

    // Create the blank draft task, then navigate to its detail page
    apiCreateTask({
      title:        "Untitled Task",
      status,
      priority,
      assigneeName: "Admin",
      dueDate:      "",
      tags:         "",
      description:  "",
    }).then(task => {
      // replace so the back button doesn't loop back to /tasks/new
      router.replace(`/tasks/${task.id}`);
    });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090B] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100 animate-spin" />
    </div>
  );
}

export default function NewTaskPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-[#09090B] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100 animate-spin" />
        </div>
      }
    >
      <NewTaskRedirector />
    </Suspense>
  );
}
