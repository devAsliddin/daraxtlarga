'use client';
import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, RefreshCw, Camera, X, MapPin, TreePine, AlertTriangle, Leaf, Coins } from 'lucide-react';
import { useMapStore } from '@/store/map.store';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';

interface TreeLocation {
  id: string;
  lat: number;
  lng: number;
  status: 'PENDING' | 'VERIFIED' | 'DISPUTED' | 'FRAUD';
  stateReportedCount: number;
  actualCount?: number;
  region: string;
  district?: string;
  species?: string;
}

const STATUS_CONFIG = {
  PENDING:  { color: '#EAB308', label: 'Tekshirilmagan', emoji: '🟡' },
  VERIFIED: { color: '#22C55E', label: 'Tasdiqlangan',   emoji: '✅' },
  DISPUTED: { color: '#F97316', label: 'Munozarali',     emoji: '⚠️' },
  FRAUD:    { color: '#EF4444', label: 'Firibgarlik',    emoji: '🚨' },
};

// Haversine masofasi (metr)
function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function LocationButton({ onLocate }: { onLocate: (lat: number, lng: number) => void }) {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const locate = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 1.5 });
        onLocate(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <button
      onClick={locate}
      className="absolute bottom-32 right-4 z-[999] bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-lg active:scale-95 transition-transform"
    >
      <Navigation size={20} className={`text-primary-400 ${locating ? 'animate-spin' : ''}`} />
    </button>
  );
}

