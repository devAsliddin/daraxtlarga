'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { BottomNav } from '@/components/ui/BottomNav';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { Coins, Leaf } from 'lucide-react';

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="text-6xl mb-4 animate-bounce">🗺️</div>
        <p className="text-gray-400 font-medium">Xarita yuklanmoqda...</p>
        <div className="flex gap-1 justify-center mt-3">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const { user } = useAuthStore();

  return (
    <div className="h-screen flex flex-col bg-gray-950 safe-top">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 glass-dark border-b border-white/6 z-40 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-900/50">
            <Leaf size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-black text-white text-base leading-none">Yashil Quest</span>
            <p className="text-primary-500 text-[10px] font-medium leading-none mt-0.5">Daraxt xaritasi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <Link href="/profile">
              <div className="flex items-center gap-1.5 bg-primary-900/40 px-3 py-1.5 rounded-full border border-primary-800/60 active:scale-95 transition-transform">
                <Coins size={13} className="text-primary-400" />
                <span className="text-primary-300 font-bold text-sm">
                  {Math.floor(user.totalTokens)} GT
                </span>
              </div>
            </Link>
          ) : (
            <Link href="/auth/login" className="btn-primary py-1.5 px-3 text-sm">
              Kirish
            </Link>
          )}
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        <Suspense>
          <MapView />
        </Suspense>
      </div>

      {/* Bottom nav */}
      <BottomNav />
    </div>
  );
}
