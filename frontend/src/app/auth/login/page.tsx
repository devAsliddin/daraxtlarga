'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      toast.success('Xush kelibsiz!');
      router.push('/map');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Kirish xatoligi');
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
          <div className="text-5xl mb-3">🌲</div>
          <h1 className="text-2xl font-bold text-gradient">Yashil Quest</h1>
          <p className="text-gray-400 text-sm mt-1">Tizimga kirish</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-1 block">Email yoki username</label>
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
            <label className="text-gray-400 text-sm mb-1 block">Parol</label>
            <div className="relative">
              <input
                className="input pr-12"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3" disabled={isLoading}>
            {isLoading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <>
                <LogIn size={18} />
                Kirish
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-500 text-sm">
            Akkount yo'qmi?{' '}
            <Link href="/auth/register" className="text-primary-400 hover:text-primary-300">
              Ro'yxatdan o'ting
            </Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 p-3 bg-gray-800 rounded-xl text-xs text-gray-400">
          <p className="font-semibold mb-1 text-gray-300">Demo kirish:</p>
          <p>Email: demo@yashilquest.uz</p>
          <p>Parol: demo123</p>
          <button
            onClick={() => setForm({ email: 'demo@yashilquest.uz', password: 'demo123' })}
            className="text-primary-400 mt-1 hover:underline"
          >
            To'ldirish
          </button>
        </div>
      </motion.div>
    </div>
  );
}
