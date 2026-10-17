import React, { useState } from 'react';
import { AlertTriangle, UserPlus, KeyRound, X } from 'lucide-react';
import type { Participant } from '../../shared/types.js';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md p-6 rounded-2xl bg-brand-surface border border-brand-border shadow-2xl space-y-4">
        <div className="flex items-center space-x-3 text-rose-400">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">{title}</h3>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed">{message}</p>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-surface2 hover:bg-brand-surface3 text-neutral-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
              isDestructive ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
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
  accentColor = '#e11d48',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md p-6 rounded-2xl bg-brand-surface border border-brand-border shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <UserPlus className="w-5 h-5 text-neutral-300" />
            <h3 className="text-base font-bold text-white">Manual Participant Entry</h3>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white">
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
            <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
              Kick Username
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. lucky_viewer"
              className="w-full px-3 py-2 rounded-xl bg-brand-surface2 border border-brand-border text-white text-xs font-mono focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-surface2 hover:bg-brand-surface3 text-neutral-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all hover:brightness-110"
              style={{ backgroundColor: accentColor }}
            >
              {submitting ? 'Adding...' : 'Add to Giveaway'}
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
  accentColor = '#e11d48',
}) => {
  const [secret, setSecret] = useState(currentSecret || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(secret.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md p-6 rounded-2xl bg-brand-surface border border-brand-border shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Admin Session Key</h3>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed">
          Enter your <code className="text-amber-400 font-mono">ADMIN_SECRET</code> passphrase to authorize dashboard actions (creating giveaways, starting rolls, removing participants).
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-neutral-400 mb-1">
              Admin Passphrase / Token
            </label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter your admin secret key"
              className="w-full px-3 py-2 rounded-xl bg-brand-surface2 border border-brand-border text-white text-xs font-mono focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                onSave('');
                onClose();
              }}
              className="text-[11px] text-neutral-400 hover:text-rose-400"
            >
              Clear Stored Key
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-surface2 hover:bg-brand-surface3 text-neutral-300"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:brightness-110"
                style={{ backgroundColor: accentColor }}
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
