"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Task,
  apiGetTaskById,
  apiUpdateTask,
  getStoredUser,
} from "@/lib/api";
import { ThemeToggle } from "./theme-toggle";
import {
  PanelLeft,
  ChevronDown,
  Grid2X2,
  Folder,
  ChevronsUpDown,
  LogOut,
  ArrowLeft,
  Tag,
  Calendar,
  Plus,
  MoreHorizontal,
  Check,
  ChevronRight,
  Circle,
  Send,
  Paperclip,
  Settings,
  Share2,
  Lock,
  Eye,
  X,
} from "lucide-react";
import { clearStoredToken } from "@/lib/api";

interface TaskDetailPageProps {
  taskId: string;
}

const STATUSES = ["To Do", "Doing", "Completed", "On Hold"];
const PRIORITIES = ["No Priority", "URGENT", "HIGH", "MEDIUM", "LOW"];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  "No Priority": { label: "No Priority", color: "text-neutral-400", dot: "bg-neutral-300 dark:bg-neutral-600" },
  LOW:           { label: "Low",         color: "text-neutral-400 dark:text-neutral-500", dot: "bg-neutral-300" },
  MEDIUM:        { label: "Medium",      color: "text-yellow-500",  dot: "bg-yellow-400" },
  HIGH:          { label: "High",        color: "text-orange-500",  dot: "bg-orange-500" },
  URGENT:        { label: "Urgent",      color: "text-red-500",     dot: "bg-red-500" },
};

const STATUS_COLORS: Record<string, string> = {
  "To Do":     "bg-blue-500",
  "Doing":     "bg-orange-400",
  "Completed": "bg-green-500",
  "On Hold":   "bg-neutral-400",
};

// Fake subtask type (frontend-only, not persisted)
interface Subtask {
  id: string;
  title: string;
  priority: string;
  assignee: string;
  dueDate: string;
}

// Fake comment type (frontend-only)
interface Comment {
  id: string;
  author: string;
  text: string;
  time: string;
}

