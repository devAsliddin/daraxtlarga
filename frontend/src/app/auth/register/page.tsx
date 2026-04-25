'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { UZBEKISTAN_REGIONS } from '@/lib/regions';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    phone: '',
    region: '',
    referralCode: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) { setStep(2); return; }
    try {
      await register(form);
      toast.success('Xush kelibsiz! Birinchi daraxtingizni toping!');
      router.push('/map');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Ro\'yxatdan o\'tish xatoligi');
    }
  };

  return (
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card w-full max-w-sm"
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🌱</div>
          <h1 className="text-2xl font-bold text-gradient">Yangi Ekolog</h1>
          <p className="text-gray-400 text-sm mt-1">Qahramon sifatida ro'yxatdan o'ting</p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-primary-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Username (taxallus)</label>
                <input
                  className="input"
                  type="text"
                  placeholder="EcoHero_Tashkent"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  minLength={3}
                  maxLength={30}
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Parol</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Kamida 8 ta belgi"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Viloyat</label>
                <select
                  className="input"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  required
                >
                  <option value="">Viloyatni tanlang</option>
                  {UZBEKISTAN_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Telefon (ixtiyoriy)</label>
                <input
                  className="input"
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Taklif kodi (ixtiyoriy)</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Do'stingiz kodi"
                  value={form.referralCode}
                  onChange={(e) => setForm({ ...form, referralCode: e.target.value })}
                />
              </div>
            </motion.div>
          )}

          <button type="submit" className="btn-primary w-full py-3" disabled={isLoading}>
            {isLoading ? (
              <span className="animate-spin">⏳</span>
            ) : step < 2 ? (
              'Keyingisi'
            ) : (
              <>
                <UserPlus size={18} />
                Ro'yxatdan o'tish
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-500 text-sm">
            Allaqachon akkount bormi?{' '}
            <Link href="/auth/login" className="text-primary-400">
              Kirish
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
