'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  ChevronRight,
  Coins,
  LogOut,
  MapPin,
  Phone,
  Save,
  Shield,
  TreePine,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { BottomNav } from '@/components/ui/BottomNav';
import { UZBEKISTAN_REGIONS } from '@/lib/regions';
import { useAuthStore } from '@/store/auth.store';

const LEVEL_TITLES = [
  '',
  "Yangi Ekolog",
  "Daraxt Do'sti",
  'Yashil Faol',
  'Eco Warrior',
  "Tabiat Qo'riqchisi",
  'Yashil Muhandis',
  'Ekologiya Ustasi',
  'Milliy Qahramon',
  'Yashil Legend',
  'Super Eco',
];

function formatDate(value?: string) {
  if (!value) {
    return 'Noma`lum';
  }

  return new Date(value).toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout, setUser } = useAuthStore();
  const [form, setForm] = useState({ region: '', phone: '' });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/profile');
      return data;
    },
    enabled: !!user,
  });

  const { data: tokenHistory } = useQuery({
    queryKey: ['token-history'],
    queryFn: async () => {
      const { data } = await api.get('/tokens/history?limit=5');
      return data;
    },
    enabled: !!user,
  });

  const { data: verificationHistory } = useQuery({
    queryKey: ['profile-verifications'],
    queryFn: async () => {
      const { data } = await api.get('/trees/user/verifications?limit=4');
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        region: profile.region || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        region: form.region || undefined,
        phone: form.phone || undefined,
      };

      const { data } = await api.patch('/users/profile', payload);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (user) {
        setUser({
          ...user,
          region: data.region,
          phone: data.phone,
          avatarUrl: data.avatarUrl,
          isAdmin: data.isAdmin ?? user.isAdmin,
        });
      }
      toast.success('Profil yangilandi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Profilni saqlashda xatolik');
    },
  });

  const handleLogout = async () => {
    await logout();
    toast.success('Hisobdan chiqildi');
    router.push('/');
  };

  const isAdmin = Boolean(profile?.isAdmin ?? user?.isAdmin ?? user?.username === 'admin');
  const displayUser = profile || user;

  const levelTitle = useMemo(() => {
    if (!user) {
      return '';
    }
    return LEVEL_TITLES[Math.min(user.level, LEVEL_TITLES.length - 1)];
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 pb-24">
        <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
          <Shield size={28} className="text-primary-400" />
        </div>
        <p className="text-gray-300 text-lg font-semibold mb-2">Profilni ko'rish uchun kiring</p>
        <p className="text-gray-500 text-sm text-center mb-5">
          Hisobingiz orqali tasdiqlar, tokenlar va shaxsiy ma'lumotlaringiz ko'rinadi.
        </p>
        <button onClick={() => router.push('/auth/login')} className="btn-primary">
          Kirish
        </button>
        <BottomNav />
      </div>
    );
  }

  const nextLevelXp = Math.max(user.level, 1) * 500;
  const xpInLevel = user.xp % nextLevelXp;
  const xpPercent = Math.min((xpInLevel / nextLevelXp) * 100, 100);

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="bg-gradient-to-b from-primary-900/30 to-gray-950 px-4 pt-8 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-800 flex items-center justify-center text-4xl font-bold shadow-xl shadow-primary-900/40">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">{displayUser?.username}</h1>
            <p className="text-primary-400 text-sm font-semibold">{levelTitle}</p>
            <p className="text-gray-500 text-sm">
              {displayUser?.region || 'Hudud kiritilmagan'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-primary-300">Lv.{user.level}</p>
            <p className="text-xs text-gray-500">{Math.floor(user.totalTokens)} GT</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>XP jarayoni</span>
            <span>
              {xpInLevel} / {nextLevelXp}
            </span>
          </div>
          <div className="bg-gray-800 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Keyingi bosqich uchun {nextLevelXp - xpInLevel} XP kerak
          </p>
        </div>
      </div>

      <div className="px-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="card">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Coins size={16} className="text-yellow-400" />
              Token balans
            </div>
            <div className="text-2xl font-black text-white">{Math.floor(user.totalTokens)} GT</div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <TreePine size={16} className="text-primary-400" />
              Tasdiqlar
            </div>
            <div className="text-2xl font-black text-white">{profile?._count?.verifications || 0}</div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <Shield size={16} className="text-red-400" />
              Hisobotlar
            </div>
            <div className="text-2xl font-black text-white">{profile?._count?.fraudReports || 0}</div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
              <CalendarDays size={16} className="text-sky-400" />
              Qo'shilgan sana
            </div>
            <div className="text-sm font-bold text-white">{formatDate(profile?.createdAt)}</div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={16} className="text-primary-400" />
            <h2 className="font-semibold text-gray-100">Hamyon</h2>
          </div>
          <p className="font-mono text-xs text-gray-500 break-all">{user.walletAddress}</p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-100">Profil ma'lumotlari</h2>
              <p className="text-sm text-gray-500">Hudud va aloqa raqamini shu yerdan yangilang</p>
            </div>
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

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Telefon</label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  className="input pl-11"
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </div>
            </div>

            <button
              onClick={() => saveProfileMutation.mutate()}
              disabled={saveProfileMutation.isPending}
              className="btn-primary w-full"
            >
              <Save size={16} />
              {saveProfileMutation.isPending ? 'Saqlanmoqda...' : 'Profilni saqlash'}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-primary-400" />
            <h2 className="font-semibold text-gray-100">So'nggi tasdiqlar</h2>
          </div>

          <div className="space-y-2">
            {verificationHistory?.items?.length ? (
              verificationHistory.items.map((item: any) => (
                <div key={item.id} className="rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">
                        {item.treeLocation?.region}
                        {item.treeLocation?.district ? `, ${item.treeLocation.district}` : ''}
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(item.createdAt)}</p>
                    </div>
                    <span className="text-primary-400 font-bold">+{item.tokensEarned} GT</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-400">Aniqlangan daraxtlar</span>
                    <span className="text-white">{item.treeCount ?? 0} ta</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Hali tasdiqlash tarixi yo'q.</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <Coins size={16} className="text-yellow-400" />
            <h2 className="font-semibold text-gray-100">So'nggi token harakatlari</h2>
          </div>

          <div className="space-y-2">
            {tokenHistory?.items?.length ? (
              tokenHistory.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-950/60 p-3">
                  <div>
                    <p className="font-medium text-white">{item.transactionType.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-gray-500">{formatDate(item.createdAt)}</p>
                  </div>
                  <span className="text-primary-400 font-bold">+{item.amount} GT</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Token tarixi hali shakllanmagan.</p>
            )}
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => router.push('/admin')}
            className="w-full card flex items-center justify-between"
          >
            <div className="text-left">
              <p className="font-semibold text-yellow-400">Admin panel</p>
              <p className="text-sm text-gray-500">Yangi daraxt joylashuvlari va hisobotlarni boshqaring</p>
            </div>
            <ChevronRight size={18} className="text-gray-500" />
          </button>
        )}

        <button
          onClick={handleLogout}
          className="w-full bg-gray-900 border border-gray-700 hover:border-red-700 hover:bg-red-900/20 text-gray-400 hover:text-red-400 font-medium py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          <LogOut size={18} />
          Chiqish
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
