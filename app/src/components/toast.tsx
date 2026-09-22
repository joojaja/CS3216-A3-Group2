"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";

type ToastContextValue = { toast: (message: string) => void };

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useCallback((next: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(next);
    timer.current = setTimeout(() => setMessage(null), 2400);
  }, []);

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
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
    </MotionConfig>
  );
}
