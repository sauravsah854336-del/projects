import { useState, useEffect, useCallback } from "react";

let addToastFn = null;

export const toast = {
  success: (message, duration) => addToastFn?.({ type: "success", message, duration }),
  error: (message, duration) => addToastFn?.({ type: "error", message, duration }),
  info: (message, duration) => addToastFn?.({ type: "info", message, duration }),
  warning: (message, duration) => addToastFn?.({ type: "warning", message, duration }),
};

const ICONS = {
  success: "✅",
  error: "❌",
  info: "ℹ️",
  warning: "⚠️",
};

const TYPE_STYLES = {
  success: {
    wrap: "bg-green-50 border-green-300",
    text: "text-green-800",
    bar: "bg-green-500",
    close: "text-green-800",
  },
  error: {
    wrap: "bg-red-50 border-red-300",
    text: "text-red-800",
    bar: "bg-red-500",
    close: "text-red-800",
  },
  info: {
    wrap: "bg-blue-50 border-blue-300",
    text: "text-blue-800",
    bar: "bg-blue-500",
    close: "text-blue-800",
  },
  warning: {
    wrap: "bg-yellow-50 border-yellow-300",
    text: "text-yellow-800",
    bar: "bg-yellow-400",
    close: "text-yellow-800",
  },
};

const ToastItem = ({ t, onRemove }) => {
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = t.duration || 4000;
  const s = TYPE_STYLES[t.type] || TYPE_STYLES.info;

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        handleClose();
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onRemove(t.id), 300);
  };

  return (
    <div
      className={`relative flex items-start gap-3 border rounded-xl px-4 pt-3.5 pb-2.5 shadow-xl shadow-black/10 min-w-[320px] max-w-[420px] overflow-hidden ${s.wrap} ${exiting ? "toast-out" : "toast-in"}`}
    >
      <span className="text-xl shrink-0 mt-0.5">{ICONS[t.type]}</span>

      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-bold leading-snug m-0 break-words ${s.text}`}>
          {t.message}
        </p>
      </div>

      <button
        onClick={handleClose}
        className={`bg-transparent border-none cursor-pointer text-base leading-none shrink-0 opacity-60 hover:opacity-100 transition-opacity p-0 ${s.close}`}
      >
        ✕
      </button>

      <div
        className={`absolute bottom-0 left-0 h-[3px] rounded-b-xl transition-[width] duration-[50ms] linear ${s.bar}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type, message, duration }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(100%); }
        }
        .toast-in { animation: toastIn 0.3s ease both; }
        .toast-out { animation: toastOut 0.3s ease both; }
      `}</style>

      <div className="fixed top-20 right-5 flex flex-col gap-2.5 z-[99999] pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem t={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </>
  );
};

export default ToastContainer;