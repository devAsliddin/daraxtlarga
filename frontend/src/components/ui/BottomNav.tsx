'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Camera, Trophy, User, Settings, ListChecks } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/auth.store';
import { motion } from 'framer-motion';

const LEFT_ITEMS = [
  { href: '/map', icon: Map, label: 'Xarita' },
  { href: '/leaderboard', icon: Trophy, label: 'Reyting' },
];

const RIGHT_ITEMS = [
  { href: '/quests', icon: ListChecks, label: 'Vazifalar' },
  { href: '/profile', icon: User, label: 'Profil' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isAdmin = Boolean(user?.isAdmin);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const isCaptureActive = pathname === '/capture' || pathname.startsWith('/capture/');

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className="flex flex-col items-center gap-1 py-2 flex-1 transition-all duration-200 active:scale-95"
      >
        <div className={clsx(
          'relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200',
          active ? 'bg-primary-500/20' : 'bg-transparent',
        )}>
          <Icon
            size={22}
            strokeWidth={active ? 2.5 : 1.8}
            className={active ? 'text-primary-400' : 'text-gray-500'}
          />
          {active && (
            <motion.div
              layoutId="nav-indicator"
              className="absolute inset-0 rounded-2xl ring-1 ring-primary-500/40"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </div>
        <span className={clsx(
          'text-[10px] font-semibold leading-none',
          active ? 'text-primary-400' : 'text-gray-500',
        )}>
          {label}
        </span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[1200]">
      <div
        className="border-t border-white/[0.07] shadow-[0_-4px_30px_rgba(0,0,0,0.6)]"
        style={{
          background: 'rgba(10,14,10,0.97)',
          backdropFilter: 'blur(20px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-end justify-around px-1 pt-1 pb-3 max-w-lg mx-auto relative">

          {LEFT_ITEMS.map((item) => <NavItem key={item.href} {...item} />)}

          {/* Center capture button */}
          <Link href="/capture" className="flex flex-col items-center flex-1 -mt-4 active:scale-95 transition-transform duration-150">
            <motion.div
              whileTap={{ scale: 0.90 }}
              className={clsx(
                'w-[58px] h-[58px] rounded-full flex items-center justify-center shadow-2xl',
                isCaptureActive
                  ? 'bg-gradient-to-br from-primary-400 to-primary-600 shadow-primary-900/70'
                  : 'bg-gradient-to-br from-primary-500 to-primary-700 shadow-primary-900/50',
              )}
              style={{ boxShadow: '0 0 20px rgba(34,197,94,0.35), 0 8px 24px rgba(0,0,0,0.4)' }}
            >
              <Camera size={24} strokeWidth={2.2} className="text-white" />
            </motion.div>
            <span className={clsx(
              'text-[10px] font-semibold mt-1 leading-none',
              isCaptureActive ? 'text-primary-400' : 'text-gray-500',
            )}>
              Skanning
            </span>
          </Link>

          {RIGHT_ITEMS.map((item) => <NavItem key={item.href} {...item} />)}

          {/* Admin */}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex flex-col items-center gap-1 py-2 flex-1 transition-all duration-200 active:scale-95"
            >
              <div className={clsx(
                'flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200',
                isActive('/admin') ? 'bg-yellow-500/20' : 'bg-transparent',
              )}>
                <Settings size={22} strokeWidth={isActive('/admin') ? 2.5 : 1.8}
                  className={isActive('/admin') ? 'text-yellow-400' : 'text-yellow-700'} />
              </div>
              <span className={clsx('text-[10px] font-semibold leading-none',
                isActive('/admin') ? 'text-yellow-400' : 'text-yellow-700')}>Admin</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
