'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { BottomNav } from '@/components/ui/BottomNav';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Star, Clock, CheckCircle } from 'lucide-react';

const QUEST_ICONS: Record<string, string> = {
  leaf: '🌿',
  tree: '🌳',
  shield: '🛡️',
  eye: '👁️',
  default: '⭐',
};

const BADGE_RARITY_STYLE: Record<string, string> = {
  common: 'border-gray-700 bg-gray-800',
  rare: 'border-blue-700 bg-blue-900/30',
  epic: 'border-purple-700 bg-purple-900/30',
  legendary: 'border-orange-700 bg-orange-900/30',
};

export default function QuestsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const { data: quests = [] } = useQuery({
    queryKey: ['quests'],
    queryFn: async () => {
      const { data } = await api.get('/quests/active');
      return data;
    },
    enabled: !!user,
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const { data } = await api.get('/quests/badges');
      return data;
    },
  });

  const { data: myBadges = [] } = useQuery({
    queryKey: ['my-badges'],
    queryFn: async () => {
      const { data } = await api.get('/quests/my-badges');
      return data;
    },
    enabled: !!user,
  });

  const myBadgeIds = new Set(myBadges.map((b: any) => b.badgeId));

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 pb-24">
        <div className="text-5xl mb-4">🔒</div>
        <p className="text-gray-400 mb-4">Vazifalarni ko'rish uchun kiring</p>
        <button onClick={() => router.push('/auth/login')} className="btn-primary">
          Kirish
        </button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-black mb-1">
          <Shield className="inline mr-2 text-primary-400" size={24} />
          Vazifalar
        </h1>
        <p className="text-gray-500 text-sm">Bajarib token ishlang</p>
      </div>

      {/* Active Quests */}
      <div className="px-4 mb-6">
        <h2 className="font-bold text-gray-300 mb-3">Faol Vazifalar</h2>
        <div className="space-y-3">
          {quests.map((quest: any) => {
            const progress = quest.userProgress?.progress || {};
            const criteria = quest.completionCriteria;
            const current = progress.count || 0;
            const target = criteria.count || 1;
            const percentage = Math.min((current / target) * 100, 100);
            const isCompleted = !!quest.userProgress?.completedAt;

            return (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`card ${isCompleted ? 'border-primary-800 bg-primary-900/20' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl flex-shrink-0">
                    {QUEST_ICONS[quest.iconName] || QUEST_ICONS.default}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white">{quest.title}</h3>
                      <div className="flex items-center gap-1 text-sm text-yellow-400 font-bold">
                        +{quest.rewardTokens} GT
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{quest.description}</p>

                    {/* Progress bar */}
                    <div className="bg-gray-800 rounded-full h-2 mb-1">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-primary-500' : 'bg-primary-700'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{current} / {target}</span>
                      <div className="flex items-center gap-1">
                        <Clock size={10} />
                        {quest.type === 'DAILY' ? 'Kunlik' : 'Haftalik'}
                      </div>
                    </div>

                    {isCompleted && (
                      <div className="flex items-center gap-1 text-primary-400 text-xs mt-1">
                        <CheckCircle size={12} />
                        Bajarildi!
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          {quests.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📋</div>
              <p>Hozircha faol vazifa yo'q</p>
            </div>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="px-4">
        <h2 className="font-bold text-gray-300 mb-3">Nishonlar</h2>
        <div className="grid grid-cols-2 gap-3">
          {badges.map((badge: any) => {
            const earned = myBadgeIds.has(badge.id);
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`border rounded-2xl p-4 text-center transition-all ${
                  earned
                    ? BADGE_RARITY_STYLE[badge.rarity]
                    : 'border-gray-800 bg-gray-900 opacity-50'
                }`}
              >
                <div className="text-4xl mb-2">{badge.icon}</div>
                <div className="font-semibold text-sm text-white">{badge.name}</div>
                <div className="text-xs text-gray-400 mt-1">{badge.description}</div>
                <div className={`text-xs mt-2 px-2 py-0.5 rounded-full inline-block ${
                  badge.rarity === 'legendary' ? 'bg-orange-900/50 text-orange-400' :
                  badge.rarity === 'epic' ? 'bg-purple-900/50 text-purple-400' :
                  badge.rarity === 'rare' ? 'bg-blue-900/50 text-blue-400' :
                  'bg-gray-800 text-gray-400'
                }`}>
                  {badge.rarity}
                </div>
                {earned && (
                  <div className="mt-1 text-primary-400 text-xs">✅ Olindi</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
