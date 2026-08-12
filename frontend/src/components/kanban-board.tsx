"use client";

import React, { useEffect, useState, useRef } from "react";
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
  User as UserIcon,
  Sparkles,
  ChevronRight,
  Shield,
  Clock,
  CheckSquare,
  Square,
  AlertCircle,
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

  // View Mode: "board" or "list"
  const [viewMode, setViewMode] = useState<"board" | "list">("board");

  // Fields Popover state
  const [isFieldsOpen, setIsFieldsOpen] = useState(false);
  const [visibleFields, setVisibleFields] = useState({
    priority: false,
    members: true,
    dueDate: false,
    labels: false,
    status: false,
    reporter: false,
  });

  // Filter Popover state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilterStatus, setSelectedFilterStatus] = useState("ALL");
  const [selectedFilterPriority, setSelectedFilterPriority] = useState("ALL");
  const [selectedFilterAssignee, setSelectedFilterAssignee] = useState("ALL");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeColumnForNew, setActiveColumnForNew] = useState("To Do");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    status: "To Do",
    priority: "MEDIUM",
    assigneeName: "Admin",
    dueDate: "29 Jul",
    tags: "Deployment,Deployment",
  });

  // Refs for closing popovers on outside click
  const fieldsRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

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

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await apiFetchTasks({
        status: selectedFilterStatus,
        priority: selectedFilterPriority,
        search: searchQuery,
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
  }, [searchQuery, selectedFilterStatus, selectedFilterPriority]);

  const handleToggleField = (fieldKey: keyof typeof visibleFields) => {
    setVisibleFields((prev) => ({
      ...prev,
      [fieldKey]: !prev[fieldKey],
    }));
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

  // Filtered Tasks
  const filteredTasks = tasks.filter((t) => {
    if (selectedFilterAssignee !== "ALL" && (t.assigneeName || "Admin") !== selectedFilterAssignee) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex h-screen bg-white dark:bg-[#09090B] text-neutral-900 dark:text-neutral-100 font-sans overflow-hidden transition-colors duration-200">
      {/* 1. Left Sidebar Navigation */}
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

        {/* Sidebar Footer */}
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

      {/* 2. Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#09090B] overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-neutral-200/80 dark:border-neutral-800 px-6 flex items-center justify-between shrink-0 bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-xs z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Tasks
            </h1>
          </div>

          {/* Toolbar Actions */}
          <div className="flex items-center gap-2.5">
            {/* Search */}
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

            {/* Fields Button & Popover (Matching Figma Screenshot 223225) */}
            <div className="relative" ref={fieldsRef}>
              <button
                onClick={() => {
                  setIsFieldsOpen(!isFieldsOpen);
                  setIsFilterOpen(false);
                }}
                className={`border border-neutral-200/90 dark:border-neutral-800 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-2xs cursor-pointer ${
                  isFieldsOpen
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/80"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Fields</span>
              </button>

              {/* Fields Popover Container */}
              {isFieldsOpen && (
                <div className="absolute right-0 top-9 w-64 bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 shadow-xl z-40 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  {/* Segmented Control Switcher: List vs Board */}
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

                  {/* Field Visibility Checkboxes */}
                  <div className="space-y-1.5 pt-1">
                    {[
                      { key: "priority" as const, label: "Priority" },
                      { key: "members" as const, label: "Members" },
                      { key: "dueDate" as const, label: "Due Date" },
                      { key: "labels" as const, label: "Labels" },
                      { key: "status" as const, label: "Status" },
                      { key: "reporter" as const, label: "Reporter" },
                    ].map(({ key, label }) => {
                      const isChecked = visibleFields[key];
                      return (
                        <div
                          key={key}
                          onClick={() => handleToggleField(key)}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60 cursor-pointer transition-colors"
                        >
                          <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                            {label}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                              isChecked
                                ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                                : "bg-neutral-200 dark:bg-neutral-800"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Filter Button & Popover */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => {
                  setIsFilterOpen(!isFilterOpen);
                  setIsFieldsOpen(false);
                }}
                className={`p-2 border border-neutral-200/90 dark:border-neutral-800 rounded-lg transition-colors cursor-pointer shadow-2xs ${
                  isFilterOpen || selectedFilterStatus !== "ALL" || selectedFilterPriority !== "ALL" || selectedFilterAssignee !== "ALL"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/80"
                }`}
                title="Filter"
              >
                <Filter className="w-4 h-4" />
              </button>

              {/* Filter Popover Container */}
              {isFilterOpen && (
                <div className="absolute right-0 top-9 w-64 bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xl z-40 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Filter Tasks
                    </span>
                    {(selectedFilterStatus !== "ALL" || selectedFilterPriority !== "ALL" || selectedFilterAssignee !== "ALL") && (
                      <button
                        onClick={() => {
                          setSelectedFilterStatus("ALL");
                          setSelectedFilterPriority("ALL");
                          setSelectedFilterAssignee("ALL");
                        }}
                        className="text-[11px] font-semibold text-red-500 hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Status
                    </label>
                    <select
                      value={selectedFilterStatus}
                      onChange={(e) => setSelectedFilterStatus(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-medium outline-none"
                    >
                      <option value="ALL">All Statuses</option>
                      {COLUMNS.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={selectedFilterPriority}
                      onChange={(e) => setSelectedFilterPriority(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-medium outline-none"
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>

                  {/* Member / Assignee Filter */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Member / Assignee
                    </label>
                    <select
                      value={selectedFilterAssignee}
                      onChange={(e) => setSelectedFilterAssignee(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-medium outline-none"
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

        {/* 3. Main Display Area: BOARD VIEW or LIST VIEW */}
        <div className="flex-1 overflow-auto bg-[#FAF9FB] dark:bg-[#09090B]">
          {viewMode === "board" ? (
            /* BOARD VIEW (Kanban Columns) */
            <div className="p-6 flex items-start gap-4 min-w-max pb-8">
              {COLUMNS.map((columnName) => {
                const columnTasks = filteredTasks.filter(
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
                        <button className="p-1 rounded-md hover:bg-neutral-200/80 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Task Cards */}
                    <div className="space-y-3">
                      {columnTasks.map((task) => (
                        <div
                          key={task.id}
                          className="relative bg-white dark:bg-[#1C1C20] border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all space-y-3 group"
                        >
                          {/* Title & Options */}
                          <div className="flex items-start justify-between gap-2">
                            <h3
                              onClick={() => handleOpenEditModal(task)}
                              className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight leading-snug hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                            >
                              {task.title}
                            </h3>

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

                          {/* Member / Assignee Field */}
                          {visibleFields.members && (
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 shrink-0 flex items-center justify-center text-[9px] font-bold text-white">
                                {(task.assigneeName || "A")[0]}
                              </div>
                              <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                {task.assigneeName || "Admin"}
                              </span>
                            </div>
                          )}

                          {/* Priority Field */}
                          {visibleFields.priority && (
                            <div className="inline-block">
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                {task.priority || "MEDIUM"}
                              </span>
                            </div>
                          )}

                          {/* Due Date Field */}
                          {visibleFields.dueDate && (
                            <div className="bg-[#FFF0F0] dark:bg-red-950/60 text-[#FF4D4D] dark:text-red-300 font-bold text-[11px] px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{task.dueDate || "29 Jul"}</span>
                            </div>
                          )}

                          {/* Labels Field */}
                          {visibleFields.labels && (
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
                          )}

                          {/* Status Field */}
                          {visibleFields.status && (
                            <div className="text-[11px] font-semibold text-neutral-500">
                              Status: <span className="text-neutral-900 dark:text-white font-bold">{task.status}</span>
                            </div>
                          )}

                          {/* Reporter Field */}
                          {visibleFields.reporter && (
                            <div className="text-[11px] font-medium text-neutral-400">
                              Reporter: Dexter
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

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
          ) : (
            /* LIST VIEW (Structured Tabular Grouped View) */
            <div className="p-6 max-w-6xl mx-auto space-y-6">
              {COLUMNS.map((columnName) => {
                const groupTasks = filteredTasks.filter(
                  (t) => (t.status || "To Do").toLowerCase() === columnName.toLowerCase()
                );

                return (
                  <div
                    key={columnName}
                    className="bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-2xs"
                  >
                    {/* List Section Header */}
                    <div className="bg-[#F4F4F6] dark:bg-[#18181B] px-5 py-3 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {columnName}
                        </h2>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-bold">
                          {groupTasks.length}
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenAddModal(columnName)}
                        className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Task</span>
                      </button>
                    </div>

                    {/* List Items */}
                    {groupTasks.length === 0 ? (
                      <div className="p-4 text-xs text-neutral-400 text-center">
                        No tasks in {columnName}
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                        {groupTasks.map((task) => (
                          <div
                            key={task.id}
                            className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group"
                          >
                            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                {task.title}
                              </span>

                              {visibleFields.priority && (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                  {task.priority || "MEDIUM"}
                                </span>
                              )}
                            </div>

                            {/* Flexible Fields Columns */}
                            <div className="flex items-center gap-4 text-xs shrink-0">
                              {visibleFields.members && (
                                <div className="flex items-center gap-1.5 w-28">
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 shrink-0 flex items-center justify-center text-[9px] font-bold text-white">
                                    {(task.assigneeName || "A")[0]}
                                  </div>
                                  <span className="font-semibold text-neutral-700 dark:text-neutral-300 truncate">
                                    {task.assigneeName || "Admin"}
                                  </span>
                                </div>
                              )}

                              {visibleFields.dueDate && (
                                <div className="bg-[#FFF0F0] dark:bg-red-950/60 text-[#FF4D4D] dark:text-red-300 font-bold text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{task.dueDate || "29 Jul"}</span>
                                </div>
                              )}

                              {visibleFields.labels && (
                                <div className="flex items-center gap-1">
                                  {(task.tags || "Deployment")
                                    .split(",")
                                    .slice(0, 2)
                                    .map((tag, idx) => (
                                      <span
                                        key={idx}
                                        className="border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 font-medium text-[10px] px-1.5 py-0.5 rounded-full"
                                      >
                                        {tag.trim()}
                                      </span>
                                    ))}
                                </div>
                              )}

                              {visibleFields.status && (
                                <span className="font-bold text-neutral-500 text-xs">
                                  {task.status}
                                </span>
                              )}

                              {/* Actions */}
                              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                                <button
                                  onClick={() => handleOpenEditModal(task)}
                                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