export function TaskDetailPage({ taskId }: TaskDetailPageProps) {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const [mounted, setMounted] = useState(false);

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Inline editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");

  // Details panel dropdowns
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Subtasks (frontend-only demo)
  const [subtasks, setSubtasks] = useState<Subtask[]>([
    { id: "s1", title: "Subtask 1", priority: "HIGH",   assignee: "A",  dueDate: "12 Sep 2026" },
    { id: "s2", title: "Subtask 2", priority: "LOW",    assignee: "CN", dueDate: "15 Sep 2026" },
    { id: "s3", title: "Subtask 3", priority: "MEDIUM", assignee: "+",  dueDate: "18 Sep 2026" },
  ]);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Comments (frontend-only demo)
  const [comments, setComments] = useState<Comment[]>([
    { id: "c1", author: user?.name || "You", text: "posted an update", time: "Aug 2026" },
  ]);
  const [newComment, setNewComment] = useState("");
  const [replyText, setReplyText] = useState("");

  // Labels editing
  const [labels, setLabels] = useState<string[]>([]);
  const [addingLabel, setAddingLabel] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  // Updates log (activity)
  const [updates, setUpdates] = useState<{ text: string; time: string }[]>([
    { text: "posted an update", time: "Aug 2026" },
  ]);

  const statusRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // ── Load task ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);
    setUser(getStoredUser());
    async function load() {
      setLoading(true);
      const data = await apiGetTaskById(taskId);
      if (data) {
        setTask(data);
        setTitleDraft(data.title);
        setDescDraft(data.description || "");
        if (data.tags) {
          setLabels(data.tags.split(",").map(t => t.trim()).filter(Boolean));
        }
      }
      setLoading(false);
    }
    load();
  }, [taskId]);

  // ── Close dropdowns on outside click ──────────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) setPriorityOpen(false);
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) setDatePickerOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const saveField = async (field: Partial<Task>) => {
    if (!task) return;
    const updated = { ...task, ...field };
    setTask(updated);
    await apiUpdateTask(task.id, field);
    // Log update
    const key = Object.keys(field)[0];
    const val = Object.values(field)[0] as string;
    setUpdates(prev => [{ text: `changed ${key} to ${val}`, time: "just now" }, ...prev]);
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    return { daysInMonth, startDayOfWeek, year, month };
  };

  const formatDate = (date: Date) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const handleDateSelect = (day: number) => {
    const selected = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    const formatted = formatDate(selected);
    
    if (!startDate) {
      setStartDate(formatted);
    } else if (!endDate) {
      setEndDate(formatted);
      // Save to task
      saveField({ dueDate: `${startDate} → ${formatted}` });
      setDatePickerOpen(false);
    } else {
      // Reset
      setStartDate(formatted);
      setEndDate(null);
    }
  };

  const clearDates = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const handleTitleSave = async () => {
    if (!titleDraft.trim() || titleDraft === task?.title) { setEditingTitle(false); return; }
    await saveField({ title: titleDraft.trim() });
    setEditingTitle(false);
  };

  const handleDescSave = async () => {
    if (descDraft === task?.description) { setEditingDesc(false); return; }
    await saveField({ description: descDraft });
    setEditingDesc(false);
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks(prev => [...prev, {
      id: `s${Date.now()}`,
      title: newSubtaskTitle.trim(),
      priority: "MEDIUM",
      assignee: user?.name?.[0] || "A",
      dueDate: "—",
    }]);
    setNewSubtaskTitle("");
    setAddingSubtask(false);
  };

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    setComments(prev => [...prev, {
      id: `c${Date.now()}`,
      author: user?.name || "You",
      text: newComment.trim(),
      time: "just now",
    }]);
    setUpdates(prev => [{ text: `posted a comment: "${newComment.trim().slice(0, 40)}"`, time: "just now" }, ...prev]);
    setNewComment("");
  };

  const handleAddLabel = () => {
    if (!newLabel.trim()) return;
    const updated = [...labels, newLabel.trim()];
    setLabels(updated);
    saveField({ tags: updated.join(",") });
    setNewLabel("");
    setAddingLabel(false);
  };

  const handleRemoveLabel = (label: string) => {
    const updated = labels.filter(l => l !== label);
    setLabels(updated);
    saveField({ tags: updated.join(",") });
  };

  const handleLogout = () => {
    clearStoredToken();
    router.push("/");
  };

  // ── Priority bar icon ──────────────────────────────────────────────────────
  const PriorityIcon = ({ priority, className = "" }: { priority: string; className?: string }) => {
    const bars = { LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 4 }[priority] ?? 0;
    const color = PRIORITY_CONFIG[priority]?.color ?? "text-neutral-400";
    if (bars === 0) return <span className={`w-3 h-3 rounded-full border-2 border-neutral-300 dark:border-neutral-600 inline-block ${className}`} />;
    return (
      <svg width="12" height="12" viewBox="0 0 14 14" className={`${color} ${className} shrink-0`} fill="currentColor">
        <rect x="0" y="8"  width="3" height="6" rx="0.5" opacity={bars >= 1 ? 1 : 0.2} />
        <rect x="4" y="5"  width="3" height="9" rx="0.5" opacity={bars >= 2 ? 1 : 0.2} />
        <rect x="8" y="2"  width="3" height="12" rx="0.5" opacity={bars >= 3 ? 1 : 0.2} />
        <rect x="12" y="0" width="2" height="14" rx="0.5" opacity={bars >= 4 ? 1 : 0.2} />
      </svg>
    );
  };

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <>
      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        {/* User Profile */}
        <div className="space-y-1">
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-0.5 shrink-0 shadow-xs">
                <div className="w-full h-full rounded-full bg-neutral-900 dark:bg-neutral-900 flex items-center justify-center text-white text-xs font-bold">
                  {(user?.name || "D")[0].toUpperCase()}
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-neutral-900 dark:text-white truncate">{user?.name || "Dexter"}</span>
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
            <button
              onClick={() => router.push("/")}
              className="w-full text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/40 font-medium rounded-xl px-3 py-2 flex items-center gap-2.5 text-sm cursor-pointer transition-colors"
            >
              <Grid2X2 className="w-4 h-4 text-neutral-400" />
              <span>Tasks</span>
            </button>
            <button className="w-full text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/40 font-medium rounded-xl px-3 py-2 flex items-center gap-2.5 text-sm cursor-pointer transition-colors">
              <Folder className="w-4 h-4 text-neutral-400" />
              <span>Projects</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between shrink-0">
        <ThemeToggle />
        <button
          onClick={handleLogout}
          title="Log Out"
          className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </>
  );

  // ── Loading / not found ────────────────────────────────────────────────────
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#09090B] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-neutral-100 animate-spin" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#09090B] flex flex-col items-center justify-center gap-4">
        <p className="text-neutral-500 text-sm">Task not found.</p>
        <button onClick={() => router.push("/")} className="text-sm font-semibold text-neutral-900 dark:text-white underline">
          Back to Tasks
        </button>
      </div>
    );
  }

  const currentPriority = task.priority || "MEDIUM";
  const priorityCfg = PRIORITY_CONFIG[currentPriority] ?? PRIORITY_CONFIG.MEDIUM;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-white dark:bg-[#09090B] text-neutral-900 dark:text-neutral-100 font-sans overflow-hidden">

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex flex-col
          w-60 bg-white dark:bg-[#121215]
          border-r border-neutral-200/80 dark:border-neutral-800
          transition-all duration-300 ease-in-out
          lg:static lg:z-auto
          ${sidebarOpen ? "translate-x-0 lg:w-60" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:border-r-0"}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="h-14 border-b border-neutral-200/80 dark:border-neutral-800 px-4 flex items-center justify-between shrink-0 bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-xs z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Tasks</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-sm font-semibold text-neutral-900 dark:text-white truncate max-w-[200px]">
              {task.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
              <Lock className="w-3.5 h-3.5" />
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
              <Eye className="w-3.5 h-3.5" />
              <span>1</span>
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
              <PanelLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </header>

        {/* Body: main content + right details panel */}
        <div className="flex-1 flex overflow-hidden">

          {/* ── Left: task content ───────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 min-w-0">

            {/* Title */}
            <div>
              {editingTitle ? (
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={e => { if (e.key === "Enter") handleTitleSave(); if (e.key === "Escape") setEditingTitle(false); }}
                  className="text-2xl font-bold w-full bg-transparent outline-none border-b-2 border-neutral-900 dark:border-white text-neutral-900 dark:text-white"
                />
              ) : (
                <h1
                  onClick={() => setEditingTitle(true)}
                  className="text-2xl font-bold text-neutral-900 dark:text-white cursor-text hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-lg px-1 -mx-1 transition-colors"
                >
                  {task.title}
                </h1>
              )}

              {/* Description */}
              <div className="mt-2">
                {editingDesc ? (
                  <textarea
                    autoFocus
                    value={descDraft}
                    onChange={e => setDescDraft(e.target.value)}
                    onBlur={handleDescSave}
                    onKeyDown={e => { if (e.key === "Escape") setEditingDesc(false); }}
                    rows={3}
                    placeholder="Add a description..."
                    className="w-full text-sm text-neutral-600 dark:text-neutral-400 bg-transparent outline-none border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 resize-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  />
                ) : (
                  <p
                    onClick={() => setEditingDesc(true)}
                    className="text-sm text-neutral-500 dark:text-neutral-400 cursor-text hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded-lg px-1 -mx-1 py-1 transition-colors min-h-[24px]"
                  >
                    {task.description || <span className="italic text-neutral-400">Add a description…</span>}
                  </p>
                )}
              </div>
            </div>

            {/* Properties row */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-neutral-500 font-medium w-24 shrink-0">Properties</span>
              <div className="flex items-center gap-3 flex-wrap">
                {/* Assignee */}
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-[2px] shrink-0">
                    <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-[8px] font-bold text-white">
                      {(task.assigneeName || "A")[0].toUpperCase()}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{task.assigneeName || "Admin"}</span>
                </div>
                {/* Due date */}
                <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 text-xs font-semibold px-2 py-0.5 rounded-md">
                  <Calendar className="w-3 h-3" />
                  <span>{task.dueDate || "—"}</span>
                </div>
              </div>
            </div>

            {/* Labels row */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-neutral-500 font-medium w-24 shrink-0">Labels</span>
              <div className="flex items-center gap-2 flex-wrap">
                {labels.map(label => (
                  <span
                    key={label}
                    className="group flex items-center gap-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-0.5 hover:border-red-300 transition-colors"
                  >
                    <Tag className="w-2.5 h-2.5 shrink-0" />
                    {label}
                    <button onClick={() => handleRemoveLabel(label)} className="ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-2.5 h-2.5 text-red-400" />
                    </button>
                  </span>
                ))}
                {addingLabel ? (
                  <input
                    autoFocus
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    onBlur={handleAddLabel}
                    onKeyDown={e => { if (e.key === "Enter") handleAddLabel(); if (e.key === "Escape") setAddingLabel(false); }}
                    placeholder="Label name"
                    className="text-xs border border-neutral-300 dark:border-neutral-600 rounded-md px-2 py-0.5 bg-transparent outline-none w-24 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  />
                ) : (
                  <button
                    onClick={() => setAddingLabel(true)}
                    className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-md px-2 py-0.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    Add label
                  </button>
                )}
              </div>
            </div>

            {/* Resources row */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-neutral-500 font-medium w-24 shrink-0">Resources</span>
              <button className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 flex items-center gap-1 transition-colors cursor-pointer">
                <Paperclip className="w-3 h-3" />
                Add document or link…
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

            {/* Subtasks section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <button className="flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer">
                  <ChevronDown className="w-4 h-4" />
                  Subtasks
                </button>
              </div>

              {/* Subtasks table */}
              <div className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-[#121215]">
                {/* Header */}
                <div className="grid grid-cols-[1fr_120px_100px_140px_60px] bg-neutral-50 dark:bg-[#18181B] border-b border-neutral-200 dark:border-neutral-800">
                  {["Task","Priority","Members","Due Date","Actions"].map(h => (
                    <div key={h} className="px-3 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">{h}</div>
                  ))}
                </div>

                {/* Rows */}
                {subtasks.map(st => (
                  <div
                    key={st.id}
                    className="grid grid-cols-[1fr_120px_100px_140px_60px] border-b border-neutral-100 dark:border-neutral-800/60 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-800/20 transition-colors"
                  >
                    <div className="px-3 py-2.5 flex items-center gap-2 min-w-0">
                      <Circle className="w-3.5 h-3.5 text-neutral-300 dark:text-neutral-600 shrink-0" />
                      <span className="text-sm text-neutral-800 dark:text-neutral-200 truncate">{st.title}</span>
                    </div>
                    <div className="px-3 py-2.5 flex items-center gap-1.5">
                      <PriorityIcon priority={st.priority} />
                      <span className={`text-xs font-medium ${PRIORITY_CONFIG[st.priority]?.color ?? "text-neutral-400"}`}>
                        {PRIORITY_CONFIG[st.priority]?.label ?? st.priority}
                      </span>
                    </div>
                    <div className="px-3 py-2.5 flex items-center">
                      {st.assignee === "+" ? (
                        <button className="w-6 h-6 rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-neutral-400 hover:border-neutral-500 transition-colors cursor-pointer">
                          <Plus className="w-3 h-3" />
                        </button>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-[1.5px] shrink-0">
                          <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-[8px] font-bold text-white">
                            {st.assignee}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="px-3 py-2.5 flex items-center">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{st.dueDate}</span>
                    </div>
                    <div className="px-3 py-2.5 flex items-center">
                      <button
                        onClick={() => setSubtasks(prev => prev.filter(s => s.id !== st.id))}
                        className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add subtask */}
                {addingSubtask ? (
                  <div className="px-3 py-2.5 flex items-center gap-2 border-t border-neutral-100 dark:border-neutral-800/60">
                    <Circle className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                    <input
                      autoFocus
                      value={newSubtaskTitle}
                      onChange={e => setNewSubtaskTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") handleAddSubtask(); if (e.key === "Escape") setAddingSubtask(false); }}
                      onBlur={handleAddSubtask}
                      placeholder="Subtask title…"
                      className="flex-1 text-sm bg-transparent outline-none text-neutral-800 dark:text-neutral-200 placeholder-neutral-400"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingSubtask(true)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer border-t border-neutral-100 dark:border-neutral-800/60"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Subtasks
                  </button>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-neutral-200 dark:bg-neutral-800" />

            {/* Comments section */}
            <div>
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4">Comments</p>

              {/* Existing comments */}
              {comments.map(c => (
                <div key={c.id} className="mb-4">
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 bg-white dark:bg-[#121215]">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-[1.5px]">
                          <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-[8px] font-bold text-white">
                            {c.author[0].toUpperCase()}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{c.author}</span>
                        <span className="text-xs text-neutral-400">{c.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-1 rounded text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                          <Settings className="w-3 h-3" />
                        </button>
                        <button className="p-1 rounded text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                          <MoreHorizontal className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{c.text}</p>
                  </div>

                  {/* Reply input */}
                  <div className="mt-2 ml-4 flex items-center gap-2 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 bg-neutral-50 dark:bg-[#141417]">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-[1.5px] shrink-0">
                      <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-[7px] font-bold text-white">
                        {(user?.name || "Y")[0].toUpperCase()}
                      </div>
                    </div>
                    <input
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Leave a reply…"
                      className="flex-1 text-xs bg-transparent outline-none text-neutral-600 dark:text-neutral-400 placeholder-neutral-400"
                    />
                    <button className="text-neutral-400 hover:text-neutral-600 cursor-pointer"><Paperclip className="w-3.5 h-3.5" /></button>
                    <button
                      onClick={() => { if (replyText.trim()) { setComments(prev => [...prev, { id: `c${Date.now()}`, author: user?.name || "You", text: replyText.trim(), time: "just now" }]); setReplyText(""); } }}
                      className="text-neutral-400 hover:text-blue-500 cursor-pointer transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* New comment */}
              <div className="flex items-center gap-2 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2.5 bg-white dark:bg-[#121215]">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-[1.5px] shrink-0">
                  <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-[8px] font-bold text-white">
                    {(user?.name || "Y")[0].toUpperCase()}
                  </div>
                </div>
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handlePostComment(); }}
                  placeholder="Add a comment…"
                  className="flex-1 text-sm bg-transparent outline-none text-neutral-600 dark:text-neutral-400 placeholder-neutral-400"
                />
                <button className="text-neutral-400 hover:text-neutral-600 cursor-pointer"><Paperclip className="w-3.5 h-3.5" /></button>
                <button onClick={handlePostComment} className="text-neutral-400 hover:text-blue-500 cursor-pointer transition-colors">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* ── Right: Details panel ─────────────────────────────────────────── */}
          <aside className="hidden lg:flex flex-col w-72 shrink-0 border-l border-neutral-200/80 dark:border-neutral-800 overflow-y-auto bg-white dark:bg-[#09090B]">

            {/* Details section */}
            <div className="p-4 border-b border-neutral-200/80 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-3">
                <button className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer">
                  <ChevronDown className="w-4 h-4" />
                  Details
                </button>
                <div className="flex items-center gap-1">
                  <button className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">

                {/* Status */}
                <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <span className="text-xs text-neutral-500 w-20 shrink-0">Status</span>
                  <div className="relative" ref={statusRef}>
                    <button
                      onClick={() => { setStatusOpen(!statusOpen); setPriorityOpen(false); }}
                      className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[task.status] ?? "bg-neutral-400"}`} />
                      <span className="text-neutral-700 dark:text-neutral-300">{task.status}</span>
                    </button>
                    {statusOpen && (
                      <div className="absolute left-0 top-6 w-44 bg-white dark:bg-[#222226] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-1.5 z-50 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                        {STATUSES.map(s => (
                          <button
                            key={s}
                            onClick={() => { saveField({ status: s }); setStatusOpen(false); }}
                            className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_COLORS[s] ?? "bg-neutral-400"}`} />
                              {s}
                            </div>
                            {task.status === s && <Check className="w-3 h-3 text-neutral-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <span className="text-xs text-neutral-500 w-20 shrink-0">Priority</span>
                  <div className="relative" ref={priorityRef}>
                    <button
                      onClick={() => { setPriorityOpen(!priorityOpen); setStatusOpen(false); }}
                      className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <PriorityIcon priority={currentPriority} />
                      <span className={priorityCfg.color}>{priorityCfg.label}</span>
                      <ChevronDown className="w-3 h-3 text-neutral-400" />
                    </button>
                    {priorityOpen && (
                      <div className="absolute left-0 top-6 w-44 bg-white dark:bg-[#222226] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-1.5 z-50 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                        <p className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Priority</p>
                        {PRIORITIES.map(p => {
                          const cfg = PRIORITY_CONFIG[p];
                          return (
                            <button
                              key={p}
                              onClick={() => { saveField({ priority: p === "No Priority" ? "" : p }); setPriorityOpen(false); }}
                              className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <PriorityIcon priority={p} />
                                <span className={cfg?.color ?? "text-neutral-400"}>{cfg?.label ?? p}</span>
                              </div>
                              {currentPriority === p && <Check className="w-3 h-3 text-neutral-500" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Members */}
                <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <span className="text-xs text-neutral-500 w-20 shrink-0">Members</span>
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-[1.5px]">
                    <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-[7px] font-bold text-white">
                      {(task.assigneeName || "A")[0].toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Due Date */}
                <div className="py-1.5">
                  <div
                    className="flex items-center gap-3 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                    onClick={() => { setDatePickerOpen(!datePickerOpen); setStatusOpen(false); setPriorityOpen(false); }}
                  >
                    <span className="text-xs text-neutral-500 w-20 shrink-0">Dates</span>
                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 flex-1">
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                        <Calendar className="w-3 h-3 text-neutral-400" />
                        <span>{startDate || "Jan 10"}</span>
                      </div>
                      <span className="text-neutral-400">→</span>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                        <Calendar className="w-3 h-3 text-neutral-400" />
                        <span>{endDate || "End"}</span>
                      </div>
                    </div>
                  </div>

                  {datePickerOpen && (
                    <div className="mt-2 px-2" ref={datePickerRef}>
                      {/* Label/Team rows (matching Figma) */}
                      <div className="flex items-center gap-2 mb-3 text-xs">
                        <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer">
                          <span className="text-[10px]">Lab</span>
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                        <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer">
                          <span className="text-[10px]">Tea</span>
                        </button>
                        <button className="flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer">
                          <span className="text-[10px]">Rep</span>
                        </button>
                        <button className="w-5 h-5 flex items-center justify-center rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer">
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Calendar */}
                      <div className="border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 bg-white dark:bg-[#121215]">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1)); }}
                            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <span className="text-sm font-bold text-neutral-900 dark:text-white">
                            {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1)); }}
                            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4 text-neutral-600 dark:text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>

                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
                            <div key={day} className="text-center text-[10px] font-semibold text-neutral-400 py-1">
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {(() => {
                            const { daysInMonth, startDayOfWeek, year, month } = getDaysInMonth(selectedMonth);
                            const days = [];
                            
                            // Empty cells for days before month starts
                            for (let i = 0; i < startDayOfWeek; i++) {
                              const prevMonth = new Date(year, month, 0);
                              const prevMonthDays = prevMonth.getDate();
                              const day = prevMonthDays - startDayOfWeek + i + 1;
                              days.push(
                                <button
                                  key={`prev-${i}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="aspect-square flex items-center justify-center text-xs text-neutral-300 dark:text-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
                                >
                                  {day}
                                </button>
                              );
                            }

                            // Days of current month
                            const today = new Date();
                            for (let day = 1; day <= daysInMonth; day++) {
                              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                              days.push(
                                <button
                                  key={day}
                                  onClick={(e) => { e.stopPropagation(); handleDateSelect(day); }}
                                  className={`aspect-square flex items-center justify-center text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                                    isToday
                                      ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                                      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                  }`}
                                >
                                  {day}
                                </button>
                              );
                            }

                            // Fill remaining cells
                            const totalCells = days.length;
                            const remainingCells = 42 - totalCells; // 6 rows × 7 days
                            for (let i = 1; i <= remainingCells && i <= 14; i++) {
                              days.push(
                                <button
                                  key={`next-${i}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="aspect-square flex items-center justify-center text-xs text-neutral-300 dark:text-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
                                >
                                  {i}
                                </button>
                              );
                            }

                            return days;
                          })()}
                        </div>

                        {/* Footer - Clear button */}
                        {(startDate || endDate) && (
                          <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                            <span className="text-xs text-neutral-500">
                              {startDate && !endDate ? "Select end date" : endDate ? `${startDate} → ${endDate}` : startDate}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); clearDates(); }}
                              className="text-xs text-red-500 hover:text-red-600 font-medium cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Labels */}
                <div className="flex items-start gap-3 py-1.5 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <span className="text-xs text-neutral-500 w-20 shrink-0 mt-0.5">Labels</span>
                  <div className="flex flex-wrap gap-1">
                    {labels.length > 0
                      ? labels.map(l => (
                          <span key={l} className="text-[10px] font-medium border border-neutral-200 dark:border-neutral-700 rounded-md px-1.5 py-0.5 text-neutral-600 dark:text-neutral-400">{l}</span>
                        ))
                      : <span className="text-xs text-neutral-400">None</span>
                    }
                  </div>
                </div>

                {/* Teams */}
                <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <span className="text-xs text-neutral-500 w-20 shrink-0">Teams</span>
                  <span className="text-xs text-neutral-400">—</span>
                </div>

                {/* Reporter */}
                <div className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <span className="text-xs text-neutral-500 w-20 shrink-0">Reporter</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-[1.5px]">
                      <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-[7px] font-bold text-white">
                        {(user?.name || "Y")[0].toUpperCase()}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{user?.name || "You"}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Updates / Activity */}
            <div className="p-4">
              <button className="flex items-center gap-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3 cursor-pointer">
                <ChevronDown className="w-4 h-4" />
                Updates
              </button>
              <div className="space-y-3">
                {updates.map((u, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-[1.5px] shrink-0 mt-0.5">
                      <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center text-[7px] font-bold text-white">
                        {(user?.name || "Y")[0].toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">You</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[160px]">{u.text} · {u.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </aside>
        </div>
      </main>
    </div>
  );
}
