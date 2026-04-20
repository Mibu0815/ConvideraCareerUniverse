'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Compass, BookOpen, Users, LogOut, User, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { name: 'Dashboard', href: '/', icon: Compass },
  { name: 'Meine Journey', href: '/learning-journey', icon: BookOpen },
  { name: 'Explore Roles', href: '/my-career', icon: Users },
];

interface NavigationProps {
  userName?: string | null;
}

export function Navigation({ userName }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-gray-200">
      <div className="h-full max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => router.push('/')}
        >
          <div className="w-8 h-8 rounded-lg bg-convidera-dark flex items-center justify-center text-white text-sm font-bold group-hover:scale-105 transition-transform">
            c
          </div>
          <div className="hidden sm:block">
            <span className="text-base font-semibold text-convidera-dark tracking-tight">
              Career Universe
            </span>
            <span className="text-[10px] ml-1.5 px-1.5 py-0.5 bg-convidera-blue/10 text-convidera-blue rounded font-medium">
              2.0
            </span>
          </div>
        </div>

        {/* Navigation Links - Centered */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`
                  relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${active
                    ? 'text-convidera-blue bg-convidera-blue/5'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden md:inline">{item.name}</span>
                {active && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-convidera-blue rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Profile Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-convidera-blue to-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-md">
              {initials}
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-convidera-dark truncate">{userName || 'User'}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { setMenuOpen(false); router.push('/profile'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  Mein Profil
                </button>
                <button
                  onClick={() => { setMenuOpen(false); handleLogout(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Abmelden
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
