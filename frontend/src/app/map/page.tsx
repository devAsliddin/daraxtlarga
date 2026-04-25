'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { BottomNav } from '@/components/ui/BottomNav';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { Coins, Menu } from 'lucide-react';

// Load map only client-side (Leaflet requires window)
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-950">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-bounce">🗺️</div>
        <p className="text-gray-400">Xarita yuklanmoqda...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const { user } = useAuthStore();

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-gray-900/95 backdrop-blur-md border-b border-gray-800 z-40 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌲</span>
          <span className="font-bold text-white">Yashil Quest</span>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-1.5 bg-primary-900/40 px-3 py-1.5 rounded-full border border-primary-800">
              <Coins size={14} className="text-primary-400" />
              <span className="text-primary-300 font-bold text-sm">
                {Math.floor(user.totalTokens)} GT
              </span>
            </div>
          )}
          {!user && (
            <Link href="/auth/login" className="btn-primary py-1.5 px-3 text-sm">
              Kirish
            </Link>
          )}
        </div>
      </header>

      {/* Map - takes remaining space */}
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
