import * as React from "react";
import "./toast.css";

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastItem = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  timeoutMs?: number; // default 3500
};

type ToastCtx = {
  push: (t: Omit<ToastItem, "id">) => void;
  clear: () => void;
};

const ToastContext = React.createContext<ToastCtx | null>(null);

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const remove = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const push = React.useCallback((t: Omit<ToastItem, "id">) => {
    const id = uid();
    const toast: ToastItem = {
      id,
      timeoutMs: 3500,
      ...t,
    };
    setItems((prev) => [toast, ...prev].slice(0, 5)); // máximo 5

    const ms = toast.timeoutMs ?? 3500;
    if (ms > 0) window.setTimeout(() => remove(id), ms);
  }, [remove]);

  const clear = React.useCallback(() => setItems([]), []);

  return (
    <ToastContext.Provider value={{ push, clear }}>
      {children}
      <ToastViewport items={items} onClose={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider />");
  return ctx;
}

function iconFor(type: ToastType) {
  switch (type) {
    case "success": return "✓";
    case "error": return "⨯";
    case "warning": return "!";
    default: return "i";
  }
}

function ToastViewport({
  items,
  onClose,
}: {
  items: ToastItem[];
  onClose: (id: string) => void;
}) {
  return (
    <div className="gd-toastViewport" aria-live="polite" aria-relevant="additions removals">
      {items.map((t) => (
        <div key={t.id} className={`gd-toast gd-toast--${t.type}`} role="status">
          <div className="gd-toast__icon" aria-hidden="true">{iconFor(t.type)}</div>

          <div className="gd-toast__body">
            {t.title ? <div className="gd-toast__title">{t.title}</div> : null}
            <div className="gd-toast__msg">{t.message}</div>
          </div>

          <button className="gd-toast__close" onClick={() => onClose(t.id)} aria-label="Cerrar">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
