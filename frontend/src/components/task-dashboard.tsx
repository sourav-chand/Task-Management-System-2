"use client";

import React, { useEffect, useState } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import {
  User,
  Task,
  apiFetchTasks,
  apiCreateTask,
  apiUpdateTask,
  apiDeleteTask,
  clearStoredToken,
} from "@/lib/api";
import {
  CheckCircle2,
  Circle,
  Plus,
  Search,
  LogOut,
  Trash2,
  Edit2,
  X,
  Filter,
  Check,
  Tag,
  Clock,
  Sparkles,
  ListTodo,
} from "lucide-react";

interface TaskDashboardProps {
  user: User;
  onLogout: () => void;
}

export function TaskDashboard({ user, onLogout }: TaskDashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    category: "General",
  });

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await apiFetchTasks({
        status: statusFilter,
        priority: priorityFilter,
        search,
      });
      setTasks(data);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [statusFilter, priorityFilter, search]);

  const handleToggleStatus = async (task: Task) => {
    const nextStatus =
      task.status === "COMPLETED"
        ? "TODO"
        : task.status === "TODO"
        ? "IN_PROGRESS"
        : "COMPLETED";

    // Optimistic UI Update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    try {
      await apiUpdateTask(task.id, { status: nextStatus });
    } catch {
      loadTasks();
    }
  };

  const handleDelete = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await apiDeleteTask(id);
  };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      category: "General",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      category: task.category || "General",
    });
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingTask) {
      // Update
      const updated = await apiUpdateTask(editingTask.id, formData as any);
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? { ...t, ...updated } : t))
      );
    } else {
      // Create
      const created = await apiCreateTask(formData as any);
      setTasks((prev) => [created, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleLogoutClick = () => {
    clearStoredToken();
    onLogout();
  };

  // Stats
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const inProgressCount = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const todoCount = tasks.filter((t) => t.status === "TODO").length;

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#121215]/80 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="hidden sm:inline-block text-xs px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
            {user.isGuest ? "Guest Workspace" : "Workspace"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="h-4 w-px bg-neutral-200 dark:bg-neutral-800 hidden sm:block" />
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <span className="hidden md:inline font-medium">{user.name}</span>
            <button
              onClick={handleLogoutClick}
              title="Sign Out"
              className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Banner */}
        <div className="mb-8 p-6 bg-gradient-to-r from-neutral-900 via-neutral-800 to-zinc-900 dark:from-neutral-900 dark:to-neutral-950 text-white rounded-2xl shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Task Management System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome back, {user.name}
            </h1>
            <p className="text-sm text-neutral-300 mt-1 max-w-xl">
              Organize, track, and complete your project milestones with modern design fidelity.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">To Do</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{todoCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ListTodo className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">In Progress</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{inProgressCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Completed</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{completedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#121215] border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition-all placeholder:text-neutral-400"
            />
          </div>

          {/* Status Filter Tabs & Create Button */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {["ALL", "TODO", "IN_PROGRESS", "COMPLETED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === tab
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs"
                    : "bg-white dark:bg-[#121215] text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                }`}
              >
                {tab.replace("_", " ")}
              </button>
            ))}

            <button
              onClick={handleOpenCreateModal}
              className="ml-2 px-4 py-2 bg-[#18181B] hover:bg-[#27272A] dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-950 font-medium text-xs rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-12 text-center text-sm text-neutral-400">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-[#121215] border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl">
              <ListTodo className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-base font-semibold text-neutral-800 dark:text-neutral-200">No tasks found</p>
              <p className="text-xs text-neutral-500 mt-1">Get started by creating a new task above.</p>
            </div>
          ) : (
            tasks.map((task) => {
              const isCompleted = task.status === "COMPLETED";
              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800/80 shadow-xs flex items-start justify-between gap-4 transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-700 ${
                    isCompleted ? "opacity-75 bg-neutral-50/50 dark:bg-neutral-900/30" : ""
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleStatus(task)}
                      className="mt-0.5 text-neutral-400 hover:text-emerald-500 transition-colors cursor-pointer shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-500/10" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 ${
                            isCompleted ? "line-through text-neutral-400 dark:text-neutral-500" : ""
                          }`}
                        >
                          {task.title}
                        </h3>

                        {/* Priority Badge */}
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            task.priority === "URGENT"
                              ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                              : task.priority === "HIGH"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                              : task.priority === "MEDIUM"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                              : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                          }`}
                        >
                          {task.priority}
                        </span>

                        {/* Category */}
                        {task.category && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" />
                            {task.category}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(task)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      title="Edit Task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Modal for Create / Edit Task */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#121215] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
                {editingTask ? "Edit Task" : "Create New Task"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Task title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Additional task notes..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="General, Frontend..."
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#18181B] hover:bg-[#27272A] dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-950 font-medium text-xs rounded-xl shadow-xs"
                >
                  {editingTask ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
