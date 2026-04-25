'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push('/map');
  }, [user, router]);

  return (
    <div className="min-h-screen bg-hero-pattern flex flex-col items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute text-green-900/20 text-4xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          >
            🌳
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative text-center max-w-sm mx-auto"
      >
        {/* Logo */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-8xl mb-6"
        >
          🌲
        </motion.div>

        <h1 className="text-4xl font-black mb-2">
          <span className="text-gradient">Yashil Quest</span>
        </h1>

        <p className="text-green-300 text-lg font-semibold mb-2">
          Yashil Makon Monitoring
        </p>

        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          Pokémon GO uslubida daraxtlarni tasdiqlang,
          Green Token ishlang va mamlakatimizni yashillashtirishga hissa qo'shing!
        </p>

        {/* Stats preview */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: '🌳', value: '15+', label: 'Joylashuv' },
            { icon: '🏆', value: '8+', label: 'Nishon' },
            { icon: '💚', value: 'GT', label: 'Token' },
          ].map((stat) => (
            <div key={stat.label} className="card text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-primary-400 font-bold">{stat.value}</div>
              <div className="text-gray-500 text-xs">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Link href="/auth/register" className="btn-primary w-full text-lg py-4">
            Boshlash
          </Link>
          <Link href="/auth/login" className="btn-secondary w-full">
            Kirish
          </Link>
          <Link href="/map" className="text-gray-500 text-sm block text-center hover:text-gray-300 transition-colors">
            Xaritani ko'rish (kirmay)
          </Link>
        </div>

        {/* Features */}
        <div className="mt-8 space-y-3 text-left">
          {[
            { icon: '📸', text: 'Kamera orqali daraxtlarni skanning qiling' },
            { icon: '🤖', text: 'AI va Computer Vision tekshiruvi' },
            { icon: '⛓️', text: 'Blockchain bilan tasdiqlanadi' },
            { icon: '🔍', text: 'Greenwashingni aniqlang va xabaring bering' },
          ].map((feature) => (
            <div key={feature.text} className="flex items-start gap-3 text-sm">
              <span className="text-xl flex-shrink-0">{feature.icon}</span>
              <span className="text-gray-400">{feature.text}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
