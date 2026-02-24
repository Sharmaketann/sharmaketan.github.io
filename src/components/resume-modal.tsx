"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PORTFOLIO_CONFIG } from "@/data/portfolio.config";

function getDocId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

interface ResumeModalProps {
  open: boolean;
  onClose: () => void;
}

export function ResumeModal({ open, onClose }: ResumeModalProps) {
  const docId = getDocId(PORTFOLIO_CONFIG.resume);
  const previewUrl = docId
    ? `https://docs.google.com/document/d/${docId}/preview`
    : PORTFOLIO_CONFIG.resume;
  const downloadUrl = docId
    ? `https://docs.google.com/document/d/${docId}/export?format=pdf`
    : PORTFOLIO_CONFIG.resume;

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.97, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 14 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative w-full max-w-3xl h-[88vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 flex flex-col pointer-events-auto">

              {/* Top bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-zinc-800 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: "#b86440" }}
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Resume — Sharma Ketan
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Download PDF */}
                  <a
                    href={downloadUrl}
                    download="Sharma_Ketan_Resume.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-lg border transition-colors duration-200
                               border-gray-200 dark:border-zinc-700
                               text-gray-700 dark:text-gray-300
                               hover:border-[#b86440] hover:text-[#b86440]
                               dark:hover:border-[#b86440] dark:hover:text-[#b86440]"
                  >
                    <DownloadIcon />
                    Download PDF
                  </a>

                  {/* Close */}
                  <button
                    onClick={onClose}
                    aria-label="Close resume"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 dark:text-gray-600
                               hover:text-gray-900 dark:hover:text-gray-100
                               hover:bg-gray-100 dark:hover:bg-zinc-800
                               transition-colors"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>

              {/* Google Docs preview */}
              <div className="flex-1 min-h-0 overflow-hidden rounded-b-2xl">
                <iframe
                  src={previewUrl}
                  title="Sharma Ketan — Resume"
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
