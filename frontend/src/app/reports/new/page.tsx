'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { AlertTriangle, Send, ArrowLeft, Coins } from 'lucide-react';

function NewReportContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const treeId = params.get('treeId');

  const [form, setForm] = useState({
    description: '',
    gpsLat: 41.2995,
    gpsLng: 69.2401,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm({ ...form, gpsLat: pos.coords.latitude, gpsLng: pos.coords.longitude }),
      () => toast.error('GPS aniqlanmadi'),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/auth/login'); return; }
    if (!treeId) { toast.error('Daraxt ID si yo\'q'); return; }

    setIsSubmitting(true);
    try {
      const { data } = await api.post('/reports/fraud', {
        treeLocationId: treeId,
        description: form.description,
        gpsLat: form.gpsLat,
        gpsLng: form.gpsLng,
      });
      setResult(data);
      toast.success('Hisobot yuborildi!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Hisobot yuborishda xato');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-gray-950 p-4 flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="text-7xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Hisobot Yuborildi!</h2>
          <div className="inline-flex items-center gap-2 bg-primary-900/50 border border-primary-700 rounded-full px-4 py-2 mb-4">
            <Coins size={16} className="text-primary-400" />
            <span className="text-primary-300 font-bold">+{result.tokensEarned} GT ishlandi</span>
          </div>

          {result.reportNarrative && (
            <div className="card text-left mb-4">
              <h3 className="font-bold mb-2 text-gray-200">AI Hisobot</h3>
              <p className="text-gray-400 text-sm">{result.reportNarrative}</p>
            </div>
          )}

          <button onClick={() => router.push('/map')} className="btn-primary w-full">
            Xaritaga qaytish
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800">
        <button onClick={() => router.back()} className="text-gray-400">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-white">Firibgarlik Hisoboti</h1>
      </header>

      <div className="p-4">
        <div className="flex items-start gap-3 card bg-red-900/20 border-red-800 mb-4">
          <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-300">Greenwashing aniqlandi?</p>
            <p className="text-gray-400 text-sm mt-1">
              Davlat hisobotida ko'rsatilgan daraxtlar haqiqatda yo'q bo'lsa,
              ushbu formani to'ldiring. Tasdiqlangan hisobotlar uchun 20 GT beriladi.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Tavsif *</label>
            <textarea
              className="input min-h-[120px] resize-none"
              placeholder="Nima ko'rdingiz? Davlat hisobotida necha ta daraxt ko'rsatilgan va haqiqatda necha ta bor?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
              minLength={20}
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-1 block">GPS joylashuv</label>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                type="number"
                placeholder="Kenglik"
                value={form.gpsLat}
                onChange={(e) => setForm({ ...form, gpsLat: parseFloat(e.target.value) })}
                step="0.000001"
              />
              <input
                className="input flex-1"
                type="number"
                placeholder="Uzunlik"
                value={form.gpsLng}
                onChange={(e) => setForm({ ...form, gpsLng: parseFloat(e.target.value) })}
                step="0.000001"
              />
            </div>
            <button type="button" onClick={getLocation} className="text-primary-400 text-sm mt-1 hover:underline">
              Hozirgi joylashuvni olish
            </button>
          </div>

          <div className="card bg-primary-900/20 border-primary-800 text-center">
            <p className="text-gray-400 text-sm">Tasdiqlangan hisobot uchun</p>
            <p className="text-2xl font-bold text-primary-400">+20 GT</p>
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-4"
            disabled={isSubmitting || !form.description}
          >
            {isSubmitting ? (
              <><span className="animate-spin">⏳</span> Yuborilmoqda...</>
            ) : (
              <><Send size={18} /> Hisobot yuborish</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function NewReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="animate-spin text-4xl">🌀</div></div>}>
      <NewReportContent />
    </Suspense>
  );
}
