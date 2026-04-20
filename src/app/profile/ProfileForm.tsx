'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Calendar, Shield, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { updateUserProfile, updateUserCurrentRole, updateUserTargetRole } from '@/app/actions/user-sync';
import { RoleSelector } from '@/app/my-career/components/RoleSelector';
import type { GroupedRoles } from '@/app/actions/get-roles';

interface ProfileFormProps {
  userId: string;
  initialName: string;
  email: string;
  currentRoleName: string | null;
  targetRoleName: string | null;
  currentRoleId: string | null;
  targetRoleId: string | null;
  groupedRoles: GroupedRoles[];
  memberSince: string | null;
}

export function ProfileForm({
  userId,
  initialName,
  email,
  currentRoleId,
  targetRoleId,
  groupedRoles,
  memberSince,
}: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [currentRole, setCurrentRole] = useState<string | null>(currentRoleId);
  const [targetRole, setTargetRole] = useState<string | null>(targetRoleId);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email[0].toUpperCase();

  const handleSaveProfile = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        await updateUserProfile(userId, { name });
        if (currentRole) await updateUserCurrentRole(userId, currentRole);
        if (targetRole) await updateUserTargetRole(userId, targetRole);
        setMessage({ type: 'success', text: 'Profil gespeichert!' });
        router.refresh();
      } catch (err) {
        setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Fehler beim Speichern' });
      }
    });
  };

  const handleChangePassword = async () => {
    setPasswordMessage(null);
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Passwort muss mindestens 6 Zeichen haben' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwörter stimmen nicht überein' });
      return;
    }
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage({ type: 'success', text: 'Passwort geändert!' });
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err instanceof Error ? err.message : 'Fehler beim Ändern' });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Avatar & Basic Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-convidera-blue to-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-bold text-convidera-dark">{name || email}</h2>
            <p className="text-sm text-gray-500">{email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <User className="w-4 h-4" /> Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-convidera-blue focus:ring-2 focus:ring-convidera-blue/10 outline-none text-sm"
              placeholder="Dein Name"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <Mail className="w-4 h-4" /> E-Mail
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
              <Calendar className="w-4 h-4" /> Mitglied seit
            </label>
            <p className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm">
              {formatDate(memberSince)}
            </p>
          </div>
        </div>
      </div>

      {/* Roles */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-convidera-dark mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Rollen
        </h3>
        <div className="space-y-4">
          <RoleSelector
            label="Aktuelle Rolle"
            placeholder="Wähle deine aktuelle Rolle..."
            groupedRoles={groupedRoles}
            selectedRoleId={currentRole}
            onSelect={setCurrentRole}
          />
          <RoleSelector
            label="Zielrolle"
            placeholder="Wo möchtest du hin?"
            groupedRoles={groupedRoles}
            selectedRoleId={targetRole}
            onSelect={setTargetRole}
          />
        </div>
      </div>

      {/* Save Profile */}
      {message && (
        <div className={`rounded-xl p-3 text-center text-sm ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
          {message.type === 'success' && <Check className="w-4 h-4 inline mr-1" />}
          {message.text}
        </div>
      )}
      <button
        onClick={handleSaveProfile}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-convidera-dark text-white font-semibold transition-all hover:shadow-lg disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
        Profil speichern
      </button>

      {/* Password Change */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-base font-bold text-convidera-dark mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4" /> Passwort ändern
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Neues Passwort</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-convidera-blue focus:ring-2 focus:ring-convidera-blue/10 outline-none text-sm"
              placeholder="Mindestens 6 Zeichen"
              minLength={6}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">Passwort bestätigen</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-convidera-blue focus:ring-2 focus:ring-convidera-blue/10 outline-none text-sm"
              placeholder="Passwort wiederholen"
            />
          </div>
          {passwordMessage && (
            <div className={`rounded-xl p-3 text-center text-sm ${passwordMessage.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
              {passwordMessage.text}
            </div>
          )}
          <button
            onClick={handleChangePassword}
            disabled={!newPassword || !confirmPassword}
            className="w-full px-6 py-3 rounded-xl border-2 border-gray-200 text-convidera-dark font-semibold transition-all hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Passwort ändern
          </button>
        </div>
      </div>
    </div>
  );
}
