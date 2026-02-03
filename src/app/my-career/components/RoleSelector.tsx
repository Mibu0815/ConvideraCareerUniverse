'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Check, X, Briefcase, Crown } from 'lucide-react';
import type { GroupedRoles, RoleOption } from '@/app/actions/get-roles';
import { cn, formatRoleLevel } from '@/lib/utils';

interface RoleSelectorProps {
  label: string;
  placeholder: string;
  groupedRoles: GroupedRoles[];
  selectedRoleId: string | null;
  onSelect: (roleId: string | null) => void;
}

export function RoleSelector({
  label,
  placeholder,
  groupedRoles,
  selectedRoleId,
  onSelect,
}: RoleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedRole = selectedRoleId
    ? groupedRoles.flatMap((g) => g.roles).find((r) => r.id === selectedRoleId)
    : null;

  const filteredGroups = groupedRoles
    .map((group) => ({
      ...group,
      roles: group.roles.filter(
        (role) =>
          role.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          group.fieldName.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((group) => group.roles.length > 0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (roleId: string) => {
    onSelect(roleId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-brand-gray-700 mb-2">{label}</label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-4 py-3 rounded-bento border text-left transition-all',
          isOpen
            ? 'border-brand-gray-400 ring-2 ring-brand-gray-200 bg-brand-white'
            : 'border-brand-gray-200 hover:border-brand-gray-300 bg-brand-white',
          selectedRole ? 'text-brand-gray-900' : 'text-brand-gray-400'
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {selectedRole ? (
            <>
              <div className="w-8 h-8 rounded-lg bg-brand-gray-100 flex items-center justify-center flex-shrink-0">
                {selectedRole.hasLeadership ? (
                  <Crown className="w-4 h-4 text-brand-gray-700" />
                ) : (
                  <Briefcase className="w-4 h-4 text-brand-gray-700" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{selectedRole.title}</div>
                <div className="text-xs text-brand-gray-400">{formatRoleLevel(selectedRole.level)}</div>
              </div>
            </>
          ) : (
            <span>{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {selectedRole && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
              className="p-1 rounded-md hover:bg-brand-gray-100 text-brand-gray-400 hover:text-brand-gray-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </span>
          )}
          <ChevronDown
            className={cn(
              'w-5 h-5 text-brand-gray-400 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-brand-white rounded-bento border border-brand-gray-200 shadow-xl overflow-hidden"
          >
            <div className="p-3 border-b border-brand-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search roles..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-brand-gray-200 focus:border-brand-gray-400 focus:ring-2 focus:ring-brand-gray-200 outline-none text-sm"
                />
              </div>
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {filteredGroups.length === 0 ? (
                <div className="p-4 text-center text-brand-gray-400 text-sm">
                  No roles found
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <div key={group.fieldId}>
                    <div className="px-4 py-2 text-xs font-semibold text-brand-gray-400 uppercase tracking-wider bg-brand-gray-50 sticky top-0">
                      {group.fieldName}
                    </div>
                    {group.roles.map((role) => (
                      <RoleOptionItem
                        key={role.id}
                        role={role}
                        isSelected={role.id === selectedRoleId}
                        onSelect={() => handleSelect(role.id)}
                      />
                    ))}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RoleOptionItem({
  role,
  isSelected,
  onSelect,
}: {
  role: RoleOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
        isSelected ? 'bg-brand-gray-100' : 'hover:bg-brand-gray-50'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
          isSelected ? 'bg-brand-gray-900' : 'bg-brand-gray-100'
        )}
      >
        {role.hasLeadership ? (
          <Crown className={cn('w-4 h-4', isSelected ? 'text-brand-white' : 'text-brand-gray-500')} />
        ) : (
          <Briefcase className={cn('w-4 h-4', isSelected ? 'text-brand-white' : 'text-brand-gray-500')} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className={cn('font-medium truncate', isSelected ? 'text-brand-gray-900' : 'text-brand-gray-700')}>
          {role.title}
        </div>
        <div className="text-xs text-brand-gray-400 flex items-center gap-2">
          <span>{formatRoleLevel(role.level)}</span>
          {role.leadershipType && (
            <>
              <span className="text-brand-gray-300">•</span>
              <span className="text-brand-gray-500">{role.leadershipType}</span>
            </>
          )}
        </div>
      </div>

      {isSelected && (
        <Check className="w-5 h-5 text-brand-gray-900 flex-shrink-0" />
      )}
    </button>
  );
}
