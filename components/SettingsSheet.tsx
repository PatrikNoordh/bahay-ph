"use client";

import { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";

type Language = "en" | "fil";

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en",  label: "English" },
  { code: "fil", label: "Filipino" },
];

function readStoredLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem("language");
  return stored === "fil" ? "fil" : "en";
}

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const { theme, toggleTheme } = useTheme();
  const [expandedRow, setExpandedRow] = useState<"language" | "about" | "contact" | null>(null);
  const [language, setLanguage] = useState<Language>(readStoredLanguage);

  function handleClose() {
    setExpandedRow(null);
    onClose();
  }

  function selectLanguage(code: Language) {
    setLanguage(code);
    localStorage.setItem("language", code);
  }

  function toggleRow(row: "language" | "about" | "contact") {
    setExpandedRow((prev) => (prev === row ? null : row));
  }

  return (
    <>
      {/* Backdrop — scoped to app container */}
      <div
        className={`fixed inset-0 z-40 flex items-end justify-center transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-narra/40" />
      </div>

      {/* Sheet — constrained to app container width */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className={`w-full max-w-[420px] pointer-events-auto rounded-t-[20px] bg-sand shadow-[var(--shadow-card)] transition-transform duration-300 max-h-[80dvh] overflow-y-auto ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-sand-dark" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="font-display font-semibold text-lg text-narra">Settings</h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close settings"
            className="w-8 h-8 flex items-center justify-center rounded-full bg-sand-dark text-muted text-sm active:scale-95 transition-transform"
          >
            ✕
          </button>
        </div>

        <div className="px-4 pb-6 space-y-1">
          {/* ── Language ── */}
          <SettingsRow
            icon="🌐"
            label="Language"
            value={LANGUAGES.find((l) => l.code === language)?.label ?? "English"}
            expanded={expandedRow === "language"}
            onToggle={() => toggleRow("language")}
          />
          {expandedRow === "language" && (
            <div className="bg-white rounded-[14px] mx-1 overflow-hidden">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => selectLanguage(lang.code)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 text-sm transition-colors ${
                    language === lang.code ? "text-primary font-semibold" : "text-narra"
                  }`}
                >
                  <span>{lang.label}</span>
                  {language === lang.code && <span className="text-primary">✓</span>}
                </button>
              ))}
            </div>
          )}

          {/* ── About Us ── */}
          <SettingsRow
            icon="🏡"
            label="About Us"
            expanded={expandedRow === "about"}
            onToggle={() => toggleRow("about")}
          />
          {expandedRow === "about" && (
            <div className="bg-white rounded-[14px] mx-1 px-4 py-4 space-y-2">
              <p className="font-display font-semibold text-base text-narra">Bahay.ph</p>
              <p className="text-xs text-muted leading-relaxed">
                Bahay.ph is the trusted, verified property platform for Cebu — connecting buyers
                with licensed brokers for houses, condos, lots, and more.
              </p>
              <p className="text-xs text-muted leading-relaxed">
                Only PRC-verified brokers list on Bahay.ph. Buyers always browse for free.
              </p>
              <p className="text-[10px] text-muted/60 mt-1">Version 1.0.0</p>
            </div>
          )}

          {/* ── Contact ── */}
          <SettingsRow
            icon="✉️"
            label="Contact"
            expanded={expandedRow === "contact"}
            onToggle={() => toggleRow("contact")}
          />
          {expandedRow === "contact" && (
            <div className="bg-white rounded-[14px] mx-1 px-4 py-4 space-y-3">
              <a
                href="mailto:hello@bahay.ph"
                className="flex items-center gap-3 text-sm text-narra active:text-primary"
              >
                <span className="text-base">📧</span>
                <span>hello@bahay.ph</span>
              </a>
              <a
                href="https://wa.me/63000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-narra active:text-primary"
              >
                <span className="text-base">💬</span>
                <span>WhatsApp us</span>
              </a>
            </div>
          )}

          {/* ── Dark / Light mode ── */}
          <div className="flex items-center justify-between h-[52px] px-4 bg-white rounded-[14px]">
            <div className="flex items-center gap-3">
              <span className="text-base" aria-hidden="true">
                {theme === "dark" ? "🌙" : "☀️"}
              </span>
              <span className="text-sm font-medium text-narra">
                {theme === "dark" ? "Dark mode" : "Light mode"}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={theme === "dark"}
              aria-label="Toggle dark mode"
              onClick={toggleTheme}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                theme === "dark" ? "bg-primary" : "bg-sand-dark"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  theme === "dark" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}

interface SettingsRowProps {
  icon: string;
  label: string;
  value?: string;
  expanded: boolean;
  onToggle: () => void;
}

function SettingsRow({ icon, label, value, expanded, onToggle }: SettingsRowProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between h-[52px] px-4 bg-white rounded-[14px] active:scale-[0.98] transition-transform duration-100"
    >
      <div className="flex items-center gap-3">
        <span className="text-base" aria-hidden="true">{icon}</span>
        <span className="text-sm font-medium text-narra">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-xs text-muted">{value}</span>}
        <span
          className={`text-muted text-xs transition-transform duration-200 inline-block ${
            expanded ? "rotate-90" : ""
          }`}
        >
          ›
        </span>
      </div>
    </button>
  );
}
