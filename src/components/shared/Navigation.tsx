'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, type ReactNode, type ComponentType } from 'react'
import { Menu, X, Compass, BookOpen, Clock, Users, ShieldCheck, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { PlatformRole } from '@prisma/client'

interface NavigationProps {
  userName?: string | null
  platformRole?: PlatformRole
  validationBadge?: ReactNode
}

interface NavItem {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
  roles?: PlatformRole[]
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: Compass },
  { href: '/learning-journey', label: 'Meine Journey', icon: BookOpen },
  { href: '/timeline', label: 'Meine Timeline', icon: Clock },
  { href: '/my-career', label: 'Explore Roles', icon: Users },
  {
    href: '/admin/validations',
    label: 'Validierungen',
    icon: ShieldCheck,
    roles: ['FUNCTIONAL_LEAD', 'ADMIN'],
  },
]

export function Navigation({
  userName,
  platformRole,
  validationBadge,
}: NavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const visibleItems = navItems.filter(
    item => !item.roles || (platformRole && item.roles.includes(platformRole)),
  )

  const initials = userName
    ? userName
        .split(' ')
        .map(p => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U'

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 h-16 z-sticky',
          'bg-canvas-dark text-text-inverse',
          'border-b border-white/5',
        )}
      >
        <div className="h-full max-w-page mx-auto px-4 md:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0"
            aria-label="Career Universe Home"
          >
            <div className="h-8 w-8 rounded-md bg-white/10 flex items-center justify-center">
              <span className="text-text-inverse font-bold text-body-s">c</span>
            </div>
            <span className="hidden sm:inline text-body font-semibold text-text-inverse">
              Career Universe
            </span>
            <span className="hidden sm:inline text-caption text-text-inverse-muted px-1.5 py-0.5 rounded-sm bg-white/10">
              2.0
            </span>
          </Link>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-1">
            {visibleItems.map(item => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'relative inline-flex items-center gap-2 px-3 py-2 rounded-md',
                      'text-body-s font-medium transition-colors',
                      active
                        ? 'text-text-inverse'
                        : 'text-text-inverse-muted hover:text-text-inverse',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.href === '/admin/validations' && validationBadge}
                    {active && (
                      <motion.span
                        layoutId="nav-indicator"
                        className="absolute -bottom-1 left-1/2 h-1 w-1 rounded-pill bg-white -translate-x-1/2"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Right: Avatar (desktop) or Hamburger (mobile) */}
          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              className={cn(
                'hidden md:flex h-9 w-9 rounded-pill bg-brand-blue text-white',
                'items-center justify-center text-body-s font-semibold',
                'hover:opacity-90 transition-opacity',
              )}
              aria-label={`Profile of ${userName ?? 'User'}`}
            >
              {initials}
            </Link>

            <button
              onClick={() => setMobileOpen(true)}
              className={cn(
                'md:hidden h-10 w-10 rounded-md flex items-center justify-center',
                'text-text-inverse hover:bg-white/10 transition-colors',
              )}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-overlay md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className={cn(
                'fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm z-modal md:hidden',
                'bg-canvas-dark text-text-inverse',
                'flex flex-col',
              )}
            >
              <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
                <span className="text-body font-semibold">Menü</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="h-10 w-10 rounded-md flex items-center justify-center hover:bg-white/10"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-2">
                <ul className="space-y-1 px-2">
                  {visibleItems.map(item => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-md',
                            'text-body font-medium transition-colors min-h-[48px]',
                            active
                              ? 'bg-white/10 text-text-inverse'
                              : 'text-text-inverse-muted hover:bg-white/5 hover:text-text-inverse',
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="flex-1">{item.label}</span>
                          {item.href === '/admin/validations' && validationBadge}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div className="p-4 border-t border-white/10 space-y-2">
                <Link
                  href="/profile"
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-md',
                    'hover:bg-white/5 transition-colors min-h-[48px]',
                  )}
                >
                  <div className="h-10 w-10 rounded-pill bg-brand-blue text-white flex items-center justify-center text-body-s font-semibold">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-text-inverse truncate">
                      {userName ?? 'Profil'}
                    </p>
                    {platformRole && (
                      <p className="text-caption text-text-inverse-muted">
                        {platformRole === 'ADMIN'
                          ? 'Admin'
                          : platformRole === 'FUNCTIONAL_LEAD'
                            ? 'Domain Expert'
                            : 'Mitarbeiter'}
                      </p>
                    )}
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-md',
                    'text-body font-medium text-text-inverse-muted hover:bg-white/5 hover:text-text-inverse',
                    'transition-colors min-h-[48px]',
                  )}
                >
                  <LogOut className="h-5 w-5" />
                  Abmelden
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
