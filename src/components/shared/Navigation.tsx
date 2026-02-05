'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Target, BookOpen, BarChart3, Settings } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Karriereziele', href: '/my-career', icon: Target },
  { name: 'Lernpfad', href: '/learning-journey', icon: BookOpen },
  { name: 'Insights', href: '/insights', icon: BarChart3 },
  { name: 'Einstellungen', href: '/settings', icon: Settings },
];

interface NavigationProps {
  userName?: string | null;
}

export function Navigation({ userName }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 px-6 sm:px-11 flex items-center justify-between bg-brand-gray-50/70 backdrop-blur-xl border-b border-brand-gray-200/50">
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 cursor-pointer"
        onClick={() => router.push('/')}
      >
        <div className="w-8 h-8 rounded-lg bg-convidera-dark flex items-center justify-center text-white text-sm font-bold">
          c
        </div>
        <span className="text-base font-semibold text-convidera-dark tracking-tight">
          convidera
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="hidden md:flex gap-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={`nav-link flex items-center gap-2 ${
                active ? 'nav-link-active' : ''
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="hidden lg:inline">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Navigation */}
      <nav className="flex md:hidden gap-1">
        {navItems.slice(0, 3).map((item) => {
          const active = isActive(item.href);
          return (
            <button
              key={item.name}
              onClick={() => router.push(item.href)}
              className={`p-2 rounded-lg transition-colors ${
                active
                  ? 'bg-convidera-blue/10 text-convidera-blue'
                  : 'text-brand-gray-400 hover:text-brand-gray-600'
              }`}
            >
              <item.icon className="w-5 h-5" />
            </button>
          );
        })}
      </nav>

      {/* User Avatar */}
      <div
        onClick={() => router.push('/my-career')}
        className="w-9 h-9 rounded-full cursor-pointer bg-gradient-to-br from-convidera-blue to-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-convidera-blue/30 hover:shadow-convidera-blue/50 transition-shadow"
      >
        {userName?.[0]?.toUpperCase() || '?'}
      </div>
    </header>
  );
}
