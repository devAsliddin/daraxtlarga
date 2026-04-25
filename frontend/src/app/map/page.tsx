'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { BottomNav } from '@/components/ui/BottomNav';

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-gray-950 h-screen">
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
  return (
    <div className="h-screen w-full relative bg-gray-950">
      <Suspense>
        <MapView />
      </Suspense>
      <BottomNav />
    </div>
  );
}
