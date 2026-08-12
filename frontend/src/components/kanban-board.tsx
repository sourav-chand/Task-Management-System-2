"use client";

import React, { useEffect, useState } from "react";
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
  PanelLeft,
  Search,
  SlidersHorizontal,
  Filter,
  Plus,
  GripVertical,
  MoreHorizontal,
  Calendar,
  Tag,
  Grid2X2,
  Folder,
  ChevronsUpDown,
  ChevronDown,
  LogOut,
  X,
  Check,
  User as UserIcon,
  Sparkles,
} from "lucide-react";

interface KanbanBoardProps {
  user: User;
  onLogout: () => void;
}

const COLUMNS = ["To Do", "Doing", "Completed", "On Hold"];

export function KanbanBoard({ user, onLogout }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeColumnForNew, setActiveColumnForNew] = useState("To Do");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    status: "To Do",
    assigneeName: "Admin",
    dueDate: "29 Jul",
    tags: "Deployment,Deployment",
  });

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await apiFetchTasks({ search: searchQuery });
      setTasks(data);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [searchQuery]);

  const handleOpenAddModal = (columnName: string) => {
    setEditingTask(null);
    setActiveColumnForNew(columnName);
    setFormData({
      title: "",
      status: columnName,
      assigneeName: "Admin",
      dueDate: "29 Jul",
      tags: "Deployment,Deployment",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      status: task.status,
      assigneeName: task.assigneeName || "Admin",
      dueDate: task.dueDate || "29 Jul",
      tags: task.tags || "Deployment",
    });
    setIsModalOpen(true);
    setActiveMenuTaskId(null);
  };

  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    if (editingTask) {
      const updated = await apiUpdateTask(editingTask.id, formData);
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? { ...t, ...updated } : t))
      );
    } else {
      const created = await apiCreateTask(formData);
      setTasks((prev) => [...prev, created]);
    }
    setIsModalOpen(false);
  };

  const handleMoveTask = async (task: Task, targetStatus: string) => {
    setActiveMenuTaskId(null);
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: targetStatus } : t))
    );
    await apiUpdateTask(task.id, { status: targetStatus });
  };

  const handleDeleteTask = async (id: string) => {
    setActiveMenuTaskId(null);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await apiDeleteTask(id);
  };

  const handleLogoutClick = () => {
    clearStoredToken();
    onLogout();
  };

  return (
    <div className="flex h-screen bg-white dark:bg-[#09090B] text-neutral-900 dark:text-neutral-100 font-sans overflow-hidden transition-colors duration-200">
      {/* 1. Left Sidebar Navigation (Matching Figma Screen 2) */}
      <aside
        className={`${
          sidebarOpen ? "w-60" : "w-0 -ml-60"
        } transition-all duration-300 border-r border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#121215] flex flex-col justify-between shrink-0 z-20 overflow-hidden`}
      >
        <div className="p-4 space-y-6">
          {/* Top User Profile */}
          <div className="space-y-1">
            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                {/* Dexter Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-0.5 shrink-0 shadow-xs">
                  <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center text-white text-xs font-bold">
                    D
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                      {user.name || "Dexter"}
                    </span>
                  </div>
                  {/* Red/Orange Mandira Datta Badge */}
                  <span className="bg-[#FF5252] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md self-start inline-block tracking-tight">
                    Mandira Datta
                  </span>
                </div>
              </div>

              <ChevronsUpDown className="w-4 h-4 text-neutral-400 shrink-0" />
            </div>
          </div>

          {/* Navigation Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 tracking-tight">
              <span>Workspace</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>

            {/* Nav Items */}
            <div className="space-y-1">
              {/* Tasks Item (Active) */}
              <button className="w-full bg-[#ECECEE] dark:bg-[#222226] text-neutral-900 dark:text-white font-semibold rounded-xl px-3 py-2 flex items-center gap-2.5 text-sm cursor-pointer shadow-2xs">
                <Grid2X2 className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
                <span>Tasks</span>
              </button>

              {/* Projects Item */}
              <button className="w-full text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/40 font-medium rounded-xl px-3 py-2 flex items-center gap-2.5 text-sm cursor-pointer transition-colors">
                <Folder className="w-4 h-4 text-neutral-400" />
                <span>Projects</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between">
          <ThemeToggle />
          <button
            onClick={handleLogoutClick}
            title="Log Out"
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. Main Workspace Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#09090B] overflow-hidden">
        {/* Top Header Bar (Matching Figma Screen 2) */}
        <header className="h-14 border-b border-neutral-200/80 dark:border-neutral-800 px-6 flex items-center justify-between shrink-0 bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-xs z-10">
          <div className="flex items-center gap-4">
            {/* Sidebar Toggle Icon */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            {/* Header Title */}
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Tasks
            </h1>
          </div>

          {/* Right Action Buttons Toolbar */}
          <div className="flex items-center gap-2.5">
            {/* Inline Search Bar */}
            {isSearchVisible ? (
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-7 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none w-48 transition-all"
                />
                <Search className="w-3.5 h-3.5 absolute left-2.5 text-neutral-400" />
                <button
                  onClick={() => {
                    setIsSearchVisible(false);
                    setSearchQuery("");
                  }}
                  className="absolute right-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchVisible(true)}
                className="p-2 border border-neutral-200/90 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer shadow-2xs"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {/* Fields Button */}
            <button className="border border-neutral-200/90 dark:border-neutral-800 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/80 transition-colors flex items-center gap-2 shadow-2xs cursor-pointer">
              <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
              <span>Fields</span>
            </button>

            {/* Filter Button */}
            <button className="p-2 border border-neutral-200/90 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer shadow-2xs">
              <Filter className="w-4 h-4" />
            </button>

            {/* Primary + Add Task Button */}
            <button
              onClick={() => handleOpenAddModal("To Do")}
              className="bg-[#18181B] hover:bg-black dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-semibold text-xs rounded-lg px-3.5 py-1.5 flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>
        </header>

        {/* 3. Kanban Columns Board Area */}
        <div className="flex-1 p-6 overflow-x-auto bg-[#FAF9FB] dark:bg-[#09090B]">
          <div className="flex items-start gap-4 min-w-max pb-6">
            {COLUMNS.map((columnName) => {
              const columnTasks = tasks.filter(
                (t) => (t.status || "To Do").toLowerCase() === columnName.toLowerCase()
              );

              return (
                <div
                  key={columnName}
                  className="w-[310px] shrink-0 bg-[#F4F4F6] dark:bg-[#141417] border border-neutral-200/60 dark:border-neutral-800/80 rounded-2xl p-3.5 flex flex-col gap-3 shadow-2xs"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between px-1 pt-0.5">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-neutral-400 cursor-grab" />
                      <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                        {columnName}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenAddModal(columnName)}
                        className="p-1 rounded-md hover:bg-neutral-200/80 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                        title="Add Task"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 rounded-md hover:bg-neutral-200/80 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                        title="Column Options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Task Cards List */}
                  <div className="space-y-3">
                    {columnTasks.map((task) => (
                      <div
                        key={task.id}
                        className="relative bg-white dark:bg-[#1C1C20] border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all space-y-3 group"
                      >
                        {/* Top Title & Menu */}
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            onClick={() => handleOpenEditModal(task)}
                            className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                          >
                            {task.title}
                          </h3>

                          {/* Task Card Options Dropdown */}
                          <div className="relative shrink-0">
                            <button
                              onClick={() =>
                                setActiveMenuTaskId(
                                  activeMenuTaskId === task.id ? null : task.id
                                )
                              }
                              className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {activeMenuTaskId === task.id && (
                              <div className="absolute right-0 top-7 w-44 bg-white dark:bg-[#222226] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-1.5 z-30 space-y-1 text-xs">
                                <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                                  Move Column
                                </div>
                                {COLUMNS.filter((c) => c !== columnName).map((targetCol) => (
                                  <button
                                    key={targetCol}
                                    onClick={() => handleMoveTask(task, targetCol)}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium transition-colors"
                                  >
                                    Move to {targetCol}
                                  </button>
                                ))}
                                <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-medium transition-colors"
                                >
                                  Delete Task
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Assignee & Due Date Row */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {/* Avatar Badge */}
                            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 shrink-0 flex items-center justify-center text-[9px] font-bold text-white">
                              {(task.assigneeName || "A")[0]}
                            </div>
                            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                              {task.assigneeName || "Admin"}
                            </span>
                          </div>

                          {/* Due Date Pill Badge */}
                          <div className="bg-[#FFF0F0] dark:bg-red-950/60 text-[#FF4D4D] dark:text-red-300 font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                            <Calendar className="w-3 h-3" />
                            <span>{task.dueDate || "29 Jul"}</span>
                          </div>
                        </div>

                        {/* Tags Row */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          {(task.tags || "Deployment,Deployment")
                            .split(",")
                            .map((tag, idx) => (
                              <span
                                key={idx}
                                className="border border-neutral-200/90 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 font-medium text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1"
                              >
                                <Tag className="w-2.5 h-2.5 text-neutral-400" />
                                <span>{tag.trim()}</span>
                              </span>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Task Button inside Column Bottom */}
                  <button
                    onClick={() => handleOpenAddModal(columnName)}
                    className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white p-2 rounded-xl hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer w-full mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* 4. Modal for Create / Edit Task */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
                {editingTask ? "Edit Task" : `Add Task to ${activeColumnForNew}`}
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
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Write API Documentation"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Column Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-medium outline-none"
                  >
                    {COLUMNS.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Assignee Name
                  </label>
                  <input
                    type="text"
                    placeholder="Admin, QA Team..."
                    value={formData.assigneeName}
                    onChange={(e) => setFormData({ ...formData, assigneeName: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="text"
                    placeholder="29 Jul, 30 Jul..."
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Tags (Comma Separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Deployment, Testing..."
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-medium outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#18181B] hover:bg-black dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-bold text-xs rounded-xl shadow-xs"
                >
                  {editingTask ? "Save Changes" : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
