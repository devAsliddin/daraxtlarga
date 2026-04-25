'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Camera, Trophy, User, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/auth.store';
import { motion } from 'framer-motion';

const LEFT_ITEMS = [
  { href: '/map', icon: Map, label: 'Xarita' },
  { href: '/leaderboard', icon: Trophy, label: 'Reyting' },
];

const RIGHT_ITEMS = [
  { href: '/quests', icon: Settings, label: 'Vazifalar' },
  { href: '/profile', icon: User, label: 'Profil' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isAdmin = Boolean(user?.isAdmin);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const isCaptureActive = pathname === '/capture' || pathname.startsWith('/capture/');

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[1200]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="glass-dark border-t border-white/6 shadow-[0_-8px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-end justify-around px-2 pt-2 pb-3 max-w-lg mx-auto relative">

          {/* Left items */}
          {LEFT_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all duration-200 min-w-[56px]',
                  active ? 'text-primary-400' : 'text-gray-500',
                )}
              >
                <div className="relative">
                  <Icon size={23} strokeWidth={active ? 2.5 : 1.8} />
                  {active && (
                    <motion.div
                      layoutId={`dot-${href}`}
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-400"
                    />
                  )}
                </div>
                <span className={clsx('text-[10px] font-semibold leading-none', active ? 'text-primary-400' : 'text-gray-600')}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* Center capture button */}
          <Link href="/capture" className="flex flex-col items-center -mt-5 px-2">
            <motion.div
              whileTap={{ scale: 0.92 }}
              className={clsx(
                'w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-200',
                isCaptureActive
                  ? 'bg-gradient-to-br from-primary-400 to-primary-600 shadow-primary-900/60 glow-green'
                  : 'bg-gradient-to-br from-primary-500 to-primary-700 shadow-primary-900/40',
              )}
            >
              <Camera size={26} strokeWidth={2} className="text-white" />
            </motion.div>
            <span className={clsx(
              'text-[10px] font-semibold mt-1.5 leading-none',
              isCaptureActive ? 'text-primary-400' : 'text-gray-500',
            )}>
              Skanning
            </span>
          </Link>

          {/* Right items */}
          {RIGHT_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all duration-200 min-w-[56px]',
                  active ? 'text-primary-400' : 'text-gray-500',
                )}
              >
                <div className="relative">
                  <Icon size={23} strokeWidth={active ? 2.5 : 1.8} />
                  {active && (
                    <motion.div
                      layoutId={`dot-${href}`}
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-400"
                    />
                  )}
                </div>
                <span className={clsx('text-[10px] font-semibold leading-none', active ? 'text-primary-400' : 'text-gray-600')}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* Admin — faqat adminlar uchun */}
          {isAdmin && (
            <Link
              href="/admin"
              className={clsx(
                'flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all duration-200 min-w-[48px]',
                isActive('/admin') ? 'text-yellow-400' : 'text-yellow-700',
              )}
            >
              <div className="relative">
                <Settings size={20} strokeWidth={isActive('/admin') ? 2.5 : 1.8} />
              </div>
              <span className="text-[10px] font-semibold leading-none">Admin</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
