'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Camera, Trophy, User, Shield, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/auth.store';

const navItems = [
  { href: '/map', icon: Map, label: 'Xarita' },
  { href: '/capture', icon: Camera, label: 'Skanning' },
  { href: '/leaderboard', icon: Trophy, label: 'Reyting' },
  { href: '/quests', icon: Shield, label: 'Vazifalar' },
  { href: '/profile', icon: User, label: 'Profil' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isAdmin = Boolean(user?.isAdmin);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[1200] border-t border-gray-800 bg-gray-900/95 shadow-[0_-12px_32px_rgba(3,7,18,0.65)] backdrop-blur-md bottom-safe">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 min-w-[60px]',
                isActive
                  ? 'text-primary-400 bg-primary-900/30'
                  : 'text-gray-500 hover:text-gray-300',
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-xs font-medium leading-none">{label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-primary-400" />
              )}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/admin"
            className={clsx(
              'flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 min-w-[60px]',
              pathname === '/admin' || pathname.startsWith('/admin/')
                ? 'text-yellow-400 bg-yellow-900/30'
                : 'text-yellow-600 hover:text-yellow-400',
            )}
          >
            <Settings size={22} strokeWidth={pathname === '/admin' ? 2.5 : 1.5} />
            <span className="text-xs font-medium leading-none">Admin</span>
            {(pathname === '/admin' || pathname.startsWith('/admin/')) && (
              <div className="w-1 h-1 rounded-full bg-yellow-400" />
            )}
          </Link>
        )}
      </div>
    </nav>
  );
}
