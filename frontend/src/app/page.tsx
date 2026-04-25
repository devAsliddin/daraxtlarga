'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { motion } from 'framer-motion';

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: `${5 + (i * 6.2) % 90}%`,
  top: `${8 + (i * 7.3) % 84}%`,
  delay: i * 0.18,
  size: i % 3 === 0 ? '2.5rem' : i % 3 === 1 ? '1.8rem' : '1.4rem',
  opacity: i % 2 === 0 ? 0.07 : 0.05,
}));

export default function HomePage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push('/map');
  }, [user, router]);

  return (
    <div className="min-h-screen bg-gray-950 relative overflow-hidden flex flex-col">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-950/60 via-gray-950 to-gray-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute top-20 left-0 w-64 h-64 bg-emerald-600/8 rounded-full blur-3xl" />
        <div className="absolute top-10 right-0 w-64 h-64 bg-green-700/8 rounded-full blur-3xl" />
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute select-none"
            style={{ left: p.left, top: p.top, opacity: p.opacity, fontSize: p.size }}
            animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4 + p.id * 0.3, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
          >
            🌿
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">

        {/* Logo */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mb-6"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-2xl scale-150" />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative text-8xl drop-shadow-2xl"
            >
              🌲
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-center mb-2"
        >
          <h1 className="text-5xl font-black tracking-tight mb-1">
            <span className="text-gradient">Yashil</span>
            <span className="text-white"> Quest</span>
          </h1>
          <p className="text-primary-400 font-semibold text-base tracking-wide">
            Yashil Makon Monitoring
          </p>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400 text-sm text-center leading-relaxed mb-8 max-w-xs"
        >
          Pokémon GO uslubida daraxtlarni tasdiqlang,{' '}
          <span className="text-primary-400 font-medium">Green Token</span> ishlang va
          mamlakatimizni yashillashtirishga hissa qo'shing!
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-3 w-full mb-8"
        >
          {[
            { icon: '🌳', value: '15+', label: 'Joylashuv' },
            { icon: '🏆', value: '8+', label: 'Nishon' },
            { icon: '💚', value: 'GT', label: 'Token' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1, type: 'spring', stiffness: 200 }}
              className="card-glass text-center py-4 rounded-2xl"
            >
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-primary-400 font-black text-lg">{stat.value}</div>
              <div className="text-gray-500 text-xs mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="w-full space-y-3 mb-8"
        >
          <Link href="/auth/register" className="btn-primary w-full py-4 text-base glow-green rounded-2xl">
            <span className="text-lg">🚀</span>
            Boshlash — Ro'yxatdan o'tish
          </Link>
          <Link href="/auth/login" className="btn-secondary w-full py-3.5 text-base rounded-2xl">
            Kirish
          </Link>
          <Link href="/map" className="flex items-center justify-center gap-1 text-gray-500 text-sm py-2 hover:text-gray-300 transition-colors">
            <span>🗺️</span>
            Xaritani kirmay ko'rish
          </Link>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="w-full space-y-2.5"
        >
          {[
            { icon: '📸', text: 'Kamera orqali daraxtlarni skanning qiling', color: 'text-blue-400' },
            { icon: '🤖', text: 'AI va Computer Vision tekshiruvi', color: 'text-purple-400' },
            { icon: '⛓️', text: 'Blockchain bilan tasdiqlanadi', color: 'text-primary-400' },
            { icon: '🔍', text: 'Greenwashingni aniqlang va xabaring bering', color: 'text-red-400' },
          ].map((feature) => (
            <div key={feature.text} className="glass flex items-center gap-3 px-4 py-3 rounded-2xl">
              <span className="text-xl flex-shrink-0">{feature.icon}</span>
              <span className={`text-sm font-medium ${feature.color}`}>{feature.text}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom gradient */}
      <div className="relative h-px bg-gradient-to-r from-transparent via-primary-800/50 to-transparent mx-6" />
      <div className="relative py-4 text-center">
        <p className="text-gray-700 text-xs">O'zbekiston • Yashil Makon • 2025</p>
      </div>
    </div>
  );
}
