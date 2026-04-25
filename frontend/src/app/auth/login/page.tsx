'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      toast.success('Xush kelibsiz! 🎉');
      router.push('/map');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Email yoki parol noto\'g\'ri');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col overflow-hidden relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/70 via-gray-950/50 to-gray-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary-600/12 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-emerald-700/8 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative safe-top px-4 py-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm">Orqaga</span>
        </button>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative flex-1 flex flex-col justify-center px-6 pb-8"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl mb-4"
          >
            🌲
          </motion.div>
          <h1 className="text-3xl font-black text-white mb-1">Xush kelibsiz</h1>
          <p className="text-gray-400 text-sm">Hisobingizga kiring</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block font-medium">Email yoki username</label>
            <input
              className="input"
              type="text"
              placeholder="email@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-2 block font-medium">Parol</label>
            <div className="relative">
              <input
                className="input pr-14"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors p-1"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            className="btn-primary w-full py-4 text-base mt-2 glow-green"
            disabled={isLoading}
            whileTap={{ scale: 0.97 }}
          >
            {isLoading ? (
              <span className="animate-spin text-xl">⏳</span>
            ) : (
              <>
                <LogIn size={20} />
                Kirish
              </>
            )}
          </motion.button>
        </form>

        {/* Demo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-5 glass rounded-2xl p-4"
        >
          <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wider">Demo kirish</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">demo@yashilquest.uz</p>
              <p className="text-gray-500 text-xs">Parol: demo123</p>
            </div>
            <button
              onClick={() => setForm({ email: 'demo@yashilquest.uz', password: 'demo123' })}
              className="text-primary-400 text-sm font-semibold hover:text-primary-300 transition-colors px-3 py-1.5 bg-primary-900/30 rounded-xl border border-primary-800/50"
            >
              To'ldirish
            </button>
          </div>
        </motion.div>

        {/* Register link */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Akkount yo'qmi?{' '}
            <Link href="/auth/register" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
              Ro'yxatdan o'ting
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
