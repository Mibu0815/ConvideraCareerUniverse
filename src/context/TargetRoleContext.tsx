'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { updateUserTargetRole } from '@/app/actions/user-sync';

interface TargetRoleContextType {
  targetRoleId: string | null;
  targetRoleName: string | null;
  currentRoleId: string | null;
  currentRoleName: string | null;
  userId: string | null;
  isLoading: boolean;
  setTargetRole: (roleId: string | null, roleName?: string | null) => Promise<void>;
  setCurrentRole: (roleId: string | null, roleName?: string | null) => void;
  setUserId: (userId: string) => void;
}

const TargetRoleContext = createContext<TargetRoleContextType | undefined>(undefined);

interface TargetRoleProviderProps {
  children: ReactNode;
  initialTargetRoleId?: string | null;
  initialTargetRoleName?: string | null;
  initialCurrentRoleId?: string | null;
  initialCurrentRoleName?: string | null;
  initialUserId?: string | null;
}

export function TargetRoleProvider({
  children,
  initialTargetRoleId = null,
  initialTargetRoleName = null,
  initialCurrentRoleId = null,
  initialCurrentRoleName = null,
  initialUserId = null,
}: TargetRoleProviderProps) {
  const [targetRoleId, setTargetRoleIdState] = useState<string | null>(initialTargetRoleId);
  const [targetRoleName, setTargetRoleNameState] = useState<string | null>(initialTargetRoleName);
  const [currentRoleId, setCurrentRoleIdState] = useState<string | null>(initialCurrentRoleId);
  const [currentRoleName, setCurrentRoleNameState] = useState<string | null>(initialCurrentRoleName);
  const [userId, setUserIdState] = useState<string | null>(initialUserId);
  const [isLoading, setIsLoading] = useState(false);

  // Update state when initial props change (e.g., after server-side data loads)
  useEffect(() => {
    setTargetRoleIdState(initialTargetRoleId);
    setTargetRoleNameState(initialTargetRoleName);
    setCurrentRoleIdState(initialCurrentRoleId);
    setCurrentRoleNameState(initialCurrentRoleName);
    setUserIdState(initialUserId);
  }, [initialTargetRoleId, initialTargetRoleName, initialCurrentRoleId, initialCurrentRoleName, initialUserId]);

  const setTargetRole = useCallback(async (roleId: string | null, roleName?: string | null) => {
    if (!userId) {
      console.warn('Cannot set target role: no userId');
      return;
    }

    setIsLoading(true);
    try {
      // Persist to database immediately
      await updateUserTargetRole(userId, roleId);

      // Update local state
      setTargetRoleIdState(roleId);
      setTargetRoleNameState(roleName ?? null);
    } catch (error) {
      console.error('Failed to update target role:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const setCurrentRole = useCallback((roleId: string | null, roleName?: string | null) => {
    setCurrentRoleIdState(roleId);
    setCurrentRoleNameState(roleName ?? null);
  }, []);

  const setUserId = useCallback((id: string) => {
    setUserIdState(id);
  }, []);

  return (
    <TargetRoleContext.Provider
      value={{
        targetRoleId,
        targetRoleName,
        currentRoleId,
        currentRoleName,
        userId,
        isLoading,
        setTargetRole,
        setCurrentRole,
        setUserId,
      }}
    >
      {children}
    </TargetRoleContext.Provider>
  );
}

export function useTargetRole() {
  const context = useContext(TargetRoleContext);
  if (context === undefined) {
    throw new Error('useTargetRole must be used within a TargetRoleProvider');
  }
  return context;
}
