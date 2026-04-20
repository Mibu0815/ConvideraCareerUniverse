'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { RoleSelector } from './RoleSelector';
import { updateUserCurrentRole, updateUserTargetRole } from '@/app/actions/user-sync';
import type { GroupedRoles } from '@/app/actions/get-roles';

interface OnboardingRoleSelectorProps {
  userId: string;
  groupedRoles: GroupedRoles[];
  initialCurrentRoleId: string | null;
  initialTargetRoleId: string | null;
}

export function OnboardingRoleSelector({
  userId,
  groupedRoles,
  initialCurrentRoleId,
  initialTargetRoleId,
}: OnboardingRoleSelectorProps) {
  const [currentRoleId, setCurrentRoleId] = useState<string | null>(initialCurrentRoleId);
  const [targetRoleId, setTargetRoleId] = useState<string | null>(initialTargetRoleId);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const router = useRouter();

  const canContinue = !!currentRoleId && !!targetRoleId;

  const handleContinue = () => {
    if (!canContinue) return;
    setError('');

    startTransition(async () => {
      try {
        await updateUserCurrentRole(userId, currentRoleId);
        await updateUserTargetRole(userId, targetRoleId);
        router.push('/my-career/compare');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <RoleSelector
          label="Aktuelle Rolle"
          placeholder="Wähle deine aktuelle Rolle..."
          groupedRoles={groupedRoles}
          selectedRoleId={currentRoleId}
          onSelect={setCurrentRoleId}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <RoleSelector
          label="Zielrolle"
          placeholder="Wo möchtest du hin?"
          groupedRoles={groupedRoles}
          selectedRoleId={targetRoleId}
          onSelect={setTargetRoleId}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handleContinue}
        disabled={!canContinue || isPending}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-convidera-dark text-white font-semibold text-base transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Speichern...</>
        ) : (
          <><span>Weiter zum Vergleich</span> <ArrowRight className="w-5 h-5" /></>
        )}
      </button>
    </div>
  );
}
