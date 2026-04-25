'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { UZBEKISTAN_REGIONS } from '@/lib/regions';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, ArrowLeft, ChevronRight } from 'lucide-react';

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

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) { setStep(2); return; }
    handleRegister();
  };

  const handleRegister = async () => {
    try {
      await register(form);
      toast.success('Xush kelibsiz! Birinchi daraxtingizni toping! 🌳');
      router.push('/map');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Ro\'yxatdan o\'tish xatoligi');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/60 via-gray-950/50 to-gray-950" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-700/8 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative safe-top px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => step > 1 ? setStep(1) : router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">{step > 1 ? 'Orqaga' : 'Bosh sahifa'}</span>
        </button>
        <div className="ml-auto text-xs text-gray-600 font-medium">{step} / 2</div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex-1 flex flex-col px-6 pt-4 pb-8"
      >
        {/* Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🌱</div>
          <h1 className="text-3xl font-black text-white mb-1">
            {step === 1 ? 'Yangi Ekolog' : 'Joylashuvingiz'}
          </h1>
          <p className="text-gray-400 text-sm">
            {step === 1 ? 'Hisob ma\'lumotlarini kiriting' : 'Qayerdan ekosiz?'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <motion.div
              key={s}
              className="h-1.5 flex-1 rounded-full overflow-hidden bg-gray-800"
              initial={false}
            >
              <motion.div
                className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full"
                initial={{ width: s <= step ? '100%' : '0%' }}
                animate={{ width: s <= step ? '100%' : '0%' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </motion.div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleNext} className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 flex-1"
              >
                <div>
                  <label className="text-gray-400 text-sm mb-2 block font-medium">Email</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block font-medium">Taxallus (username)</label>
                  <input
                    className="input"
                    type="text"
                    placeholder="EcoHero_Tashkent"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    required
                    minLength={3}
                    maxLength={30}
                    autoComplete="username"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block font-medium">Parol</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Kamida 8 ta belgi"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 flex-1"
              >
                <div>
                  <label className="text-gray-400 text-sm mb-2 block font-medium">Viloyat</label>
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
                  <label className="text-gray-400 text-sm mb-2 block font-medium">
                    Telefon <span className="text-gray-600">(ixtiyoriy)</span>
                  </label>
                  <input
                    className="input"
                    type="tel"
                    placeholder="+998 90 123 45 67"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-2 block font-medium">
                    Taklif kodi <span className="text-gray-600">(ixtiyoriy)</span>
                  </label>
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
          </AnimatePresence>

          <div className="mt-6 space-y-3">
            <motion.button
              type="submit"
              className="btn-primary w-full py-4 text-base glow-green"
              disabled={isLoading}
              whileTap={{ scale: 0.97 }}
            >
              {isLoading ? (
                <span className="animate-spin text-xl">⏳</span>
              ) : step < 2 ? (
                <>
                  Keyingisi
                  <ChevronRight size={20} />
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Ro'yxatdan o'tish
                </>
              )}
            </motion.button>

            <p className="text-center text-gray-500 text-sm">
              Allaqachon akkount bormi?{' '}
              <Link href="/auth/login" className="text-primary-400 font-semibold hover:text-primary-300 transition-colors">
                Kirish
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
