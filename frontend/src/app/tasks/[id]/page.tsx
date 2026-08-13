"use client";

import { use } from "react";
import { TaskDetailPage } from "@/components/task-detail-page";

export default function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <TaskDetailPage taskId={id} />;
}
