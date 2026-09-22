"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";

// An optional button in the toast, such as Undo. The toast stays up longer
// when it has one, so there is time to press it
export type ToastAction = { label: string; onClick: () => void };

type ToastContextValue = { toast: (message: string, action?: ToastAction) => void };

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [action, setAction] = useState<ToastAction | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((next: string, nextAction?: ToastAction) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(next);
    setAction(nextAction ?? null);
    timer.current = setTimeout(() => {
      setMessage(null);
      setAction(null);
    }, nextAction ? 5000 : 2400);
  }, []);

  const runAction = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    action?.onClick();
    setMessage(null);
    setAction(null);
  }, [action]);

  return (
    <MotionConfig reducedMotion="user">
    <ToastContext.Provider value={{ toast }}>
      {children}
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: -14, x: 8 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.3, 1] }}
            role="status"
            className="fixed top-4 right-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-lg sm:left-auto"
          >
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-ok">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" className="size-3">
                <path d="M5 12l5 5L20 7" />
              </svg>
            </span>
            <span className="flex-1">{message}</span>
            {action && (
              <button
                type="button"
                onClick={runAction}
                className="ml-2 shrink-0 rounded-md px-2 py-1 text-sm font-semibold text-tangerine underline-offset-2 hover:underline"
              >
                {action.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
    </MotionConfig>
  );
}
