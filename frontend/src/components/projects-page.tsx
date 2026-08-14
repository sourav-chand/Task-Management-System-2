"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { User, Project, clearStoredToken, apiFetchProjects, apiCreateProject, apiUpdateProject, apiDeleteProject } from "@/lib/api";
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
  Circle,
  BarChart2,
  Users,
  Calendar,
  Tag,
  UserCircle,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Priority = "No Priority" | "Urgent" | "High" | "Medium" | "Low";

const PRIORITY_COLORS: Record<Priority, string> = {
  "No Priority": "text-neutral-400 dark:text-neutral-500",
  Urgent:        "text-red-500",
  High:          "text-orange-500",
  Medium:        "text-orange-400",
  Low:           "text-neutral-400 dark:text-neutral-500",
};

const PRIORITY_BAR_COUNT: Record<Priority, number> = {
  "No Priority": 0,
  Urgent:        4,
  High:          3,
  Medium:        2,
  Low:           1,
};

function PriorityIcon({ priority }: { priority: Priority }) {
  const color = PRIORITY_COLORS[priority];
  const bars  = PRIORITY_BAR_COUNT[priority];
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className={`shrink-0 ${color}`} fill="currentColor">
      <rect x="0"  y="8" width="3"  height="6"  rx="0.5" opacity={bars >= 1 ? 1 : 0.2} />
      <rect x="4"  y="5" width="3"  height="9"  rx="0.5" opacity={bars >= 2 ? 1 : 0.2} />
      <rect x="8"  y="2" width="3"  height="12" rx="0.5" opacity={bars >= 3 ? 1 : 0.2} />
      <rect x="12" y="0" width="2"  height="14" rx="0.5" opacity={bars >= 4 ? 1 : 0.2} />
    </svg>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface ProjectsPageProps {
  user: User;
  onLogout: () => void;
}

export function ProjectsPage({ user, onLogout }: ProjectsPageProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const [sidebarOpen,      setSidebarOpen]      = useState(true);
  const [projects,         setProjects]          = useState<Project[]>([]);
  const [searchQuery,      setSearchQuery]       = useState("");

  // ── Fields popover ──────────────────────────────────────────────────────────
  const fieldsRef = useRef<HTMLDivElement>(null);
  const [isFieldsOpen, setIsFieldsOpen] = useState(false);
  const [visibleFields, setVisibleFields] = useState({
    priority:  true,
    lead:      true,
    dueDate:   true,
    status:    false,
    team:      false,
    labels:    false,
    reporter:  false,
  });

  // ── Filter popover ──────────────────────────────────────────────────────────
  const filterRef = useRef<HTMLDivElement>(null);
  const [isFilterOpen,          setIsFilterOpen]          = useState(false);
  const [filterPriority,        setFilterPriority]        = useState<string>("ALL");
  const [filterStatus,          setFilterStatus]          = useState<string>("ALL");
  const [filterLead,            setFilterLead]            = useState<string>("ALL");

  // ── Priority dropdown (inline table cell) ───────────────────────────────────
  const [activePriorityId,      setActivePriorityId]      = useState<string | null>(null);
  const [priorityDropdownPos,   setPriorityDropdownPos]   = useState<{ x: number; y: number } | null>(null);

  // ── Fields filter dropdown (top-right) ─────────────────────────────────────
  const [isFieldsFilterOpen,    setIsFieldsFilterOpen]    = useState(false);
  const fieldsFilterRef = useRef<HTMLDivElement>(null);

  // ── Add Project modal ───────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name:     "",
    priority: "Medium" as Priority,
    lead:     "",
    dueDate:  "",
    status:   "To Do",
    team:     "",
    labels:   "",
  });

  // ── Context menu (⋯ per row) ────────────────────────────────────────────────
  const [menuProjectId, setMenuProjectId] = useState<string | null>(null);
  const [menuPos,       setMenuPos]       = useState<{ x: number; y: number } | null>(null);
  const [menuProject,   setMenuProject]   = useState<Project | null>(null);

  // ── Workspace popover ───────────────────────────────────────────────────────
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [workspacePopoverOpen, setWorkspacePopoverOpen] = useState(false);
  const [changeThemeOpen,      setChangeThemeOpen]      = useState(false);
  const [colorModeOpen,        setColorModeOpen]        = useState(false);
  const [submenuPos,           setSubmenuPos]            = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const { theme, setTheme } = useTheme();

  const ACCENT_COLORS = [
    { name: "Amber",   bg: "bg-amber-500",   text: "text-amber-500"   },
    { name: "Blue",    bg: "bg-blue-500",    text: "text-blue-500"    },
    { name: "Pink",    bg: "bg-pink-500",    text: "text-pink-500"    },
    { name: "Rose",    bg: "bg-rose-500",    text: "text-rose-500"    },
    { name: "Emerald", bg: "bg-emerald-500", text: "text-emerald-500" },
    { name: "Black",   bg: "bg-neutral-900 dark:bg-neutral-100", text: "text-neutral-900 dark:text-neutral-100" },
  ];
  const [accentColor, setAccentColor] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("pyramid_accent_color") || "Blue" : "Blue"
  );

  // ── Load projects from backend ────────────────────────────────────────────
  useEffect(() => {
    apiFetchProjects().then(setProjects);
  }, []);

  // ── Close popovers on outside click ─────────────────────────────────────────
  React.useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (fieldsRef.current        && !fieldsRef.current.contains(e.target as Node))        setIsFieldsOpen(false);
      if (filterRef.current        && !filterRef.current.contains(e.target as Node))        setIsFilterOpen(false);
      if (fieldsFilterRef.current  && !fieldsFilterRef.current.contains(e.target as Node))  setIsFieldsFilterOpen(false);
      if (workspaceRef.current     && !workspaceRef.current.contains(e.target as Node)) {
        setWorkspacePopoverOpen(false);
        setChangeThemeOpen(false);
        setColorModeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const positionSubmenu = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setSubmenuPos({ top: rect.top, left: rect.right + 4 });
  };

  const handleToggleField = (key: keyof typeof visibleFields) =>
    setVisibleFields(prev => ({ ...prev, [key]: !prev[key] }));

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    try {
      const newProject = await apiCreateProject({
        name: formData.name,
        priority: formData.priority,
        lead: formData.lead || "Admin",
        dueDate: formData.dueDate || "—",
        status: formData.status,
        team: formData.team || "—",
        labels: formData.labels || "—",
      });
      setProjects(prev => [...prev, newProject]);
      setIsModalOpen(false);
      setFormData({ name: "", priority: "Medium", lead: "", dueDate: "", status: "To Do", team: "", labels: "" });
    } catch (err) {
      console.error("Failed to create project:", err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await apiDeleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
    setMenuProjectId(null);
    setMenuPos(null);
  };

  const handleChangePriority = async (id: string, priority: Priority) => {
    try {
      await apiUpdateProject(id, { priority });
      setProjects(prev => prev.map(p => p.id === id ? { ...p, priority } : p));
    } catch (err) {
      console.error("Failed to update project:", err);
    }
    setActivePriorityId(null);
    setPriorityDropdownPos(null);
  };

  const filteredProjects = projects.filter(p => {
    if (filterPriority !== "ALL" && p.priority !== filterPriority) return false;
    if (filterStatus   !== "ALL" && p.status   !== filterStatus)   return false;
    if (filterLead     !== "ALL" && p.lead      !== filterLead)     return false;
    if (searchQuery.trim() && !p.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
    return true;
  });

  const hasActiveFilters = filterPriority !== "ALL" || filterStatus !== "ALL" || filterLead !== "ALL";

  // ── Grid template ────────────────────────────────────────────────────────────
  const gridCols = [
    "1fr",
    visibleFields.priority ? "140px" : "",
    visibleFields.lead     ? "120px" : "",
    visibleFields.dueDate  ? "120px" : "",
    visibleFields.status   ? "120px" : "",
    visibleFields.team     ? "100px" : "",
    visibleFields.labels   ? "120px" : "",
    "60px",
  ].filter(Boolean).join(" ");

  // ─── Sidebar ─────────────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <>
      <div className="p-4 space-y-6 flex-1 overflow-y-auto overflow-x-hidden">
        {/* User Profile */}
        <div className="space-y-1 relative" ref={workspaceRef}>
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
            <button
              onClick={(e) => { e.stopPropagation(); setWorkspacePopoverOpen(!workspacePopoverOpen); }}
              className="p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer shrink-0"
            >
              <ChevronsUpDown className="w-4 h-4 text-neutral-400" />
            </button>
          </div>

          {/* Workspace Popover */}
          {workspacePopoverOpen && (
            <div className="absolute left-0 top-full mt-1 w-54 bg-white dark:bg-[#1C1C1F] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 pt-4 pb-3 text-center border-b border-neutral-100 dark:border-neutral-800">
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-0.5 shadow-sm mb-2">
                  <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center text-white text-sm font-bold">
                    {(user.name || "D")[0].toUpperCase()}
                  </div>
                </div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">{user.name || "Dexter"}</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">{user.email || "dexter@pyramid.app"}</p>
              </div>
              <div className="py-1.5">
                <div className="relative">
                  <button
                    onMouseEnter={(e) => { positionSubmenu(e); setChangeThemeOpen(true); setColorModeOpen(false); }}
                    onClick={(e)      => { positionSubmenu(e); setChangeThemeOpen(!changeThemeOpen); setColorModeOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5"><Sun className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />Change Theme</span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                </div>
                <div className="relative">
                  <button
                    onMouseEnter={(e) => { positionSubmenu(e); setColorModeOpen(true); setChangeThemeOpen(false); }}
                    onClick={(e)      => { positionSubmenu(e); setColorModeOpen(!colorModeOpen); setChangeThemeOpen(false); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={`w-4 h-4 rounded ${ACCENT_COLORS.find(c => c.name === accentColor)?.bg || "bg-blue-500"} shrink-0`} />
                      Color Mode
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                </div>
                <button
                  onClick={() => { setWorkspacePopoverOpen(false); router.push("/settings"); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer">
                  <Settings className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />Settings
                </button>
              </div>
            </div>
          )}

          {/* Change Theme Submenu */}
          {workspacePopoverOpen && changeThemeOpen && (
            <div
              onMouseLeave={() => setChangeThemeOpen(false)}
              className="fixed w-44 bg-white dark:bg-[#1C1C1F] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-[70] py-1.5 animate-in fade-in zoom-in-95 duration-100"
              style={{ top: submenuPos.top, left: submenuPos.left }}
            >
              <p className="px-3.5 pt-1.5 pb-1 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Theme</p>
              {(["light","dark","system"] as const).map((t) => (
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

          {/* Color Mode Submenu */}
          {workspacePopoverOpen && colorModeOpen && (
            <div
              onMouseLeave={() => setColorModeOpen(false)}
              className="fixed w-48 bg-white dark:bg-[#1C1C1F] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-[70] py-1.5 animate-in fade-in zoom-in-95 duration-100"
              style={{ top: submenuPos.top, left: submenuPos.left }}
            >
              <p className="px-3.5 pt-1.5 pb-1 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">Color Mode</p>
              {ACCENT_COLORS.map((color) => (
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
            {/* Tasks — navigate to / */}
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

            {/* Projects — currently active */}
            <button
              onClick={() => router.push("/projects")}
              className={`w-full font-medium rounded-xl px-3 py-2 flex items-center gap-2.5 text-sm cursor-pointer transition-colors ${
                pathname === "/projects"
                  ? "bg-[#ECECEE] dark:bg-[#222226] text-neutral-900 dark:text-white font-semibold shadow-2xs"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/40"
              }`}
            >
              <Folder className="w-4 h-4" />
              <span>Projects</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
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
          {/* Left */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white truncate">
              Projects
            </h1>
          </div>

          {/* Right toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

            {/* Search */}
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search projects..."
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

            {/* Fields button */}
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
                <div className="absolute right-0 top-9 w-60 sm:w-64 bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 shadow-xl z-40 space-y-1.5 pt-4 animate-in fade-in zoom-in-95 duration-150">
                  {([
                    { key: "priority" as const, label: "Priority",  icon: <BarChart2    className="w-3.5 h-3.5" /> },
                    { key: "lead"     as const, label: "Lead",      icon: <UserCircle   className="w-3.5 h-3.5" /> },
                    { key: "dueDate"  as const, label: "Due Date",  icon: <Calendar     className="w-3.5 h-3.5" /> },
                    { key: "status"   as const, label: "Status",    icon: <Circle       className="w-3.5 h-3.5" /> },
                    { key: "team"     as const, label: "Teams",     icon: <Users        className="w-3.5 h-3.5" /> },
                    { key: "labels"   as const, label: "Labels",    icon: <Tag          className="w-3.5 h-3.5" /> },
                  ]).map(({ key, label, icon }) => (
                    <div key={key} onClick={() => handleToggleField(key)}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/60 cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                        <span className="text-neutral-400 dark:text-neutral-500">{icon}</span>
                        {label}
                      </span>
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
              )}
            </div>

            {/* Filter button */}
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
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Filter Projects</span>
                    {hasActiveFilters && (
                      <button onClick={() => { setFilterPriority("ALL"); setFilterStatus("ALL"); setFilterLead("ALL"); }}
                        className="text-[11px] font-semibold text-red-500 hover:underline">Reset</button>
                    )}
                  </div>

                  {/* Priority filter */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Priority</label>
                    <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-medium outline-none text-neutral-900 dark:text-neutral-100">
                      <option value="ALL">All Priorities</option>
                      <option value="No Priority">No Priority</option>
                      <option value="Urgent">Urgent</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  {/* Status filter */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Status</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-medium outline-none text-neutral-900 dark:text-neutral-100">
                      <option value="ALL">All Statuses</option>
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="On Hold">On Hold</option>
                    </select>
                  </div>

                  {/* Lead filter */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Lead</label>
                    <select value={filterLead} onChange={(e) => setFilterLead(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-medium outline-none text-neutral-900 dark:text-neutral-100">
                      <option value="ALL">All Leads</option>
                      <option value="Dexter">Dexter</option>
                      <option value="Admin">Admin</option>
                      <option value="QA Team">QA Team</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Add Task button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#18181B] hover:bg-black dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-semibold text-xs rounded-lg px-2.5 sm:px-3.5 py-1.5 flex items-center gap-1 sm:gap-1.5 shadow-sm cursor-pointer transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Task</span>
            </button>
          </div>
        </header>

        {/* ── Content area ──────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto bg-[#FAF9FB] dark:bg-[#09090B]">
          <div className="p-3 sm:p-6">

            {/* Table */}
            <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-[#121215]">

              {/* Table header */}
              <div
                className="bg-neutral-50 dark:bg-[#18181B] border-b border-neutral-200 dark:border-neutral-800"
                style={{ display: "grid", gridTemplateColumns: gridCols }}
              >
                <div className="px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Projects</div>
                {visibleFields.priority && <div className="px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Priority</div>}
                {visibleFields.lead     && <div className="px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Lead</div>}
                {visibleFields.dueDate  && <div className="px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Due</div>}
                {visibleFields.status   && <div className="px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Status</div>}
                {visibleFields.team     && <div className="px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Team</div>}
                {visibleFields.labels   && <div className="px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Labels</div>}
                <div className="px-4 py-2.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">Actions</div>
              </div>

              {/* Rows */}
              {filteredProjects.length === 0 ? (
                <div className="px-4 py-10 text-sm text-neutral-400 dark:text-neutral-600 text-center">
                  No projects match your filters.
                </div>
              ) : filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="border-b border-neutral-100 dark:border-neutral-800/60 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group"
                  style={{ display: "grid", gridTemplateColumns: gridCols }}
                >
                  {/* Name — clickable → project detail */}
                  <div className="px-4 py-3 flex items-center min-w-0">
                    <span
                      onClick={() => router.push(`/projects/${project.id}`)}
                      className="text-sm text-neutral-900 dark:text-neutral-100 font-medium truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {project.name}
                    </span>
                  </div>

                  {/* Priority — clickable, opens dropdown */}
                  {visibleFields.priority && (
                    <div className="px-4 py-3 flex items-center">
                      <button
                        onClick={(e) => {
                          if (activePriorityId === project.id) {
                            setActivePriorityId(null);
                            setPriorityDropdownPos(null);
                          } else {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setPriorityDropdownPos({ x: rect.left, y: rect.bottom + 4 });
                            setActivePriorityId(project.id);
                          }
                        }}
                        className="flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg px-1.5 py-0.5 transition-colors cursor-pointer"
                      >
                        <PriorityIcon priority={project.priority as Priority} />
                        <span className={`text-sm font-medium ${PRIORITY_COLORS[project.priority as Priority] ?? PRIORITY_COLORS["No Priority"]}`}>
                          {project.priority}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Lead */}
                  {visibleFields.lead && (
                    <div className="px-4 py-3 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-[2px] shrink-0">
                        <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-[9px] font-bold text-white">
                          {(project.lead || "A")[0].toUpperCase()}
                        </div>
                      </div>
                      <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{project.lead}</span>
                    </div>
                  )}

                  {/* Due Date */}
                  {visibleFields.dueDate && (
                    <div className="px-4 py-3 flex items-center">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">{project.dueDate}</span>
                    </div>
                  )}

                  {/* Status */}
                  {visibleFields.status && (
                    <div className="px-4 py-3 flex items-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                        project.status === "In Progress" ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" :
                        project.status === "Completed"   ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" :
                        project.status === "On Hold"     ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" :
                        "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  )}

                  {/* Team */}
                  {visibleFields.team && (
                    <div className="px-4 py-3 flex items-center">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">{project.team}</span>
                    </div>
                  )}

                  {/* Labels */}
                  {visibleFields.labels && (
                    <div className="px-4 py-3 flex items-center">
                      <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-0.5">
                        {project.labels}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="px-4 py-3 flex items-center">
                    <button
                      onClick={(e) => {
                        if (menuProjectId === project.id) {
                          setMenuProjectId(null);
                          setMenuPos(null);
                        } else {
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          setMenuPos({ x: rect.right - 176, y: rect.bottom + 4 });
                          setMenuProjectId(project.id);
                          setMenuProject(project);
                        }
                      }}
                      className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add Projects row */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer border-t border-neutral-100 dark:border-neutral-800/60"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Projects</span>
              </button>
            </div>

          </div>
        </div>
      </main>

      {/* ── Add Project Modal ─────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-xl animate-in fade-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-50">Add Project</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Project Name</label>
                <input
                  type="text" required placeholder="e.g. Design Homepage"
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Priority</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-medium outline-none text-neutral-900 dark:text-neutral-100">
                    <option value="No Priority">No Priority</option>
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Lead</label>
                  <input type="text" placeholder="Dexter, Admin..." value={formData.lead} onChange={(e) => setFormData({ ...formData, lead: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-medium outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Due Date</label>
                  <input type="text" placeholder="30 Aug, 05 Sep..." value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-medium outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-medium outline-none text-neutral-900 dark:text-neutral-100">
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  className="px-5 py-2 bg-[#18181B] hover:bg-black dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98]">
                  Add Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Priority dropdown (portal) ──────────────────────────────────────── */}
      {activePriorityId && priorityDropdownPos && createPortal(
        <>
          <div className="fixed inset-0 z-[99]" onClick={() => { setActivePriorityId(null); setPriorityDropdownPos(null); }} />
          <div
            className="fixed w-44 bg-white dark:bg-[#222226] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl p-1.5 z-[100]"
            style={{ left: priorityDropdownPos.x, top: priorityDropdownPos.y }}
          >
            <p className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Priority</p>
            {(["No Priority","Urgent","High","Medium","Low"] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => handleChangePriority(activePriorityId, p)}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition-colors"
              >
                <span className="flex items-center gap-2">
                  <PriorityIcon priority={p} />
                  <span className={PRIORITY_COLORS[p]}>{p}</span>
                </span>
                {projects.find(pr => pr.id === activePriorityId)?.priority === p && (
                  <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
                )}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}

      {/* ── Context menu (portal) ───────────────────────────────────────────── */}
      {menuProjectId && menuPos && menuProject && createPortal(
        <>
          <div className="fixed inset-0 z-[99]" onClick={() => { setMenuProjectId(null); setMenuPos(null); }} />
          <div
            className="fixed w-44 bg-white dark:bg-[#222226] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl p-1.5 z-[100] space-y-1 text-xs"
            style={{ left: menuPos.x, top: menuPos.y }}
          >
            <button
              onClick={() => { setMenuProjectId(null); setMenuPos(null); }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium transition-colors"
            >
              Edit Project
            </button>
            <button
              onClick={() => handleDeleteProject(menuProject.id)}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-medium transition-colors"
            >
              Delete Project
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
