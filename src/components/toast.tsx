"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastKind = "success" | "error";
type Toast = { id: number; kind: ToastKind; message: string };
type ToastApi = { success: (message: string) => void; error: (message: string) => void };

const ToastContext = createContext<ToastApi | null>(null);

const TOAST_DURATION_MS = 4000;

/**
 * Minimal notifications. It lives in the root layout, so a message shown right
 * before a navigation (e.g. "Task created") is still visible on the next page.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const show = useCallback((kind: ToastKind, message: string) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, kind, message }]);
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), TOAST_DURATION_MS);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({ success: (message) => show("success", message), error: (message) => show("error", message) }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" className="fixed inset-x-4 bottom-4 flex flex-col items-center gap-2 sm:left-auto sm:items-end">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.kind === "error" ? "alert" : "status"}
            className={`max-w-sm rounded-md px-4 py-3 text-sm text-white shadow-lg ${
              toast.kind === "error" ? "bg-red-600" : "bg-green-600"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside <ToastProvider>");
  return api;
}
