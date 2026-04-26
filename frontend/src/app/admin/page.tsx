'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Cpu,
  ExternalLink,
  Eye,
  Image,
  LocateFixed,
  Map,
  MapPinned,
  PlusCircle,
  Sprout,
  Trash2,
  TreePine,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { SWAGGER_URL } from '@/lib/api';
import { UZBEKISTAN_REGIONS } from '@/lib/regions';
import { useAuthStore } from '@/store/auth.store';

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-gray-700 bg-gray-900 flex items-center justify-center" style={{ height: 240 }}>
      <span className="text-gray-500 text-sm">Xarita yuklanmoqda...</span>
    </div>
  ),
});

type TreeStatus = 'PENDING' | 'VERIFIED' | 'DISPUTED' | 'FRAUD';

const EMPTY_FORM = {
  region: '',
  district: '',
  species: '',
  plantationDate: '',
  lat: '',
  lng: '',
  stateReportedCount: '',
  status: 'PENDING' as TreeStatus,
};

function LocationCard({
  location,
  mode,
  onVerify,
  onFraud,
  onReset,
  onDelete,
  isLoading,
  onViewPhoto,
}: {
  location: any;
  mode: 'pending' | 'reviewed';
  onVerify?: (id: string) => void;
  onFraud?: (id: string) => void;
  onReset?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading: boolean;
  onViewPhoto: (photos: string[], index: number) => void;
}) {
  const STATUS_LABELS: Record<string, string> = {
    VERIFIED: '✅ Tasdiqlangan',
    FRAUD: '🚨 Firibgarlik',
    DISPUTED: '⚠️ Munozarali',
    PENDING: '⏳ Kutilmoqda',
  };
  const statusColors: Record<string, string> = {
    VERIFIED: 'bg-green-900/50 text-green-400',
    FRAUD: 'bg-red-900/50 text-red-400',
    DISPUTED: 'bg-orange-900/50 text-orange-400',
    PENDING: 'bg-yellow-900/50 text-yellow-400',
  };
  const borderColor: Record<string, string> = {
    VERIFIED: 'border-l-green-600',
    FRAUD: 'border-l-red-600',
    DISPUTED: 'border-l-orange-500',
    PENDING: 'border-l-blue-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card border-l-4 ${borderColor[location.status] || 'border-l-blue-600'}`}
    >
      <div className="flex items-start justify-between mb-2 gap-3">
        <div>
          <p className="font-semibold text-white text-sm">
            {location.region}{location.district ? `, ${location.district}` : ''}
          </p>
          <p className="text-gray-500 text-xs">
            {location.species || 'Daraxt turi kiritilmagan'} • {location.stateReportedCount} ta
          </p>
          <p className="text-gray-600 text-xs mt-0.5">
            {location.lat?.toFixed(5)}, {location.lng?.toFixed(5)}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${statusColors[location.status] || ''}`}>
          {STATUS_LABELS[location.status] || location.status}
        </span>
      </div>

      {/* Verification info + photos */}
      {location._count?.verifications > 0 && (
        <div className="mb-3">
          <div className="bg-gray-800/50 rounded-lg p-2 mb-2 text-xs text-gray-400">
            <span className="text-gray-300 font-medium">{location._count.verifications}</span> ta tekshiruv
            {location.verifications?.[0] && (
              <span className="ml-2">
                • <span className="text-primary-400">{location.verifications[0].treeCount} daraxt</span>
                , sog'liq: <span className="text-green-400">{location.verifications[0].healthScore}%</span>
                {location.verifications[0].user?.username && (
                  <span className="text-gray-500"> — @{location.verifications[0].user.username}</span>
                )}
              </span>
            )}
          </div>
          {location.verifications?.[0]?.photos?.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <Image size={11} className="text-gray-500" />
                <span className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">
                  Rasmlar ({location.verifications[0].photos.length})
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {location.verifications[0].photos.map((photo: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => onViewPhoto(location.verifications[0].photos, i)}
                    className="flex-shrink-0 relative group"
                  >
                    <img
                      src={photo}
                      alt={`Rasm ${i + 1}`}
                      className="w-20 h-20 rounded-xl object-cover border-2 border-gray-700 group-hover:border-primary-500 transition-colors"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-all flex items-center justify-center">
                      <Eye size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {location._count?.verifications === 0 && (
        <div className="bg-gray-800/50 rounded-lg p-2 mb-3 text-xs text-gray-500">
          Hali hech kim tekshirmagan
        </div>
      )}

      {/* Actions */}
      {mode === 'pending' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => onVerify?.(location.id)}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-green-900/30 border border-green-700 text-green-400 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
            >
              <TreePine size={14} />
              ✅ Tasdiqlash (GT berish)
            </button>
            <button
              onClick={() => onFraud?.(location.id)}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-red-900/30 border border-red-700 text-red-400 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
            >
              <XCircle size={14} />
              🚨 Rad etish
            </button>
          </div>
          <button
            onClick={() => {
              if (confirm('Bu joylashuvni o\'chirmoqchimisiz?')) onDelete?.(location.id);
            }}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-1 py-2 bg-gray-800/60 border border-gray-700 text-gray-500 rounded-xl text-xs font-medium active:scale-95 transition-transform"
          >
            <Trash2 size={13} />
            O'chirish
          </button>
        </div>
      )}

      {mode === 'reviewed' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className={`flex-1 text-center py-2 rounded-xl text-xs font-bold ${
              location.status === 'VERIFIED'
                ? 'bg-green-900/20 text-green-400'
                : 'bg-red-900/20 text-red-400'
            }`}>
              {STATUS_LABELS[location.status] || location.status}
            </div>
            <button
              onClick={() => onReset?.(location.id)}
              disabled={isLoading}
              className="flex items-center gap-1 px-3 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl text-xs font-semibold active:scale-95 transition-transform"
            >
              <AlertTriangle size={13} />
              Qaytarish
            </button>
          </div>
          <button
            onClick={() => {
              if (confirm('Bu joylashuvni o\'chirmoqchimisiz?')) onDelete?.(location.id);
            }}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-1 py-2 bg-gray-800/60 border border-gray-700 text-gray-500 rounded-xl text-xs font-medium active:scale-95 transition-transform"
          >
            <Trash2 size={13} />
            O'chirish
          </button>
        </div>
      )}
    </motion.div>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return 'Noma`lum';
  }

  return new Date(value).toLocaleString('uz-UZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [isLocating, setIsLocating] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [photoViewer, setPhotoViewer] = useState<{ photos: string[]; index: number } | null>(null);

  const isAdmin = Boolean(user?.isAdmin || user?.username === 'admin');

  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/map');
    }
  }, [isAdmin, router, user]);

  const { data: dashboard } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/admin/dashboard');
      return data;
    },
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  const { data: reports } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data } = await api.get('/admin/reports/pending');
      return data;
    },
    enabled: isAdmin,
  });

  const { data: ollamaStatus } = useQuery({
    queryKey: ['ollama-status'],
    queryFn: async () => {
      const { data } = await api.get('/admin/ollama-status');
      return data;
    },
    enabled: isAdmin,
  });

  const [tab, setTab] = useState<'pending' | 'reviewed'>('pending');

  const { data: locationsForReview } = useQuery({
    queryKey: ['admin-locations-review'],
    queryFn: async () => {
      const { data } = await api.get('/admin/tree-locations/review');
      return data;
    },
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  const { data: reviewedLocations } = useQuery({
    queryKey: ['admin-locations-reviewed'],
    queryFn: async () => {
      const { data } = await api.get('/admin/tree-locations/reviewed');
      return data;
    },
    enabled: isAdmin && tab === 'reviewed',
    refetchInterval: 30000,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'CONFIRMED' | 'REJECTED' }) => {
      await api.patch(`/admin/reports/${id}/review`, { action });
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      toast.success(action === 'CONFIRMED' ? 'Hisobot tasdiqlandi' : 'Hisobot rad etildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Hisobotni yangilashda xatolik');
    },
  });

  const reviewLocationMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'VERIFIED' | 'FRAUD' }) => {
      await api.patch(`/admin/tree-locations/${id}/review`, { action });
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-locations-review'] });
      queryClient.invalidateQueries({ queryKey: ['admin-locations-reviewed'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['map-trees'] });
      toast.success(action === 'VERIFIED' ? '✅ Tasdiqlandi — GT tokenlar foydalanuvchiga berildi!' : '🚨 Rad etildi — joylashuv xaritadan olib tashlandi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Joylashuvni yangilashda xatolik');
    },
  });

  const resetLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/admin/tree-locations/${id}/reset`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-locations-review'] });
      queryClient.invalidateQueries({ queryKey: ['admin-locations-reviewed'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['map-trees'] });
      toast.success('Qayta ko\'rib chiqishga qaytarildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Xatolik');
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/tree-locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-locations-review'] });
      queryClient.invalidateQueries({ queryKey: ['admin-locations-reviewed'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['map-trees'] });
      toast.success('Joylashuv o\'chirildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'O\'chirishda xatolik');
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        region: form.region,
        district: form.district || undefined,
        species: form.species || undefined,
        plantationDate: form.plantationDate || undefined,
        lat: Number(form.lat),
        lng: Number(form.lng),
        stateReportedCount: Number(form.stateReportedCount),
        status: form.status,
      };

      const { data } = await api.post('/admin/tree-locations', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['map-trees'] });
      setForm(EMPTY_FORM);
      toast.success('Yangi daraxt joylashuvi qo`shildi');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message;
      toast.error(Array.isArray(message) ? message[0] : message || 'Joylashuvni qo`shib bo`lmadi');
    },
  });

  const fillCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Brauzer geolokatsiyani qo`llamaydi');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
        }));
        setIsLocating(false);
      },
      () => {
        toast.error('Joylashuvni olib bo`lmadi');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-8">
      {/* Photo Viewer Modal */}
      {photoViewer && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
          onClick={() => setPhotoViewer(null)}
        >
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900/80">
            <span className="text-white text-sm font-semibold">
              Rasm {photoViewer.index + 1} / {photoViewer.photos.length}
            </span>
            <button
              className="text-gray-400 hover:text-white p-2"
              onClick={() => setPhotoViewer(null)}
            >
              <X size={24} />
            </button>
          </div>
          <div
            className="flex-1 flex items-center justify-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photoViewer.photos[photoViewer.index]}
              alt="Verification photo"
              className="max-h-full max-w-full object-contain"
            />
            {photoViewer.photos.length > 1 && (
              <>
                <button
                  className="absolute left-2 bg-black/60 rounded-full p-2 text-white"
                  onClick={() => setPhotoViewer(v => v && { ...v, index: (v.index - 1 + v.photos.length) % v.photos.length })}
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  className="absolute right-2 bg-black/60 rounded-full p-2 text-white"
                  onClick={() => setPhotoViewer(v => v && { ...v, index: (v.index + 1) % v.photos.length })}
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-4 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={() => router.back()} className="text-gray-400">
          <ArrowLeft size={24} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-black text-xl text-white">Admin Panel</h1>
          <p className="text-xs text-gray-500">Daraxt nuqtalari va audit boshqaruvi</p>
        </div>
        <a
          href={SWAGGER_URL}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-primary-800/60 bg-primary-900/30 px-3 py-2 text-xs font-bold text-primary-300 active:scale-95 transition-transform"
        >
          Swagger
          <ExternalLink size={14} />
        </a>
      </header>

      <div className="p-4 space-y-6">
        {dashboard && (
          <section>
            <h2 className="font-bold text-gray-300 mb-3">Umumiy ko'rsatkichlar</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: <Users size={20} className="text-blue-400" />,
                  label: 'Foydalanuvchilar',
                  value: dashboard.overview.totalUsers,
                },
                {
                  icon: <TreePine size={20} className="text-primary-400" />,
                  label: 'Daraxt joylari',
                  value: dashboard.overview.totalTrees,
                },
                {
                  icon: <CheckCircle size={20} className="text-green-400" />,
                  label: 'Tekshiruvlar',
                  value: dashboard.overview.totalVerifications,
                },
                {
                  icon: <AlertTriangle size={20} className="text-red-400" />,
                  label: 'Kutilgan hisobotlar',
                  value: dashboard.overview.pendingReports,
                },
              ].map((stat) => (
                <div key={stat.label} className="card">
                  <div className="flex items-center gap-2 mb-1">
                    {stat.icon}
                    <span className="text-gray-400 text-sm">{stat.label}</span>
                  </div>
                  <div className="text-3xl font-black text-white">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="card mt-3">
              <h3 className="font-semibold text-gray-300 mb-3">Joylashuvlar holati</h3>
              <div className="space-y-2">
                {Object.entries(dashboard.treesByStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span
                      className={`text-sm ${
                        status === 'VERIFIED'
                          ? 'text-green-400'
                          : status === 'FRAUD'
                            ? 'text-red-400'
                            : status === 'DISPUTED'
                              ? 'text-orange-400'
                              : 'text-yellow-400'
                      }`}
                    >
                      {{ VERIFIED: '✅ Tasdiqlangan', FRAUD: '🚨 Firibgarlik', DISPUTED: '⚠️ Munozarali', PENDING: '⏳ Kutilmoqda' }[status] || status}
                    </span>
                    <span className="font-bold text-white">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="card">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="font-semibold text-gray-100">Yangi daraxt joylashuvi</h2>
              <p className="text-sm text-gray-500">
                Admin shu yerdan daraxt ekilgan nuqtani xaritaga qo'shadi.
              </p>
            </div>
            <MapPinned size={18} className="text-primary-400 mt-1" />
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Viloyat</label>
              <select
                className="input"
                value={form.region}
                onChange={(event) => setForm((current) => ({ ...current, region: event.target.value }))}
              >
                <option value="">Viloyatni tanlang</option>
                {UZBEKISTAN_REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Tuman</label>
                <input
                  className="input"
                  value={form.district}
                  onChange={(event) => setForm((current) => ({ ...current, district: event.target.value }))}
                  placeholder="Masalan, Chilonzor"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Daraxt turi</label>
                <div className="relative">
                  <Sprout size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    className="input pl-11"
                    value={form.species}
                    onChange={(event) => setForm((current) => ({ ...current, species: event.target.value }))}
                    placeholder="Masalan, Chinor"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Latitude</label>
                <input
                  className="input"
                  type="number"
                  step="0.000001"
                  value={form.lat}
                  onChange={(event) => setForm((current) => ({ ...current, lat: event.target.value }))}
                  placeholder="41.299500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Longitude</label>
                <input
                  className="input"
                  type="number"
                  step="0.000001"
                  value={form.lng}
                  onChange={(event) => setForm((current) => ({ ...current, lng: event.target.value }))}
                  placeholder="69.240100"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={fillCurrentLocation} className="btn-secondary flex-1" type="button">
                <LocateFixed size={16} className={isLocating ? 'animate-spin' : ''} />
                {isLocating ? 'Olinmoqda...' : 'Joriy joylashuv'}
              </button>
              <button
                onClick={() => setShowMapPicker(v => !v)}
                className={`btn-secondary flex-1 ${showMapPicker ? 'border-primary-600 text-primary-400' : ''}`}
                type="button"
              >
                <Map size={16} />
                Xaritadan tanlash
              </button>
            </div>

            {showMapPicker && (
              <LocationPicker
                lat={form.lat ? Number(form.lat) : undefined}
                lng={form.lng ? Number(form.lng) : undefined}
                onPick={(lat, lng) => {
                  setForm(current => ({
                    ...current,
                    lat: lat.toFixed(6),
                    lng: lng.toFixed(6),
                  }));
                }}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Daraxt soni</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  value={form.stateReportedCount}
                  onChange={(event) => setForm((current) => ({ ...current, stateReportedCount: event.target.value }))}
                  placeholder="50"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Holat</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as TreeStatus }))}
                >
                  <option value="PENDING">⏳ Kutilmoqda</option>
                  <option value="VERIFIED">✅ Tasdiqlangan</option>
                  <option value="DISPUTED">⚠️ Munozarali</option>
                  <option value="FRAUD">🚨 Firibgarlik</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Ekilgan sana</label>
                <input
                  className="input"
                  type="date"
                  value={form.plantationDate}
                  onChange={(event) => setForm((current) => ({ ...current, plantationDate: event.target.value }))}
                />
              </div>
            </div>

            <button
              onClick={() => {
                if (!form.region || !form.lat || !form.lng || !form.stateReportedCount) {
                  toast.error('Viloyat, koordinatalar va daraxt soni majburiy');
                  return;
                }
                createLocationMutation.mutate();
              }}
              disabled={createLocationMutation.isPending}
              className="btn-primary w-full"
              type="button"
            >
              <PlusCircle size={16} />
              {createLocationMutation.isPending ? 'Qo`shilmoqda...' : 'Location qo`shish'}
            </button>
          </div>
        </section>

        {dashboard?.recentTreeLocations?.length > 0 && (
          <section>
            <h2 className="font-bold text-gray-300 mb-3">So'nggi qo'shilgan joylar</h2>
            <div className="space-y-2">
              {dashboard.recentTreeLocations.map((location: any) => (
                <div key={location.id} className="card py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        {location.region}
                        {location.district ? `, ${location.district}` : ''}
                      </p>
                      <p className="text-sm text-gray-500">
                        {location.species || 'Daraxt turi kiritilmagan'}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300">
                      {location.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-400">
                    <span>{location.stateReportedCount} ta daraxt</span>
                    <span className="text-right">{formatDate(location.createdAt)}</span>
                    <span>{location.lat.toFixed(4)}</span>
                    <span className="text-right">{location.lng.toFixed(4)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {ollamaStatus && (
          <section className="card">
            <div className="flex items-center gap-2 mb-2">
              <Cpu size={16} className={ollamaStatus.available ? 'text-green-400' : 'text-red-400'} />
              <h3 className="font-semibold text-gray-200">Ollama AI holati</h3>
              <span
                className={`ml-auto text-xs px-2 py-1 rounded-full ${
                  ollamaStatus.available
                    ? 'bg-green-900/50 text-green-400'
                    : 'bg-red-900/50 text-red-400'
                }`}
              >
                {ollamaStatus.available ? 'Online' : 'Offline'}
              </span>
            </div>
            {ollamaStatus.models?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {ollamaStatus.models.map((model: string) => (
                  <span key={model} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                    {model}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {/* === TEKSHIRISH SECTION === */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Eye size={18} className="text-blue-400" />
            <h2 className="font-bold text-gray-300">Joylashuvlarni ko'rib chiqish</h2>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-gray-900 rounded-2xl p-1">
            <button
              onClick={() => setTab('pending')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === 'pending'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ⏳ Kutilmoqda ({locationsForReview?.total || 0})
            </button>
            <button
              onClick={() => setTab('reviewed')}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === 'reviewed'
                  ? 'bg-gray-700 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ✅ Ko'rib chiqilgan ({reviewedLocations?.total || '...'})
            </button>
          </div>

          {/* PENDING tab */}
          {tab === 'pending' && (
            <div className="space-y-3">
              {locationsForReview?.items?.map((location: any) => (
                <LocationCard
                  key={location.id}
                  location={location}
                  mode="pending"
                  onVerify={(id) => reviewLocationMutation.mutate({ id, action: 'VERIFIED' })}
                  onFraud={(id) => reviewLocationMutation.mutate({ id, action: 'FRAUD' })}
                  onDelete={(id) => deleteLocationMutation.mutate(id)}
                  isLoading={reviewLocationMutation.isPending || deleteLocationMutation.isPending}
                  onViewPhoto={(photos, i) => setPhotoViewer({ photos, index: i })}
                />
              ))}
              {!locationsForReview?.items?.length && (
                <div className="text-center py-8 text-gray-500 card">
                  <div className="text-4xl mb-2">✓</div>
                  <p>Tasdiqlashni kutayotgan joylashuv yo'q</p>
                </div>
              )}
            </div>
          )}

          {/* REVIEWED tab */}
          {tab === 'reviewed' && (
            <div className="space-y-3">
              {reviewedLocations?.items?.map((location: any) => (
                <LocationCard
                  key={location.id}
                  location={location}
                  mode="reviewed"
                  onReset={(id) => resetLocationMutation.mutate(id)}
                  onDelete={(id) => deleteLocationMutation.mutate(id)}
                  isLoading={resetLocationMutation.isPending || deleteLocationMutation.isPending}
                  onViewPhoto={(photos, i) => setPhotoViewer({ photos, index: i })}
                />
              ))}
              {!reviewedLocations?.items?.length && (
                <div className="text-center py-8 text-gray-500 card">
                  <div className="text-4xl mb-2">📋</div>
                  <p>Ko'rib chiqilgan joylashuvlar yo'q</p>
                </div>
              )}
            </div>
          )}
        </section>

        <section>
          <h2 className="font-bold text-gray-300 mb-3">
            Kutilayotgan hisobotlar ({reports?.total || 0})
          </h2>
          <div className="space-y-3">
            {reports?.items?.map((report: any) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card border-l-4 border-l-red-600"
              >
                <div className="flex items-start justify-between mb-2 gap-3">
                  <div>
                    <p className="font-semibold text-white text-sm">
                      {report.treeLocation?.region}, {report.treeLocation?.district}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {report.reporter?.username} | {formatDate(report.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      report.severity === 'HIGH'
                        ? 'bg-red-900/50 text-red-400'
                        : report.severity === 'MEDIUM'
                          ? 'bg-orange-900/50 text-orange-400'
                          : 'bg-yellow-900/50 text-yellow-400'
                    }`}
                  >
                    {report.severity}
                  </span>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => reviewMutation.mutate({ id: report.id, action: 'CONFIRMED' })}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-900/30 border border-green-700 text-green-400 rounded-xl text-sm font-medium"
                  >
                    <CheckCircle size={14} />
                    Tasdiqlash
                  </button>
                  <button
                    onClick={() => reviewMutation.mutate({ id: report.id, action: 'REJECTED' })}
                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-900/30 border border-red-700 text-red-400 rounded-xl text-sm font-medium"
                  >
                    <XCircle size={14} />
                    Rad etish
                  </button>
                </div>
              </motion.div>
            ))}

            {!reports?.items?.length && (
              <div className="text-center py-8 text-gray-500 card">
                <div className="text-4xl mb-2">OK</div>
                <p>Barcha hisobotlar ko'rib chiqilgan</p>
              </div>
            )}
          </div>
        </section>

        {dashboard?.recentActivity?.length > 0 && (
          <section>
            <h2 className="font-bold text-gray-300 mb-3">So'nggi faollik</h2>
            <div className="space-y-2">
              {dashboard.recentActivity.map((activity: any) => (
                <div key={activity.id} className="card flex items-center justify-between py-2 px-3">
                  <div>
                    <p className="text-sm text-white">{activity.user?.username}</p>
                    <p className="text-xs text-gray-500">
                      {activity.treeLocation?.region} | {formatDate(activity.createdAt)}
                    </p>
                  </div>
                  <span className="text-primary-400 text-xs font-bold">+{activity.tokensEarned} GT</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
