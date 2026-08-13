"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
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
  List as ListIcon,
  Folder,
  ChevronsUpDown,
  ChevronDown,
  LogOut,
  X,
  Check,
} from "lucide-react";

interface KanbanBoardProps {
  user: User;
  onLogout: () => void;
}

const COLUMNS = ["To Do", "Doing", "Completed", "On Hold"];

export function KanbanBoard({ user, onLogout }: KanbanBoardProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // View Mode
  const [viewMode, setViewMode] = useState<"board" | "list">("list");

  // Fields Popover
  const [isFieldsOpen, setIsFieldsOpen] = useState(false);
  const [visibleFields, setVisibleFields] = useState({
    priority: false,
    members: true,
    dueDate: false,
    labels: false,
    status: false,
    reporter: false,
  });

  // Filter Popover
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilterStatus, setSelectedFilterStatus] = useState("ALL");
  const [selectedFilterPriority, setSelectedFilterPriority] = useState("ALL");
  const [selectedFilterAssignee, setSelectedFilterAssignee] = useState("ALL");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeColumnForNew, setActiveColumnForNew] = useState("To Do");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  // Form
  const [formData, setFormData] = useState({
    title: "",
    status: "To Do",
    priority: "MEDIUM",
    assigneeName: "Admin",
    dueDate: "29 Jul",
    tags: "Deployment,Deployment",
  });

  // Refs
  const fieldsRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click; close sidebar overlay on mobile
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fieldsRef.current && !fieldsRef.current.contains(event.target as Node)) {
        setIsFieldsOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Open sidebar by default on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await apiFetchTasks({
        status: selectedFilterStatus,
        priority: selectedFilterPriority,
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
  }, [selectedFilterStatus, selectedFilterPriority]);

  const handleToggleField = (fieldKey: keyof typeof visibleFields) => {
    setVisibleFields((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const handleOpenAddModal = (columnName: string) => {
    setEditingTask(null);
    setActiveColumnForNew(columnName);
    setFormData({
      title: "",
      status: columnName,
      priority: "MEDIUM",
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
      priority: task.priority || "MEDIUM",
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

  const filteredTasks = tasks.filter((t) => {
    if (
      selectedFilterAssignee !== "ALL" &&
      (t.assigneeName || "Admin") !== selectedFilterAssignee
    ) {
      return false;
    }
    if (
      searchQuery.trim() &&
      !t.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const hasActiveFilters =
    selectedFilterStatus !== "ALL" ||
    selectedFilterPriority !== "ALL" ||
    selectedFilterAssignee !== "ALL";

  // ─── Sidebar content (shared between overlay and desktop) ───────────────────
  const SidebarContent = () => (
    <>
      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        {/* User Profile */}
        <div className="space-y-1">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-0.5 shrink-0 shadow-xs">
                <div className="w-full h-full rounded-full bg-neutral-900 dark:bg-neutral-900 flex items-center justify-center text-white text-xs font-bold">
                  {(user.name || "D")[0].toUpperCase()}
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                  {user.name || "Dexter"}
                </span>
                <span className="bg-[#FF5252] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md self-start inline-block tracking-tight">
                  Mandira Datta
                </span>
              </div>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-neutral-400 shrink-0" />
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 tracking-tight">
            <span>Workspace</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
          <div className="space-y-1">
            <button className="w-full bg-[#ECECEE] dark:bg-[#222226] text-neutral-900 dark:text-white font-semibold rounded-xl px-3 py-2 flex items-center gap-2.5 text-sm cursor-pointer shadow-2xs">
              <Grid2X2 className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
              <span>Tasks</span>
            </button>
            <button className="w-full text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/40 font-medium rounded-xl px-3 py-2 flex items-center gap-2.5 text-sm cursor-pointer transition-colors">
              <Folder className="w-4 h-4 text-neutral-400" />
              <span>Projects</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between shrink-0">
        <ThemeToggle />
        <button
          onClick={handleLogoutClick}
          title="Log Out"
          className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-white dark:bg-[#09090B] text-neutral-900 dark:text-neutral-100 font-sans overflow-hidden transition-colors duration-200">

      {/* ── Mobile sidebar backdrop overlay ───────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────────────────── */}
      {/* Mobile: fixed overlay drawer — Desktop: static sidebar that shifts content */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col
          w-64 sm:w-60
          bg-white dark:bg-[#121215]
          border-r border-neutral-200/80 dark:border-neutral-800
          transition-transform duration-300 ease-in-out
          lg:static lg:z-auto lg:translate-x-0 lg:shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${!sidebarOpen ? "lg:w-0 lg:overflow-hidden lg:border-r-0" : "lg:w-60"}
        `}
      >
        <SidebarContent />
      </aside>

      {/* ── Main workspace ────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#09090B] overflow-hidden">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <header className="h-14 border-b border-neutral-200/80 dark:border-neutral-800 px-3 sm:px-6 flex items-center justify-between shrink-0 bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-xs z-10 gap-2">
          
          {/* Left: toggle + title */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white truncate">
              Tasks
            </h1>
          </div>

          {/* Right: toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

            {/* Search — always visible */}
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-7 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none w-32 sm:w-48 transition-all focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-neutral-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Fields button + popover */}
            <div className="relative" ref={fieldsRef}>
              <button
                onClick={() => { setIsFieldsOpen(!isFieldsOpen); setIsFilterOpen(false); }}
                className={`border border-neutral-200/90 dark:border-neutral-800 px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2 shadow-2xs cursor-pointer ${
                  isFieldsOpen
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/80"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Fields</span>
              </button>

              {isFieldsOpen && (
                <div className="absolute right-0 top-9 w-60 sm:w-64 bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 shadow-xl z-40 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  {/* View mode switcher */}
                  <div className="p-1 bg-[#F4F4F6] dark:bg-neutral-900 rounded-xl flex items-center gap-1">
                    <button
                      onClick={() => setViewMode("list")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        viewMode === "list"
                          ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs"
                          : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                      }`}
                    >
                      <ListIcon className="w-3.5 h-3.5" />
                      <span>List</span>
                    </button>
                    <button
                      onClick={() => setViewMode("board")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        viewMode === "board"
                          ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs"
                          : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
                      }`}
                    >
                      <Grid2X2 className="w-3.5 h-3.5" />
                      <span>Board</span>
                    </button>
                  </div>

                  {/* Field toggles */}
                  <div className="space-y-1.5 pt-1">
                    {([
                      { key: "priority" as const, label: "Priority" },
                      { key: "members" as const, label: "Members" },
                      { key: "dueDate" as const, label: "Due Date" },
                      { key: "labels" as const, label: "Labels" },
                      { key: "status" as const, label: "Status" },
                      { key: "reporter" as const, label: "Reporter" },
                    ] as const).map(({ key, label }) => (
                      <div
                        key={key}
                        onClick={() => handleToggleField(key)}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60 cursor-pointer transition-colors"
                      >
                        <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">{label}</span>
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                          visibleFields[key]
                            ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                            : "bg-neutral-200 dark:bg-neutral-800"
                        }`}>
                          {visibleFields[key] && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Filter button + popover */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => { setIsFilterOpen(!isFilterOpen); setIsFieldsOpen(false); }}
                className={`p-2 border border-neutral-200/90 dark:border-neutral-800 rounded-lg transition-colors cursor-pointer shadow-2xs ${
                  isFilterOpen || hasActiveFilters
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/80"
                }`}
                title="Filter"
              >
                <Filter className="w-4 h-4" />
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 top-9 w-60 sm:w-64 bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xl z-40 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Filter Tasks</span>
                    {hasActiveFilters && (
                      <button
                        onClick={() => { setSelectedFilterStatus("ALL"); setSelectedFilterPriority("ALL"); setSelectedFilterAssignee("ALL"); }}
                        className="text-[11px] font-semibold text-red-500 hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Status</label>
                    <select
                      value={selectedFilterStatus}
                      onChange={(e) => setSelectedFilterStatus(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-medium outline-none text-neutral-900 dark:text-neutral-100"
                    >
                      <option value="ALL">All Statuses</option>
                      {COLUMNS.map((col) => <option key={col} value={col}>{col}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Priority</label>
                    <select
                      value={selectedFilterPriority}
                      onChange={(e) => setSelectedFilterPriority(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-medium outline-none text-neutral-900 dark:text-neutral-100"
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Member / Assignee</label>
                    <select
                      value={selectedFilterAssignee}
                      onChange={(e) => setSelectedFilterAssignee(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-medium outline-none text-neutral-900 dark:text-neutral-100"
                    >
                      <option value="ALL">All Members</option>
                      <option value="Admin">Admin</option>
                      <option value="QA Team">QA Team</option>
                      <option value="Designer">Designer</option>
                      <option value="Security">Security</option>
                      <option value="Design">Design</option>
                      <option value="Dev Team">Dev Team</option>
                      <option value="Product">Product</option>
                      <option value="Engineering">Engineering</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Add Task button */}
            <button
              onClick={() => handleOpenAddModal("To Do")}
              className="bg-[#18181B] hover:bg-black dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-semibold text-xs rounded-lg px-2.5 sm:px-3.5 py-1.5 flex items-center gap-1 sm:gap-1.5 shadow-sm cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Task</span>
            </button>
          </div>
        </header>

        {/* ── Board / List area ──────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto bg-[#FAF9FB] dark:bg-[#09090B]">

          {viewMode === "board" ? (
            /* BOARD VIEW */
            <div className="p-3 sm:p-6 flex items-start gap-3 sm:gap-4 min-w-max pb-8">
              {COLUMNS.map((columnName) => {
                const columnTasks = filteredTasks.filter(
                  (t) => (t.status || "To Do").toLowerCase() === columnName.toLowerCase()
                );

                // During search, hide columns with no matches
                if (searchQuery.trim() && columnTasks.length === 0) return null;

                return (
                  <div
                    key={columnName}
                    className="w-[280px] sm:w-[300px] lg:w-[310px] shrink-0 bg-[#F4F4F6] dark:bg-[#141417] border border-neutral-200/60 dark:border-neutral-800/80 rounded-2xl p-3 sm:p-3.5 flex flex-col gap-3 shadow-2xs"
                  >
                    {/* Column header */}
                    <div className="flex items-center justify-between px-1 pt-0.5">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-neutral-400 cursor-grab" />
                        <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">
                          {columnName}
                        </h2>
                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                          {columnTasks.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenAddModal(columnName)}
                          className="p-1 rounded-md hover:bg-neutral-200/80 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button className="p-1 rounded-md hover:bg-neutral-200/80 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Task cards */}
                    <div className="space-y-2.5">
                      {columnTasks.map((task) => {
                        const tags = (task.tags || "").split(",").map(t => t.trim()).filter(Boolean);
                        return (
                          <div
                            key={task.id}
                            className="relative bg-white dark:bg-[#1C1C20] border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 hover:shadow-sm transition-all group"
                          >
                            {/* Row 1: Title + context menu */}
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex flex-col gap-1.5 min-w-0">
                                <h3
                                  onClick={() => router.push(`/tasks/${task.id}`)}
                                  className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                  {task.title}
                                </h3>
                                {visibleFields.priority && (() => {
                                  const p = (task.priority || "MEDIUM").toUpperCase();
                                  const priorityStyles: Record<string, string> = {
                                    LOW:    "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400",
                                    MEDIUM: "bg-orange-50 dark:bg-orange-950/40 text-orange-500",
                                    HIGH:   "bg-orange-50 dark:bg-orange-950/40 text-orange-500",
                                    URGENT: "bg-red-50 dark:bg-red-950/40 text-red-500",
                                  };
                                  return (
                                    <span className={`self-start text-[10px] font-bold px-1.5 py-0.5 rounded-md ${priorityStyles[p] ?? priorityStyles.MEDIUM}`}>
                                      {p.charAt(0) + p.slice(1).toLowerCase()}
                                    </span>
                                  );
                                })()}
                              </div>
                              <div className="relative shrink-0">
                                <button
                                  onClick={() => setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id)}
                                  className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors cursor-pointer"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                                {activeMenuTaskId === task.id && (
                                  <div className="absolute right-0 top-7 w-44 bg-white dark:bg-[#222226] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-1.5 z-30 space-y-1 text-xs">
                                    <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                                      Move to
                                    </div>
                                    {COLUMNS.filter((c) => c !== columnName).map((targetCol) => (
                                      <button
                                        key={targetCol}
                                        onClick={() => handleMoveTask(task, targetCol)}
                                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium transition-colors"
                                      >
                                        {targetCol}
                                      </button>
                                    ))}
                                    <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
                                    <button
                                      onClick={() => handleOpenEditModal(task)}
                                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium transition-colors"
                                    >
                                      Edit Task
                                    </button>
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

                            {/* Row 2: Avatar + assignee name + red date pill */}
                            {(visibleFields.members || visibleFields.dueDate) && (
                            <div className="flex items-center justify-between gap-2 mb-3">
                              {visibleFields.members && (
                              <div className="flex items-center gap-2 min-w-0">
                                {/* Gradient avatar */}
                                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-[2px] shrink-0">
                                  <div className="w-full h-full rounded-full bg-neutral-800 dark:bg-neutral-700 flex items-center justify-center text-[9px] font-bold text-white">
                                    {(task.assigneeName || "A")[0].toUpperCase()}
                                  </div>
                                </div>
                                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">
                                  {task.assigneeName || "Admin"}
                                </span>
                              </div>
                              )}
                              {/* Red date pill */}
                              {visibleFields.dueDate && (
                              <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/50 text-red-500 dark:text-red-400 text-[11px] font-semibold px-2 py-0.5 rounded-md shrink-0">
                                <Calendar className="w-3 h-3" />
                                <span>{task.dueDate || "29 Jul"}</span>
                              </div>
                              )}
                            </div>
                            )}

                            {/* Row 3: Tags */}
                            {visibleFields.labels && tags.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-0.5"
                                  >
                                    <Tag className="w-2.5 h-2.5 shrink-0" />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Add Task footer */}
                    <button
                      onClick={() => handleOpenAddModal(columnName)}
                      className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white px-1 py-2 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer w-full mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Task</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW — table layout matching Figma design */
            <div className="p-3 sm:p-6 space-y-5">
              {searchQuery.trim() && filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400 dark:text-neutral-600">
                  <Search className="w-8 h-8 opacity-40" />
                  <p className="text-sm font-medium">No tasks match &ldquo;{searchQuery}&rdquo;</p>
                </div>
              ) : COLUMNS.map((columnName) => {
                const groupTasks = filteredTasks.filter(
                  (t) => (t.status || "To Do").toLowerCase() === columnName.toLowerCase()
                );

                // During search, hide sections with no matches
                if (searchQuery.trim() && groupTasks.length === 0) return null;

                return (
                  <div key={columnName}>
                    {/* Group header row — arrow + name, no background card */}
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <ChevronDown className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
                      <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                        {columnName}
                      </span>
                    </div>

                    {/* Table */}
                    <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-[#121215]">
                      {/* Table header */}
                      <div
                        className="bg-neutral-50 dark:bg-[#18181B] border-b border-neutral-200 dark:border-neutral-800"
                        style={{ display: "grid", gridTemplateColumns: `1fr${visibleFields.priority ? " 140px" : ""}${visibleFields.members ? " 120px" : ""}${visibleFields.dueDate ? " 160px" : ""} 80px` }}
                      >
                        <div className="px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Task</div>
                        {visibleFields.priority && <div className="px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Priority</div>}
                        {visibleFields.members && <div className="px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Members</div>}
                        {visibleFields.dueDate && <div className="px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Due Date</div>}
                        <div className="px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Actions</div>
                      </div>

                      {/* Table rows */}
                      {groupTasks.length === 0 ? (
                        <div className="px-4 py-5 text-xs text-neutral-400 dark:text-neutral-600 text-center">
                          No tasks yet
                        </div>
                      ) : (
                        groupTasks.map((task) => {
                          const priority = (task.priority || "MEDIUM").toUpperCase();
                          const priorityConfig: Record<string, { color: string; bars: number }> = {
                            LOW:    { color: "text-neutral-400 dark:text-neutral-500", bars: 1 },
                            MEDIUM: { color: "text-orange-500",                        bars: 2 },
                            HIGH:   { color: "text-orange-500",                        bars: 3 },
                            URGENT: { color: "text-red-500",                           bars: 4 },
                          };
                          const pc = priorityConfig[priority] ?? priorityConfig.MEDIUM;
                          const label = priority.charAt(0) + priority.slice(1).toLowerCase();

                          return (
                            <div
                              key={task.id}
                              className="border-b border-neutral-100 dark:border-neutral-800/60 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group"
                              style={{ display: "grid", gridTemplateColumns: `1fr${visibleFields.priority ? " 140px" : ""}${visibleFields.members ? " 120px" : ""}${visibleFields.dueDate ? " 160px" : ""} 80px` }}
                            >
                              {/* Task name */}
                              <div className="px-4 py-3 flex items-center min-w-0">
                                <span
                                  onClick={() => router.push(`/tasks/${task.id}`)}
                                  className="text-sm text-neutral-900 dark:text-neutral-100 font-medium truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                                >
                                  {task.title}
                                </span>
                              </div>

                              {/* Priority — bar icon + colored label */}
                              {visibleFields.priority && (
                              <div className="px-4 py-3 flex items-center gap-2">
                                <svg
                                  width="14" height="14" viewBox="0 0 14 14"
                                  className={`shrink-0 ${pc.color}`}
                                  fill="currentColor"
                                >
                                  <rect x="0" y="8"  width="3" height="6" rx="0.5" opacity={pc.bars >= 1 ? 1 : 0.2} />
                                  <rect x="4" y="5"  width="3" height="9" rx="0.5" opacity={pc.bars >= 2 ? 1 : 0.2} />
                                  <rect x="8" y="2"  width="3" height="12" rx="0.5" opacity={pc.bars >= 3 ? 1 : 0.2} />
                                  <rect x="12" y="0" width="2" height="14" rx="0.5" opacity={pc.bars >= 4 ? 1 : 0.2} />
                                </svg>
                                <span className={`text-sm font-medium ${pc.color}`}>{label}</span>
                              </div>
                              )}

                              {/* Members — avatar */}
                              {visibleFields.members && (
                              <div className="px-4 py-3 flex items-center">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-[2px] shrink-0">
                                  <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-white">
                                    {(task.assigneeName || "A").substring(0, 2).toUpperCase()}
                                  </div>
                                </div>
                              </div>
                              )}

                              {/* Due Date */}
                              {visibleFields.dueDate && (
                              <div className="px-4 py-3 flex items-center">
                                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                  {task.dueDate || "—"}
                                </span>
                              </div>
                              )}

                              {/* Actions */}
                              <div className="px-4 py-3 flex items-center relative">
                                <button
                                  onClick={() => setActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id)}
                                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>

                                {activeMenuTaskId === task.id && (
                                  <div className="absolute right-2 top-10 w-44 bg-white dark:bg-[#222226] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-1.5 z-30 space-y-1 text-xs">
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
                                      onClick={() => handleOpenEditModal(task)}
                                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium transition-colors"
                                    >
                                      Edit Task
                                    </button>
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
                          );
                        })
                      )}

                      {/* Add Task row */}
                      <button
                        onClick={() => handleOpenAddModal(columnName)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer border-t border-neutral-100 dark:border-neutral-800/60"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Task</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Create / Edit Modal ────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-xl animate-in fade-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
                {editingTask ? "Edit Task" : `Add Task to ${activeColumnForNew}`}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
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
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
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
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-medium outline-none text-neutral-900 dark:text-neutral-100"
                  >
                    {COLUMNS.map((col) => <option key={col} value={col}>{col}</option>)}
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
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-medium outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
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
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-medium outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    placeholder="Deployment, Testing..."
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-medium outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#18181B] hover:bg-black dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98]"
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