export default function MapView() {
  const router = useRouter();
  const { setSelectedTree: rememberSelectedTree, setUserLocation } = useMapStore();
  const { user } = useAuthStore();
  const [selectedTree, setSelectedTree] = useState<TreeLocation | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const CAPTURE_RADIUS_M = 500; // 500 metr radius

  const { data: trees = [], refetch, isLoading } = useQuery({
    queryKey: ['map-trees'],
    queryFn: async () => {
      const { data } = await api.get('/trees/map');
      return data as TreeLocation[];
    },
  });

  // Foydalanuvchi joylashuvini avtomatik olish
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserPos(nextPos);
        setUserLocation(nextPos);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }, [setUserLocation]);

  const filteredTrees = filter ? trees.filter(t => t.status === filter) : trees;

  const getDistance = (tree: TreeLocation) => {
    if (!userPos) return null;
    return getDistanceMeters(userPos.lat, userPos.lng, tree.lat, tree.lng);
  };

  const canCapture = (tree: TreeLocation) => {
    const d = getDistance(tree);
    // Agar joylashuv olinmagan bo'lsa ham tasdiqlashga ruxsat (demo uchun)
    if (d === null) return true;
    return d <= CAPTURE_RADIUS_M;
  };

  const formatDistance = (m: number) => {
    if (m < 1000) return `${Math.round(m)} m`;
    return `${(m / 1000).toFixed(1)} km`;
  };

  const handleCapture = (tree: TreeLocation) => {
    rememberSelectedTree(tree.id);
    localStorage.setItem('yq:selected-tree', JSON.stringify({
      id: tree.id,
      lat: tree.lat,
      lng: tree.lng,
      status: tree.status,
    }));
    router.push(`/capture?treeId=${tree.id}&lat=${tree.lat}&lng=${tree.lng}`);
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[41.2995, 69.2401]}
        zoom={12}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />

        {filteredTrees.map((tree) => {
          const config = STATUS_CONFIG[tree.status];
          const isSelected = selectedTree?.id === tree.id;
          return (
            <CircleMarker
              key={tree.id}
              center={[tree.lat, tree.lng]}
              radius={isSelected ? 14 : (tree.status === 'PENDING' ? 10 : 8)}
              color={isSelected ? '#ffffff' : config.color}
              fillColor={config.color}
              fillOpacity={isSelected ? 1 : 0.8}
              weight={isSelected ? 3 : 2}
              eventHandlers={{
                click: () => {
                  setSelectedTree(tree);
                  rememberSelectedTree(tree.id);
                  localStorage.setItem('yq:selected-tree', JSON.stringify({
                    id: tree.id,
                    lat: tree.lat,
                    lng: tree.lng,
                    status: tree.status,
                  }));
                },
              }}
            />
          );
        })}

        <LocationButton onLocate={(lat, lng) => {
          const nextPos = { lat, lng };
          setUserPos(nextPos);
          setUserLocation(nextPos);
        }} />
      </MapContainer>

      {/* Loading */}
      {isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[999] bg-gray-900 px-4 py-2 rounded-full text-sm text-gray-300 flex items-center gap-2">
          <RefreshCw size={14} className="animate-spin" />
          Yuklanmoqda...
        </div>
      )}

      {/* Top overlay — logo + tokens + status filters */}
      <div
        className="absolute top-0 left-0 right-0 z-[999]"
        style={{ background: 'linear-gradient(to bottom, rgba(3,7,3,0.92) 70%, transparent)' }}
      >
        {/* Header row: logo + token */}
        <div
          className="flex items-center justify-between px-4 pb-1"
          style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Leaf size={14} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-black text-white text-sm leading-none">Yashil Quest</span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/profile">
                <div className="flex items-center gap-1.5 bg-primary-900/50 px-3 py-1.5 rounded-full border border-primary-800/60 active:scale-95 transition-transform">
                  <Coins size={12} className="text-primary-400" />
                  <span className="text-primary-300 font-bold text-xs">{Math.floor(user.totalTokens)} GT</span>
                </div>
              </Link>
            ) : (
              <Link href="/auth/login" className="text-xs text-primary-400 font-semibold px-3 py-1.5 rounded-full border border-primary-800/60 bg-primary-900/50">
                Kirish
              </Link>
            )}
          </div>
        </div>

        {/* Status filter buttons */}
        <div className="flex gap-1.5 px-3 pt-1 pb-2">
          {Object.entries(STATUS_CONFIG).map(([status, config]) => {
            const count = trees.filter(t => t.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setFilter(filter === status ? null : status)}
                className={`flex-1 rounded-xl py-2 text-center border transition-all active:scale-95 ${
                  filter === status
                    ? 'border-white/40 bg-white/10'
                    : 'border-white/10 bg-gray-900/80'
                }`}
                style={{ backdropFilter: 'blur(12px)' }}
              >
                <div className="text-sm font-black" style={{ color: config.color }}>{count}</div>
                <div className="text-[9px] text-gray-400 truncate px-0.5 leading-tight">{config.label.split(' ')[0]}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-24 left-3 z-[999] bg-gray-900/90 backdrop-blur-sm rounded-xl p-3 border border-gray-700/60">
        <p className="text-xs font-semibold text-gray-400 mb-2">Jami: {trees.length} ta joy</p>
        {Object.entries(STATUS_CONFIG).map(([, config]) => (
          <div key={config.label} className="flex items-center gap-2 text-xs text-gray-400 mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: config.color }} />
            {config.label}
          </div>
        ))}
      </div>

      {/* === TREE DETAIL BOTTOM SHEET === */}
      <AnimatePresence>
        {selectedTree && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[1000]"
              onClick={() => setSelectedTree(null)}
            />

            {/* Bottom sheet — kompakt, scroll yo'q */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="absolute bottom-[180px] left-3 right-3 z-[1001] rounded-2xl"
              style={{ background: 'rgba(13,18,13,0.98)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 -8px 40px rgba(0,0,0,0.6)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center pt-2 pb-0">
                <div className="w-8 h-1 rounded-full bg-gray-700" />
              </div>

              <div className="px-4 pt-2 pb-4">
                {/* Header row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{
                        color: STATUS_CONFIG[selectedTree.status].color,
                        background: STATUS_CONFIG[selectedTree.status].color + '25',
                        border: `1px solid ${STATUS_CONFIG[selectedTree.status].color}44`,
                      }}
                    >
                      {STATUS_CONFIG[selectedTree.status].emoji} {STATUS_CONFIG[selectedTree.status].label}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedTree(null)}
                    className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center"
                  >
                    <X size={14} className="text-gray-400" />
                  </button>
                </div>

                {/* Location + count row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-gray-300 text-sm">
                    <MapPin size={12} className="text-gray-500 flex-shrink-0" />
                    <span className="truncate">{selectedTree.region}{selectedTree.district ? `, ${selectedTree.district}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                    <TreePine size={13} className="text-primary-400" />
                    <span className="text-white font-bold text-sm">{selectedTree.stateReportedCount} ta</span>
                    {selectedTree.actualCount !== undefined && (
                      <span className="text-green-400 font-bold text-sm">/ {selectedTree.actualCount}</span>
                    )}
                  </div>
                </div>

                {/* Distance strip */}
                {userPos && (() => {
                  const dist = getDistance(selectedTree)!;
                  const close = dist <= CAPTURE_RADIUS_M;
                  return (
                    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 mb-3 ${
                      close ? 'bg-primary-900/40 border border-primary-800/50' : 'bg-orange-900/30 border border-orange-800/40'
                    }`}>
                      <Navigation size={13} className={close ? 'text-primary-400' : 'text-orange-400'} />
                      <span className={`text-xs font-medium ${close ? 'text-primary-300' : 'text-orange-300'}`}>
                        {close ? `${formatDistance(dist)} — Yaqindasiz ✓` : `${formatDistance(dist)} uzoqda — Yaqinlashing`}
                      </span>
                    </div>
                  );
                })()}

                {/* Action button */}
                {(selectedTree.status === 'PENDING' || selectedTree.status === 'DISPUTED') ? (
                  canCapture(selectedTree) ? (
                    <button
                      onClick={() => handleCapture(selectedTree)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm active:scale-95 transition-transform"
                      style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 16px rgba(34,197,94,0.3)' }}
                    >
                      <Camera size={18} />
                      Tasdiqlash — Rasm olish
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-800/80 border border-gray-700">
                      <AlertTriangle size={16} className="text-orange-400" />
                      <span className="text-gray-400 text-xs">500m radius ichida keling</span>
                    </div>
                  )
                ) : (
                  <div className="w-full text-center py-2.5 rounded-xl bg-gray-800/60 text-gray-400 text-xs">
                    {selectedTree.status === 'VERIFIED' ? '✅ Bu joy allaqachon tasdiqlangan' : '🚨 Firibgarlik sifatida belgilangan'}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
