"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { User, getStoredUser, setStoredUser } from "@/lib/api";
import {
  ArrowLeft,
  Search,
  User as UserIcon,
  Sun,
  Square,
  Check,
  Pencil,
  Moon,
  Monitor,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsTab = "Profile" | "Theme" | "Color";

// ─── Accent color palette ────────────────────────────────────────────────────

const ACCENT_COLORS = [
  { name: "Blue",    hex: "#3B82F6", bg: "bg-blue-500"    },
  { name: "Amber",   hex: "#F59E0B", bg: "bg-amber-500"   },
  { name: "Pink",    hex: "#EC4899", bg: "bg-pink-500"    },
  { name: "Rose",    hex: "#F43F5E", bg: "bg-rose-500"    },
  { name: "Emerald", hex: "#10B981", bg: "bg-emerald-500" },
  { name: "Violet",  hex: "#8B5CF6", bg: "bg-violet-500"  },
  { name: "Orange",  hex: "#F97316", bg: "bg-orange-500"  },
  { name: "Cyan",    hex: "#06B6D4", bg: "bg-cyan-500"    },
  { name: "Black",   hex: "#18181B", bg: "bg-neutral-900 dark:bg-neutral-100" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

interface SettingsPageProps {
  user: User;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SettingsPage({ user }: SettingsPageProps) {
  const router     = useRouter();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab]     = useState<SettingsTab>("Profile");
  const [searchQuery, setSearchQuery] = useState("");

  // Profile form state
  const [fullName,  setFullName]  = useState(user.name  || "Dexter");
  const [email,     setEmail]     = useState(user.email || "dexter@gmail.com");
  const [title,     setTitle]     = useState("Designer");
  const [username,  setUsername]  = useState("Dexuser");
  const [editEmail, setEditEmail] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);

  // Color state
  const [accentColor, setAccentColor] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("pyramid_accent_color") || "Blue" : "Blue"
  );

  // Leave workspace confirmation
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Save profile
  const handleSaveProfile = () => {
    const updated: User = { ...user, name: fullName, email };
    setStoredUser(updated);
    setSavedProfile(true);
    setTimeout(() => setSavedProfile(false), 2000);
  };

  // Filter nav items by search
  const NAV_ITEMS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "Profile", label: "Profile", icon: <UserIcon className="w-4 h-4" /> },
    { id: "Theme",   label: "Theme",   icon: <Sun      className="w-4 h-4" /> },
    { id: "Color",   label: "Color",   icon: <Square   className="w-4 h-4" /> },
  ];

  const filteredNav = NAV_ITEMS.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#F5F5F7] dark:bg-[#09090B] text-neutral-900 dark:text-neutral-100 font-sans overflow-hidden">

      {/* ── Settings Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-48 shrink-0 flex flex-col bg-[#F5F5F7] dark:bg-[#09090B] border-r border-neutral-200/60 dark:border-neutral-800 h-full">

        {/* Back to app */}
        <div className="px-4 pt-5 pb-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to app</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
            />
          </div>
        </div>

        {/* Nav items */}
        <nav className="px-2 flex-1 space-y-0.5">
          {filteredNav.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeTab === item.id
                  ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-white/60 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <span className={activeTab === item.id ? "text-neutral-700 dark:text-neutral-200" : "text-neutral-400 dark:text-neutral-500"}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
          {filteredNav.length === 0 && (
            <p className="px-3 py-2 text-xs text-neutral-400">No results</p>
          )}
        </nav>
      </aside>

      {/* ── Content area ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto bg-[#F5F5F7] dark:bg-[#0D0D0F]">
        <div className="max-w-2xl mx-auto px-6 py-10">

          {/* ── Profile tab ──────────────────────────────────────────────── */}
          {activeTab === "Profile" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Profile</h2>

              {/* Profile card */}
              <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">

                {/* Profile picture row */}
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Profile picture</span>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-amber-400 p-0.5 shadow-sm cursor-pointer">
                    <div className="w-full h-full rounded-full bg-neutral-900 flex items-center justify-center text-white text-sm font-bold">
                      {fullName[0]?.toUpperCase() || "D"}
                    </div>
                  </div>
                </div>

                {/* Email row */}
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</span>
                  <div className="flex items-center gap-2">
                    {editEmail ? (
                      <input
                        autoFocus
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onBlur={() => setEditEmail(false)}
                        onKeyDown={e => e.key === "Enter" && setEditEmail(false)}
                        className="text-sm text-right bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg px-2.5 py-1 outline-none focus:ring-1 focus:ring-neutral-400 text-neutral-900 dark:text-neutral-100 w-52"
                      />
                    ) : (
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">{email}</span>
                    )}
                    <button
                      onClick={() => setEditEmail(true)}
                      className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Full name row */}
                <div className="flex items-center justify-between px-6 py-4">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Full name</span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="text-sm text-right bg-neutral-100 dark:bg-neutral-800 border border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-neutral-300 dark:focus:border-neutral-700 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-neutral-400 text-neutral-700 dark:text-neutral-300 w-44 transition-colors"
                  />
                </div>

                {/* Title row */}
                <div className="flex items-start justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Title</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">Your job title or role</p>
                  </div>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="text-sm text-right bg-neutral-100 dark:bg-neutral-800 border border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-neutral-300 dark:focus:border-neutral-700 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-neutral-400 text-neutral-700 dark:text-neutral-300 w-44 transition-colors"
                  />
                </div>

                {/* Username row */}
                <div className="flex items-start justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Username</p>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">One word, like a nickname or first name</p>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="text-sm text-right bg-neutral-100 dark:bg-neutral-800 border border-transparent hover:border-neutral-300 dark:hover:border-neutral-700 focus:border-neutral-300 dark:focus:border-neutral-700 rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-neutral-400 text-neutral-700 dark:text-neutral-300 w-44 transition-colors"
                  />
                </div>
              </div>

              {/* Save button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  className="flex items-center gap-2 px-5 py-2 bg-[#18181B] hover:bg-black dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black font-semibold text-sm rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  {savedProfile ? <><Check className="w-4 h-4" />Saved!</> : "Save changes"}
                </button>
              </div>

              {/* Workspace access card */}
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Workspace access</h3>
                <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl px-6 py-4 flex items-center justify-between">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Remove yourself from the workspace</span>
                  <button
                    onClick={() => setShowLeaveConfirm(true)}
                    className="px-4 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
                  >
                    Leave Workspace
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Theme tab ────────────────────────────────────────────────── */}
          {activeTab === "Theme" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Theme</h2>

              <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">Interface theme</p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">Select or customize your UI theme</p>
                </div>

                <div className="p-6 grid grid-cols-3 gap-4">
                  {/* Light */}
                  <button
                    onClick={() => setTheme("light")}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                      theme === "light"
                        ? "border-neutral-900 dark:border-white shadow-md"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500"
                    }`}
                  >
                    {/* Preview */}
                    <div className="bg-white aspect-[4/3] flex flex-col p-2 gap-1.5">
                      <div className="flex gap-1">
                        <div className="w-1/3 h-2 bg-neutral-200 rounded-sm" />
                        <div className="w-1/2 h-2 bg-neutral-100 rounded-sm" />
                      </div>
                      <div className="flex-1 bg-neutral-50 rounded-md flex flex-col gap-1 p-1.5">
                        <div className="h-1.5 w-3/4 bg-neutral-200 rounded" />
                        <div className="h-1.5 w-1/2 bg-neutral-100 rounded" />
                        <div className="h-1.5 w-2/3 bg-neutral-200 rounded" />
                      </div>
                    </div>
                    <div className="bg-neutral-50 border-t border-neutral-100 px-3 py-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-700">Light</span>
                      {theme === "light" && <Check className="w-3.5 h-3.5 text-neutral-900" />}
                    </div>
                  </button>

                  {/* Dark */}
                  <button
                    onClick={() => setTheme("dark")}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                      theme === "dark"
                        ? "border-neutral-900 dark:border-white shadow-md"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500"
                    }`}
                  >
                    <div className="bg-[#111113] aspect-[4/3] flex flex-col p-2 gap-1.5">
                      <div className="flex gap-1">
                        <div className="w-1/3 h-2 bg-neutral-700 rounded-sm" />
                        <div className="w-1/2 h-2 bg-neutral-800 rounded-sm" />
                      </div>
                      <div className="flex-1 bg-neutral-900 rounded-md flex flex-col gap-1 p-1.5">
                        <div className="h-1.5 w-3/4 bg-neutral-700 rounded" />
                        <div className="h-1.5 w-1/2 bg-neutral-800 rounded" />
                        <div className="h-1.5 w-2/3 bg-neutral-700 rounded" />
                      </div>
                    </div>
                    <div className="bg-[#1C1C1F] border-t border-neutral-800 px-3 py-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-200">Dark</span>
                      {theme === "dark" && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>

                  {/* System */}
                  <button
                    onClick={() => setTheme("system")}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                      theme === "system"
                        ? "border-neutral-900 dark:border-white shadow-md"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500"
                    }`}
                  >
                    <div className="aspect-[4/3] flex">
                      {/* Left half — light */}
                      <div className="flex-1 bg-white flex flex-col p-2 gap-1.5">
                        <div className="w-full h-2 bg-neutral-200 rounded-sm" />
                        <div className="flex-1 bg-neutral-50 rounded-sm" />
                      </div>
                      {/* Right half — dark */}
                      <div className="flex-1 bg-[#111113] flex flex-col p-2 gap-1.5">
                        <div className="w-full h-2 bg-neutral-700 rounded-sm" />
                        <div className="flex-1 bg-neutral-900 rounded-sm" />
                      </div>
                    </div>
                    <div className="bg-neutral-50 dark:bg-[#1C1C1F] border-t border-neutral-100 dark:border-neutral-800 px-3 py-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">System</span>
                      {theme === "system" && <Check className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* Info cards */}
              <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sun className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">Light mode</p>
                      <p className="text-xs text-neutral-400 mt-0.5">Clean, bright interface</p>
                    </div>
                  </div>
                  <button onClick={() => setTheme("light")}
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${theme === "light" ? "border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white" : "border-neutral-300 dark:border-neutral-600"}`}>
                    {theme === "light" && <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-neutral-900" />}
                  </button>
                </div>
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">Dark mode</p>
                      <p className="text-xs text-neutral-400 mt-0.5">Easy on the eyes</p>
                    </div>
                  </div>
                  <button onClick={() => setTheme("dark")}
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${theme === "dark" ? "border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white" : "border-neutral-300 dark:border-neutral-600"}`}>
                    {theme === "dark" && <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-neutral-900" />}
                  </button>
                </div>
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-4 h-4 text-neutral-400" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">System preference</p>
                      <p className="text-xs text-neutral-400 mt-0.5">Follow your OS setting</p>
                    </div>
                  </div>
                  <button onClick={() => setTheme("system")}
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${theme === "system" ? "border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white" : "border-neutral-300 dark:border-neutral-600"}`}>
                    {theme === "system" && <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-neutral-900" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Color tab ────────────────────────────────────────────────── */}
          {activeTab === "Color" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Color</h2>

              <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800">
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">Accent color</p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">Choose a highlight color for your workspace</p>
                </div>

                <div className="p-6 grid grid-cols-3 gap-3">
                  {ACCENT_COLORS.map(color => (
                    <button
                      key={color.name}
                      onClick={() => {
                        setAccentColor(color.name);
                        if (typeof window !== "undefined") {
                          localStorage.setItem("pyramid_accent_color", color.name);
                        }
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                        accentColor === color.name
                          ? "border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800/60 shadow-xs"
                          : "border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600"
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full ${color.bg} shrink-0 shadow-sm`} />
                      <span className={`text-sm font-medium ${accentColor === color.name ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400"}`}>
                        {color.name}
                      </span>
                      {accentColor === color.name && (
                        <Check className="w-4 h-4 text-neutral-900 dark:text-white ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 space-y-3">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Preview</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className="px-4 py-1.5 rounded-lg text-white text-sm font-semibold shadow-xs"
                    style={{ backgroundColor: ACCENT_COLORS.find(c => c.name === accentColor)?.hex || "#3B82F6" }}
                  >
                    Primary button
                  </span>
                  <span
                    className="px-4 py-1.5 rounded-lg text-sm font-semibold border-2"
                    style={{
                      color: ACCENT_COLORS.find(c => c.name === accentColor)?.hex || "#3B82F6",
                      borderColor: ACCENT_COLORS.find(c => c.name === accentColor)?.hex || "#3B82F6",
                    }}
                  >
                    Outline button
                  </span>
                  <span
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{ backgroundColor: ACCENT_COLORS.find(c => c.name === accentColor)?.hex || "#3B82F6" }}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── Leave workspace confirmation modal ───────────────────────────── */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">Leave Workspace?</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
              You will lose access to all projects and tasks in this workspace.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2 text-sm font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowLeaveConfirm(false); router.push("/"); }}
                className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl transition-all cursor-pointer active:scale-[0.98]"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
