import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X, ShieldAlert } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
  };

  const confirm = useCallback(({ title = 'Are you sure?', message = '', confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
    return new Promise((resolve) => {
      setConfirmModal({
        title,
        message,
        confirmText,
        cancelText,
        type,
        resolve: (result) => {
          setConfirmModal(null);
          resolve(result);
        },
      });
    });
  }, []);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/40 bg-[#002B49]/95 text-white',
    error: 'border-rose-500/40 bg-[#002B49]/95 text-white',
    warning: 'border-amber-500/40 bg-[#002B49]/95 text-white',
    info: 'border-[#0052A5] bg-[#002B49]/95 text-white',
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Floating Web App Toast Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all transform animate-in slide-in-from-top-2 duration-200 ${
              borders[t.type] || borders.info
            }`}
          >
            {icons[t.type]}
            <p className="text-sm font-medium flex-1 pt-0.5 leading-snug">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="text-white/60 hover:text-white transition-colors p-0.5 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* In-App Confirmation Modal (Replaces Browser window.confirm) */}
      {confirmModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#002B49] text-white border border-[#0052A5]/50 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-white">
              <div className={`p-2.5 rounded-xl ${confirmModal.type === 'danger' ? 'bg-rose-500/20 text-rose-400' : 'bg-[#0052A5] text-white'}`}>
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold tracking-wide">{confirmModal.title}</h3>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed">{confirmModal.message}</p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => confirmModal.resolve(false)}
                className="px-4 py-2 text-sm font-medium text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                {confirmModal.cancelText}
              </button>
              <button
                type="button"
                onClick={() => confirmModal.resolve(true)}
                className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-lg transition-all ${
                  confirmModal.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/40'
                    : 'bg-[#0052A5] hover:bg-[#003366] shadow-blue-900/40'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
