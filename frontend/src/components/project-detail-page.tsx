"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  User,
  Task,
  Project,
  getProjectById,
  apiFetchProjectTasks,
  apiCreateProjectTask,
  apiUpdateProjectTask,
  apiDeleteProjectTask,
} from "@/lib/api";
import {
  PanelLeft,
  Search,
  SlidersHorizontal,
  Filter,
  Plus,
  MoreHorizontal,
  Folder,
  Grid2X2,
  ChevronsUpDown,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Settings,
  Check,
  X,
  Calendar,
  BarChart2,
  Users,
  Tag,
  UserCircle,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_GROUPS = ["To Do", "Doing", "Completed", "On Hold"];

const PRIORITY_COLORS: Record<string, string> = {
  LOW:    "text-neutral-400 dark:text-neutral-500",
  MEDIUM: "text-orange-400",
  HIGH:   "text-orange-500",
  URGENT: "text-red-500",
};

const PRIORITY_BARS: Record<string, number> = {
  LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 4,
};

// ─── Priority icon ────────────────────────────────────────────────────────────

function PriorityIcon({ priority }: { priority: string }) {
  const p     = (priority || "MEDIUM").toUpperCase();
  const color = PRIORITY_COLORS[p] ?? PRIORITY_COLORS.MEDIUM;
  const bars  = PRIORITY_BARS[p]  ?? 2;
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className={`shrink-0 ${color}`} fill="currentColor">
      <rect x="0"  y="8" width="3" height="6"  rx="0.5" opacity={bars >= 1 ? 1 : 0.2} />
      <rect x="4"  y="5" width="3" height="9"  rx="0.5" opacity={bars >= 2 ? 1 : 0.2} />
      <rect x="8"  y="2" width="3" height="12" rx="0.5" opacity={bars >= 3 ? 1 : 0.2} />
      <rect x="12" y="0" width="2" height="14" rx="0.5" opacity={bars >= 4 ? 1 : 0.2} />
    </svg>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProjectDetailPageProps {
  projectId: string;
  user: User;
  onLogout: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProjectDetailPage({ projectId, user, onLogout }: ProjectDetailPageProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const [project,      setProject]      = useState<Project | undefined>(undefined);
  const [tasks,        setTasks]        = useState<Task[]>([]);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);
  const [searchQuery,  setSearchQuery]  = useState("");

  // ── Collapse state per group ──────────────────────────────────────────────
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggleCollapse = (group: string) =>
    setCollapsed(prev => ({ ...prev, [group]: !prev[group] }));

  // ── Fields popover ────────────────────────────────────────────────────────
  const fieldsRef = useRef<HTMLDivElement>(null);
  const [isFieldsOpen,  setIsFieldsOpen]  = useState(false);
  const [visibleFields, setVisibleFields] = useState({
    priority: true,
    members:  true,
    dueDate:  true,
    labels:   false,
    status:   false,
    reporter: false,
  });
  const handleToggleField = (key: keyof typeof visibleFields) =>
    setVisibleFields(prev => ({ ...prev, [key]: !prev[key] }));

  // ── Filter popover ────────────────────────────────────────────────────────
  const filterRef = useRef<HTMLDivElement>(null);
  const [isFilterOpen,      setIsFilterOpen]      = useState(false);
  const [filterPriority,    setFilterPriority]    = useState("ALL");
  const [filterAssignee,    setFilterAssignee]    = useState("ALL");

  // ── Add / Edit Task modal ─────────────────────────────────────────────────
  const [isModalOpen,      setIsModalOpen]      = useState(false);
  const [modalStatus,      setModalStatus]      = useState("To Do");
  const [editingTask,      setEditingTask]      = useState<Task | null>(null);
  const [formData,         setFormData]         = useState({
    title: "", status: "To Do", priority: "MEDIUM", assigneeName: "Admin", dueDate: "", tags: "",
  });

  // ── Context menu ──────────────────────────────────────────────────────────
  const [menuTaskId, setMenuTaskId] = useState<string | null>(null);
  const [menuPos,    setMenuPos]    = useState<{ x: number; y: number } | null>(null);
  const [menuTask,   setMenuTask]   = useState<Task | null>(null);
  const [menuGroup,  setMenuGroup]  = useState<string>("");

  // ── Workspace popover ─────────────────────────────────────────────────────
  const workspaceRef  = useRef<HTMLDivElement>(null);
  const [workspacePopoverOpen, setWorkspacePopoverOpen] = useState(false);
  const [changeThemeOpen,      setChangeThemeOpen]      = useState(false);
  const [colorModeOpen,        setColorModeOpen]        = useState(false);
  const [submenuPos,           setSubmenuPos]            = useState({ top: 0, left: 0 });
  const { theme, setTheme } = useTheme();

  const ACCENT_COLORS = [
    { name: "Amber",   bg: "bg-amber-500"   },
    { name: "Blue",    bg: "bg-blue-500"    },
    { name: "Pink",    bg: "bg-pink-500"    },
    { name: "Rose",    bg: "bg-rose-500"    },
    { name: "Emerald", bg: "bg-emerald-500" },
    { name: "Black",   bg: "bg-neutral-900 dark:bg-neutral-100" },
  ];
  const [accentColor, setAccentColor] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("pyramid_accent_color") || "Blue" : "Blue"
  );

  // ── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const p = getProjectById(projectId);
    setProject(p);
    setTasks(apiFetchProjectTasks(projectId));
  }, [projectId]);

  // ── Close popovers on outside click ──────────────────────────────────────
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (fieldsRef.current    && !fieldsRef.current.contains(e.target as Node))    setIsFieldsOpen(false);
      if (filterRef.current    && !filterRef.current.contains(e.target as Node))    setIsFilterOpen(false);
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setWorkspacePopoverOpen(false); setChangeThemeOpen(false); setColorModeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const positionSubmenu = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setSubmenuPos({ top: rect.top, left: rect.right + 4 });
  };

  const openAddModal = (status: string) => {
    setEditingTask(null);
    setModalStatus(status);
    setFormData({ title: "", status, priority: "MEDIUM", assigneeName: "Admin", dueDate: "", tags: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title, status: task.status,
      priority: task.priority || "MEDIUM",
      assigneeName: task.assigneeName || "Admin",
      dueDate: task.dueDate || "",
      tags: task.tags || "",
    });
    setIsModalOpen(true);
    setMenuTaskId(null); setMenuPos(null);
  };

  const handleSubmitModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    if (editingTask) {
      const updated = apiUpdateProjectTask(projectId, editingTask.id, formData);
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...updated } : t));
    } else {
      const created = apiCreateProjectTask(projectId, formData);
      setTasks(prev => [...prev, created]);
    }
    setIsModalOpen(false);
  };

  const handleMoveTask = (task: Task, targetStatus: string) => {
    const updated = apiUpdateProjectTask(projectId, task.id, { status: targetStatus });
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: targetStatus } : t));
    setMenuTaskId(null); setMenuPos(null);
  };

  const handleDeleteTask = (id: string) => {
    apiDeleteProjectTask(projectId, id);
    setTasks(prev => prev.filter(t => t.id !== id));
    setMenuTaskId(null); setMenuPos(null);
  };

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredTasks = tasks.filter(t => {
    if (filterPriority !== "ALL" && (t.priority || "MEDIUM").toUpperCase() !== filterPriority) return false;
    if (filterAssignee !== "ALL" && (t.assigneeName || "Admin") !== filterAssignee) return false;
    if (searchQuery.trim() && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const hasActiveFilters = filterPriority !== "ALL" || filterAssignee !== "ALL";

  // ── Grid template ─────────────────────────────────────────────────────────
  const gridCols = [
    "1fr",
    visibleFields.priority ? "160px" : "",
    visibleFields.members  ? "120px" : "",
    visibleFields.dueDate  ? "160px" : "",
    "80px",
  ].filter(Boolean).join(" ");

  // ─── Sidebar ──────────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="p-4 space-y-6 flex-1 overflow-y-auto overflow-x-hidden">
      {/* User profile */}
      <div className="space-y-1 relative" ref={workspaceRef}>
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-0.5 shrink-0 shadow-xs">
              <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center text-white text-xs font-bold">
                {(user.name || "D")[0].toUpperCase()}
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-neutral-900 dark:text-white truncate">{user.name || "Dexter"}</span>
              <span className="bg-[#FF5252] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md self-start inline-block tracking-tight">Mandira Datta</span>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setWorkspacePopoverOpen(!workspacePopoverOpen); }}
            className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer shrink-0"
          >
            <ChevronsUpDown className="w-4 h-4 text-neutral-400" />
          </button>
        </div>

        {/* Workspace popover */}
        {workspacePopoverOpen && (
          <div className="absolute left-0 top-full mt-1 w-54 bg-white dark:bg-[#1C1C1F] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 pt-4 pb-3 text-center border-b border-neutral-100 dark:border-neutral-800">
              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-0.5 shadow-sm mb-2">
                <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center text-white text-sm font-bold">
                  {(user.name || "D")[0].toUpperCase()}
                </div>
              </div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{user.name || "Dexter"}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{user.email || "dexter@pyramid.app"}</p>
            </div>
            <div className="py-1.5">
              <button
                onMouseEnter={(e) => { positionSubmenu(e); setChangeThemeOpen(true); setColorModeOpen(false); }}
                onClick={(e) =>      { positionSubmenu(e); setChangeThemeOpen(!changeThemeOpen); setColorModeOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5"><Sun className="w-4 h-4 text-neutral-400" />Change Theme</span>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              </button>
              <button
                onMouseEnter={(e) => { positionSubmenu(e); setColorModeOpen(true); setChangeThemeOpen(false); }}
                onClick={(e) =>      { positionSubmenu(e); setColorModeOpen(!colorModeOpen); setChangeThemeOpen(false); }}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <span className={`w-4 h-4 rounded ${ACCENT_COLORS.find(c => c.name === accentColor)?.bg || "bg-blue-500"} shrink-0`} />
                  Color Mode
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              </button>
              <button
                onClick={() => { setWorkspacePopoverOpen(false); router.push("/settings"); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer">
                <Settings className="w-4 h-4 text-neutral-400" />Settings
              </button>
            </div>
          </div>
        )}

        {/* Theme submenu */}
        {workspacePopoverOpen && changeThemeOpen && (
          <div
            onMouseLeave={() => setChangeThemeOpen(false)}
            className="fixed w-44 bg-white dark:bg-[#1C1C1F] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-[70] py-1.5 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: submenuPos.top, left: submenuPos.left }}
          >
            <p className="px-3.5 pt-1.5 pb-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Theme</p>
            {(["light", "dark", "system"] as const).map(t => (
              <button key={t} onClick={() => { setTheme(t); setChangeThemeOpen(false); setWorkspacePopoverOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-sm transition-colors cursor-pointer ${theme === t ? "text-neutral-900 dark:text-white font-semibold" : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"}`}
              >
                <span className="flex items-center gap-2.5">
                  {t === "light" ? <Sun className="w-3.5 h-3.5" /> : t === "dark" ? <Moon className="w-3.5 h-3.5" /> : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>
                    </svg>
                  )}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </span>
                {theme === t && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        )}

        {/* Color mode submenu */}
        {workspacePopoverOpen && colorModeOpen && (
          <div
            onMouseLeave={() => setColorModeOpen(false)}
            className="fixed w-48 bg-white dark:bg-[#1C1C1F] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-[70] py-1.5 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: submenuPos.top, left: submenuPos.left }}
          >
            <p className="px-3.5 pt-1.5 pb-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Color Mode</p>
            {ACCENT_COLORS.map(color => (
              <button key={color.name} onClick={() => { setAccentColor(color.name); localStorage.setItem("pyramid_accent_color", color.name); setColorModeOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-sm transition-colors cursor-pointer ${accentColor === color.name ? "text-neutral-900 dark:text-white font-semibold" : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"}`}
              >
                <span className="flex items-center gap-2.5"><span className={`w-3.5 h-3.5 rounded-sm ${color.bg} shrink-0`} />{color.name}</span>
                {accentColor === color.name && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 tracking-tight">
          <span>Workspace</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
        <div className="space-y-1">
          <button
            onClick={() => router.push("/")}
            className={`w-full font-medium rounded-xl px-3 py-2 flex items-center gap-2.5 text-sm cursor-pointer transition-colors ${
              pathname === "/"
                ? "bg-[#ECECEE] dark:bg-[#222226] text-neutral-900 dark:text-white font-semibold shadow-2xs"
                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/40"
            }`}
          >
            <Grid2X2 className="w-4 h-4" />
            <span>Tasks</span>
          </button>
          <button
            onClick={() => router.push("/projects")}
            className="w-full font-semibold rounded-xl px-3 py-2 flex items-center gap-2.5 text-sm cursor-pointer transition-colors bg-[#ECECEE] dark:bg-[#222226] text-neutral-900 dark:text-white shadow-2xs"
          >
            <Folder className="w-4 h-4" />
            <span>Projects</span>
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-white dark:bg-[#09090B] text-neutral-900 dark:text-neutral-100 font-sans overflow-hidden transition-colors duration-200">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 flex flex-col
        w-64 sm:w-60
        bg-white dark:bg-[#121215]
        border-r border-neutral-200/80 dark:border-neutral-800
        transition-transform duration-300 ease-in-out
        lg:static lg:z-auto lg:translate-x-0 lg:shrink-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        ${!sidebarOpen ? "lg:w-0 lg:overflow-hidden lg:border-r-0" : "lg:w-60"}
      `}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#09090B] overflow-hidden">

        {/* Header */}
        <header className="h-14 border-b border-neutral-200/80 dark:border-neutral-800 px-3 sm:px-6 flex items-center justify-between shrink-0 bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-xs z-10 gap-2">
          {/* Left: toggle + breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                onClick={() => router.push("/projects")}
                className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              >
                Projects
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                {project?.name ?? "…"}
              </span>
            </div>
          </div>

          {/* Right toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

            {/* Search */}
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
                <button onClick={() => setSearchQuery("")} className="absolute right-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Fields */}
            <div className="relative" ref={fieldsRef}>
              <button
                onClick={() => { setIsFieldsOpen(!isFieldsOpen); setIsFilterOpen(false); }}
                className={`border border-neutral-200/90 dark:border-neutral-800 px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                  isFieldsOpen
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/80"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Fields</span>
              </button>

              {isFieldsOpen && (
                <div className="absolute right-0 top-9 w-60 bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 shadow-xl z-40 space-y-1.5 pt-4 animate-in fade-in zoom-in-95 duration-150">
                  {([
                    { key: "priority" as const, label: "Priority",  icon: <BarChart2   className="w-3.5 h-3.5" /> },
                    { key: "members"  as const, label: "Members",   icon: <Users       className="w-3.5 h-3.5" /> },
                    { key: "dueDate"  as const, label: "Due Date",  icon: <Calendar    className="w-3.5 h-3.5" /> },
                    { key: "labels"   as const, label: "Labels",    icon: <Tag         className="w-3.5 h-3.5" /> },
                    { key: "status"   as const, label: "Status",    icon: <UserCircle  className="w-3.5 h-3.5" /> },
                    { key: "reporter" as const, label: "Reporter",  icon: <UserCircle  className="w-3.5 h-3.5" /> },
                  ]).map(({ key, label, icon }) => (
                    <div key={key} onClick={() => handleToggleField(key)}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60 cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                        <span className="text-neutral-400 dark:text-neutral-500">{icon}</span>{label}
                      </span>
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${visibleFields[key] ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900" : "bg-neutral-200 dark:bg-neutral-800"}`}>
                        {visibleFields[key] && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Filter */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => { setIsFilterOpen(!isFilterOpen); setIsFieldsOpen(false); }}
                className={`p-2 border border-neutral-200/90 dark:border-neutral-800 rounded-lg transition-colors cursor-pointer shadow-2xs ${
                  isFilterOpen || hasActiveFilters
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/80"
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 top-9 w-60 bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xl z-40 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Filter Tasks</span>
                    {hasActiveFilters && (
                      <button onClick={() => { setFilterPriority("ALL"); setFilterAssignee("ALL"); }}
                        className="text-[11px] font-semibold text-red-500 hover:underline">Reset</button>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Priority</label>
                    <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-medium outline-none text-neutral-900 dark:text-neutral-100">
                      <option value="ALL">All Priorities</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Member / Assignee</label>
                    <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-medium outline-none text-neutral-900 dark:text-neutral-100">
                      <option value="ALL">All Members</option>
                      <option value="Admin">Admin</option>
                      <option value="Dexter">Dexter</option>
                      <option value="QA Team">QA Team</option>
                      <option value="Dev Team">Dev Team</option>
                      <option value="Designer">Designer</option>
                      <option value="Security">Security</option>
                      <option value="CN">CN</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Add Task */}
            <button
              onClick={() => openAddModal("To Do")}
              className="bg-[#18181B] hover:bg-black dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-semibold text-xs rounded-lg px-2.5 sm:px-3.5 py-1.5 flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Task</span>
            </button>
          </div>
        </header>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto bg-[#FAF9FB] dark:bg-[#09090B]">
          <div className="p-3 sm:p-6 space-y-5">

            {/* Page title */}
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Tasks</h1>

            {/* Status groups */}
            {STATUS_GROUPS.map(group => {
              const groupTasks = filteredTasks.filter(
                t => (t.status || "To Do").toLowerCase() === group.toLowerCase()
              );

              // Hide empty groups during search
              if (searchQuery.trim() && groupTasks.length === 0) return null;

              const isCollapsed = collapsed[group];

              return (
                <div key={group}>
                  {/* Group header */}
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <button
                      onClick={() => toggleCollapse(group)}
                      className="flex items-center gap-2 hover:opacity-70 transition-opacity cursor-pointer"
                    >
                      {isCollapsed
                        ? <ChevronRight className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
                        : <ChevronDown  className="w-4 h-4 text-neutral-500 dark:text-neutral-400 shrink-0" />
                      }
                      <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{group}</span>
                    </button>
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                      {groupTasks.length}
                    </span>
                  </div>

                  {!isCollapsed && (
                    <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-[#121215]">
                      {/* Table header */}
                      <div
                        className="bg-neutral-50 dark:bg-[#18181B] border-b border-neutral-200 dark:border-neutral-800"
                        style={{ display: "grid", gridTemplateColumns: gridCols }}
                      >
                        <div className="px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Task</div>
                        {visibleFields.priority && <div className="px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Priority</div>}
                        {visibleFields.members  && <div className="px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Members</div>}
                        {visibleFields.dueDate  && <div className="px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Due Date</div>}
                        <div className="px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Actions</div>
                      </div>

                      {/* Rows */}
                      {groupTasks.length === 0 ? (
                        <div className="px-4 py-5 text-xs text-neutral-400 dark:text-neutral-600 text-center">No tasks yet</div>
                      ) : groupTasks.map(task => {
                        const priority = (task.priority || "MEDIUM").toUpperCase();
                        const label    = priority.charAt(0) + priority.slice(1).toLowerCase();
                        const color    = PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.MEDIUM;
                        const initials = (task.assigneeName || "").substring(0, 2).toUpperCase() || "+";

                        return (
                          <div
                            key={task.id}
                            className="border-b border-neutral-100 dark:border-neutral-800/60 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group"
                            style={{ display: "grid", gridTemplateColumns: gridCols }}
                          >
                            {/* Title */}
                            <div className="px-4 py-3 flex items-center min-w-0">
                              <span className="text-sm text-neutral-900 dark:text-neutral-100 font-medium truncate">
                                {task.title}
                              </span>
                            </div>

                            {/* Priority */}
                            {visibleFields.priority && (
                              <div className="px-4 py-3 flex items-center gap-2">
                                <PriorityIcon priority={priority} />
                                <span className={`text-sm font-medium ${color}`}>{label}</span>
                              </div>
                            )}

                            {/* Members */}
                            {visibleFields.members && (
                              <div className="px-4 py-3 flex items-center">
                                {task.assigneeName ? (
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-[2px] shrink-0">
                                    <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-white">
                                      {initials}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="w-7 h-7 rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-400 dark:text-neutral-600 text-xs font-bold">
                                    +
                                  </div>
                                )}
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
                            <div className="px-4 py-3 flex items-center">
                              <button
                                onClick={(e) => {
                                  if (menuTaskId === task.id) {
                                    setMenuTaskId(null); setMenuPos(null);
                                  } else {
                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                    setMenuPos({ x: rect.right - 176, y: rect.bottom + 4 });
                                    setMenuTaskId(task.id);
                                    setMenuTask(task);
                                    setMenuGroup(group);
                                  }
                                }}
                                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add Task row */}
                      <button
                        onClick={() => openAddModal(group)}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer border-t border-neutral-100 dark:border-neutral-800/60"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Task</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty state */}
            {searchQuery.trim() && filteredTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400 dark:text-neutral-600">
                <Search className="w-8 h-8 opacity-40" />
                <p className="text-sm font-medium">No tasks match &ldquo;{searchQuery}&rdquo;</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Add / Edit Task Modal ──────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-xl animate-in fade-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">
                {editingTask ? "Edit Task" : `Add Task to ${modalStatus}`}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Task Title</label>
                <input type="text" required placeholder="e.g. Design new landing page"
                  value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Status</label>
                  <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-medium outline-none text-neutral-900 dark:text-neutral-100">
                    {STATUS_GROUPS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Priority</label>
                  <select value={formData.priority} onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-medium outline-none text-neutral-900 dark:text-neutral-100">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Assignee</label>
                  <input type="text" placeholder="Admin, Dexter..."
                    value={formData.assigneeName} onChange={e => setFormData({ ...formData, assigneeName: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-medium outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Due Date</label>
                  <input type="text" placeholder="12 Sep 2026"
                    value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-medium outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 bg-[#18181B] hover:bg-black dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98]">
                  {editingTask ? "Save Changes" : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Context menu (portal) ──────────────────────────────────────────── */}
      {menuTaskId && menuPos && menuTask && createPortal(
        <>
          <div className="fixed inset-0 z-[99]" onClick={() => { setMenuTaskId(null); setMenuPos(null); }} />
          <div
            className="fixed w-44 bg-white dark:bg-[#222226] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl p-1.5 z-[100] space-y-1 text-xs"
            style={{ left: menuPos.x, top: menuPos.y }}
          >
            <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Move to</div>
            {STATUS_GROUPS.filter(g => g !== menuGroup).map(target => (
              <button key={target} onClick={() => handleMoveTask(menuTask, target)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium transition-colors">
                {target}
              </button>
            ))}
            <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
            <button onClick={() => openEditModal(menuTask)}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium transition-colors">
              Edit Task
            </button>
            <button onClick={() => handleDeleteTask(menuTask.id)}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-medium transition-colors">
              Delete Task
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
