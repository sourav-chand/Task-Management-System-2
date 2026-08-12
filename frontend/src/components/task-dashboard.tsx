"use client";

import React from "react";
import { User, Task } from "@/lib/api";

interface TaskDashboardProps {
  user: User;
  onLogout: () => void;
}

export function TaskDashboard({ user, onLogout }: TaskDashboardProps) {
  return null;
}
