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
  confirmLabel = 'CONFIRM',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md p-5 rounded-xl bg-[#0d1018] border border-[#1e2436] shadow-2xl space-y-3.5">
        <div className="flex items-center space-x-2.5 text-rose-400">
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase telemetry tracking-wider">{title}</h3>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed font-sans">{message}</p>

        <div className="flex items-center justify-end space-x-2 pt-2">
          <button
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-lg text-xs telemetry font-bold bg-[#141824] hover:bg-[#1b2030] text-neutral-300 transition-colors uppercase"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-1.5 rounded-lg text-xs telemetry font-bold text-white transition-all shadow-sm uppercase ${
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
  accentColor = '#e63946',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md p-5 rounded-xl bg-[#0d1018] border border-[#1e2436] shadow-2xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4 text-neutral-300" />
            <h3 className="text-sm font-bold text-white uppercase telemetry tracking-wider">
              Manual Entrant Injection
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs telemetry">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] telemetry uppercase text-neutral-400 mb-1 font-bold">
              Kick Username / Handle
            </label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. lucky_viewer"
              className="w-full px-3 py-1.5 rounded-lg bg-[#11141e] border border-[#1e2436] text-white text-xs telemetry focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-xs telemetry font-bold bg-[#141824] hover:bg-[#1b2030] text-neutral-300 uppercase"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg text-xs telemetry font-bold text-white shadow-sm transition-all hover:brightness-110 uppercase"
              style={{ backgroundColor: accentColor }}
            >
              {submitting ? 'INJECTING...' : 'INJECT ENTRANT'}
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
  accentColor = '#e63946',
}) => {
  const [secret, setSecret] = useState(currentSecret || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(secret.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="w-full max-w-md p-5 rounded-xl bg-[#0d1018] border border-[#1e2436] shadow-2xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase telemetry tracking-wider">
              Admin Session Key
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed font-sans">
          Enter your <code className="text-amber-400 telemetry font-bold">ADMIN_SECRET</code> key to authorize master deck operations.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] telemetry uppercase text-neutral-400 mb-1 font-bold">
              Admin Passphrase
            </label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Paste your admin secret passphrase"
              className="w-full px-3 py-1.5 rounded-lg bg-[#11141e] border border-[#1e2436] text-white text-xs telemetry focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                onSave('');
                onClose();
              }}
              className="text-[10px] telemetry text-neutral-400 hover:text-rose-400 uppercase"
            >
              CLEAR KEY
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-xs telemetry font-bold bg-[#141824] hover:bg-[#1b2030] text-neutral-300 uppercase"
              >
                CLOSE
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs telemetry font-bold text-white shadow-sm hover:brightness-110 uppercase"
                style={{ backgroundColor: accentColor }}
              >
                SAVE KEY
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
