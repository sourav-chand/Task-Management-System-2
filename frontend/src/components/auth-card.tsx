"use client";

import React, { useState } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { apiGuestLogin, apiGoogleLogin, User } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface AuthCardProps {
  onSuccess: (user: User) => void;
}

export function AuthCard({ onSuccess }: AuthCardProps) {
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const handleGuestLogin = async () => {
    setLoadingGuest(true);
    try {
      const res = await apiGuestLogin();
      onSuccess(res.user);
    } catch (err) {
      console.error("Guest login failed:", err);
    } finally {
      setLoadingGuest(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    try {
      const res = await apiGoogleLogin("alex.designer@pyramid.app", "Alex Developer");
      onSuccess(res.user);
    } catch (err) {
      console.error("Google login failed:", err);
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#09090B] flex flex-col items-center justify-center p-4 relative transition-colors duration-200 font-sans">
      {/* Theme Switcher in Top Right */}
      <div className="absolute top-5 right-5 z-10">
        <ThemeToggle />
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-[440px] flex flex-col items-center">
        {/* Pyramid Logo Header above the Card */}
        <div className="mb-6">
          <Logo />
        </div>

        {/* Figma Design Card Container */}
        <div className="w-full bg-white dark:bg-[#121215] border border-neutral-200/90 dark:border-neutral-800/90 rounded-2xl p-7 sm:p-9 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)] transition-all">
          {/* Card Title */}
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight text-center">
            Let's get back on track
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mt-1.5 mb-7 leading-normal">
            Enter your email below to login to your account.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3 w-full">
            {/* Continue as Guest Button */}
            <button
              onClick={handleGuestLogin}
              disabled={loadingGuest || loadingGoogle}
              className="w-full h-11 bg-[#18181B] hover:bg-[#27272A] active:scale-[0.99] dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-950 text-white font-medium text-sm rounded-full transition-all duration-150 flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-75"
            >
              {loadingGuest ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white dark:text-neutral-950" />
                  <span>Logging in as Guest...</span>
                </>
              ) : (
                <span>Continue as Guest</span>
              )}
            </button>

            {/* Login with Google Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loadingGuest || loadingGoogle}
              className="w-full h-11 bg-white dark:bg-[#18181B] hover:bg-neutral-50 dark:hover:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-800 active:scale-[0.99] text-neutral-900 dark:text-neutral-100 font-medium text-sm rounded-full transition-all duration-150 flex items-center justify-center gap-2.5 shadow-xs cursor-pointer disabled:opacity-75"
            >
              {loadingGoogle ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-900 dark:text-neutral-100" />
                  <span>Connecting Google...</span>
                </>
              ) : (
                <>
                  {/* Google SVG G Icon */}
                  <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.27v3.15C3.25 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4.01-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.61l4.01 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                  <span>Login with Google</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Card Footer Legal Disclaimer */}
        <p className="text-xs text-neutral-400 dark:text-neutral-500 text-center mt-6 max-w-[290px] leading-relaxed">
          By clicking continue, you agree to our{" "}
          <a href="#" className="underline hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
