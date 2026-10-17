import React, { useState } from 'react';
import { AlertTriangle, UserPlus, KeyRound, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md p-6 rounded-2xl glass-card space-y-4 border border-white/[0.1] shadow-2xl">
        <div className="flex items-center space-x-3 text-rose-400">
          <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">{title}</h3>
        </div>

        <p className="text-sm text-neutral-300 leading-relaxed">{message}</p>

        <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-white/[0.08]">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                : 'bg-[#53fc18] text-black hover:bg-[#45d914] shadow-[#53fc18]/20'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ManualAddModalProps {
  isOpen: boolean;
  onAdd: (username: string) => Promise<void>;
  onClose: () => void;
  accentColor?: string;
}

export const ManualAddModal: React.FC<ManualAddModalProps> = ({
  isOpen,
  onAdd,
  onClose,
}) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      await onAdd(username.trim());
      setUsername('');
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md p-6 rounded-2xl glass-card space-y-4 border border-white/[0.1] shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#53fc18]/15 border border-[#53fc18]/30 text-[#53fc18]">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Add Participant Manually</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Kick Viewer Username
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. lucky_viewer"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:border-[#53fc18] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-end space-x-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#53fc18] hover:bg-[#45d914] text-black shadow-md shadow-[#53fc18]/20 transition-all"
            >
              {submitting ? 'Adding...' : 'Add Viewer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AdminAuthModalProps {
  isOpen: boolean;
  currentSecret: string;
  onSave: (secret: string) => void;
  onClose: () => void;
  accentColor?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  currentSecret,
  onSave,
  onClose,
}) => {
  const [secret, setSecret] = useState(currentSecret || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(secret.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-md p-6 rounded-2xl glass-card space-y-4 border border-white/[0.1] shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Admin Security Key</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed">
          If your server has an <code className="text-[#53fc18] font-mono">ADMIN_SECRET</code> configured, enter it here to authorize dashboard actions.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Secret Passphrase
            </label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter your admin secret"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-white text-sm focus:border-[#53fc18] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                onSave('');
                onClose();
              }}
              className="text-xs text-neutral-400 hover:text-rose-400 transition-colors"
            >
              Clear Passphrase
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#53fc18] hover:bg-[#45d914] text-black shadow-md shadow-[#53fc18]/20 transition-all"
              >
                Save Key
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
