'use client';
import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, RefreshCw, Filter } from 'lucide-react';

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
  PENDING: { color: '#EAB308', fillColor: '#EAB308', label: 'Tekshirilmagan', emoji: '🔴' },
  VERIFIED: { color: '#22C55E', fillColor: '#22C55E', label: 'Tasdiqlangan', emoji: '✅' },
  DISPUTED: { color: '#F97316', fillColor: '#F97316', label: 'Munozarali', emoji: '⚠️' },
  FRAUD: { color: '#EF4444', fillColor: '#EF4444', label: 'Firibgarlik', emoji: '🚨' },
};

function LocationButton() {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const locate = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 14, { duration: 1.5 });
        setLocating(false);
      },
      () => setLocating(false),
    );
  };

  return (
    <button
      onClick={locate}
      className="absolute bottom-28 right-4 z-[999] bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-lg"
    >
      <Navigation size={20} className={`text-primary-400 ${locating ? 'animate-spin' : ''}`} />
    </button>
  );
}

export default function MapView() {
  const router = useRouter();
  const [selectedTree, setSelectedTree] = useState<TreeLocation | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);

  const { data: trees = [], refetch, isLoading } = useQuery({
    queryKey: ['map-trees'],
    queryFn: async () => {
      const { data } = await api.get('/trees/map');
      return data as TreeLocation[];
    },
  });

  const filteredTrees = filter ? trees.filter(t => t.status === filter) : trees;

  const handleCapture = (tree: TreeLocation) => {
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {filteredTrees.map((tree) => {
          const config = STATUS_CONFIG[tree.status];
          return (
            <CircleMarker
              key={tree.id}
              center={[tree.lat, tree.lng]}
              radius={tree.status === 'PENDING' ? 10 : 8}
              color={config.color}
              fillColor={config.fillColor}
              fillOpacity={0.8}
              weight={2}
              eventHandlers={{
                click: () => setSelectedTree(tree),
              }}
            >
              <Popup>
                <div className="text-white min-w-[200px]">
                  <div className="font-bold mb-1">
                    {config.emoji} {config.label}
                  </div>
                  <div className="text-sm text-gray-300 mb-1">
                    {tree.region}{tree.district ? `, ${tree.district}` : ''}
                  </div>
                  {tree.species && (
                    <div className="text-sm text-gray-400 mb-1">
                      Turi: {tree.species}
                    </div>
                  )}
                  <div className="text-sm mb-3">
                    <span className="text-yellow-400">Davlat:</span> {tree.stateReportedCount} ta
                    {tree.actualCount !== undefined && (
                      <span className="ml-2 text-green-400">Haqiqat: {tree.actualCount} ta</span>
                    )}
                  </div>
                  {tree.status === 'PENDING' && (
                    <button
                      onClick={() => handleCapture(tree)}
                      className="w-full bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold py-2 px-3 rounded-lg transition-colors"
                    >
                      📸 Tasdiqlash
                    </button>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        <LocationButton />
      </MapContainer>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[999] bg-gray-900 px-4 py-2 rounded-full text-sm text-gray-300 flex items-center gap-2">
          <RefreshCw size={14} className="animate-spin" />
          Yuklanmoqda...
        </div>
      )}

      {/* Stats bar */}
      <div className="absolute top-4 left-4 right-16 z-[999] flex gap-2">
        {Object.entries(STATUS_CONFIG).map(([status, config]) => {
          const count = trees.filter(t => t.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilter(filter === status ? null : status)}
              className={`flex-1 bg-gray-900/90 backdrop-blur-sm rounded-lg py-1.5 text-center border transition-all ${
                filter === status ? 'border-white' : 'border-gray-700'
              }`}
            >
              <div className="text-xs font-bold" style={{ color: config.color }}>{count}</div>
              <div className="text-[10px] text-gray-500">{config.label.split(' ')[0]}</div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="absolute bottom-24 left-4 z-[999] bg-gray-900/90 backdrop-blur-sm rounded-xl p-3 border border-gray-700">
        <p className="text-xs font-semibold text-gray-400 mb-2">Jami: {trees.length} ta joy</p>
        {Object.entries(STATUS_CONFIG).map(([, config]) => (
          <div key={config.label} className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
            {config.label}
          </div>
        ))}
      </div>
    </div>
  );
}
