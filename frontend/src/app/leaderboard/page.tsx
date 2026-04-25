'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion } from 'framer-motion';
import { Trophy, Users, TreePine, Coins } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  level: number;
  region?: string;
  tokens: number;
  score: number;
}

interface Stats {
  totalUsers: number;
  totalTrees: number;
  totalVerifications: number;
  totalTokensCirculation: number;
}

const RANK_STYLES = [
  'bg-gradient-to-r from-yellow-900/50 to-yellow-800/30 border border-yellow-700',
  'bg-gradient-to-r from-gray-700/50 to-gray-600/30 border border-gray-600',
  'bg-gradient-to-r from-orange-900/50 to-orange-800/30 border border-orange-700',
];

const RANK_EMOJIS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const { user } = useAuthStore();

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data } = await api.get('/leaderboard/global?limit=50');
      return data as LeaderboardEntry[];
    },
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await api.get('/leaderboard/stats');
      return data as Stats;
    },
  });

  const { data: myRank } = useQuery({
    queryKey: ['my-rank'],
    queryFn: async () => {
      const { data } = await api.get('/leaderboard/me');
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-yellow-900/20 to-gray-950 px-4 pt-6 pb-4">
        <h1 className="text-2xl font-black text-center mb-1">
          <Trophy className="inline mr-2 text-yellow-400" size={24} />
          Reyting
        </h1>
        <p className="text-gray-500 text-sm text-center">Global liderlar ro'yxati</p>

        {/* Platform stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-2 mt-4">
            {[
              { icon: <Users size={14} />, value: stats.totalUsers, label: 'Foydalanuvchi' },
              { icon: <TreePine size={14} />, value: stats.totalTrees, label: 'Joylashuv' },
              { icon: '✅', value: stats.totalVerifications, label: 'Tasdiq' },
              { icon: <Coins size={14} />, value: Math.floor(stats.totalTokensCirculation), label: 'GT' },
            ].map((s, i) => (
              <div key={i} className="card text-center py-2 px-1">
                <div className="text-primary-400 mb-0.5">{s.icon}</div>
                <div className="font-bold text-sm text-white">{s.value}</div>
                <div className="text-gray-600 text-[10px]">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* My rank */}
        {user && myRank && (
          <div className="mt-3 bg-primary-900/30 border border-primary-800 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Sizning o'rningiz</p>
              <p className="font-bold text-primary-300">
                #{myRank.rank ?? '—'} / {myRank.totalParticipants}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Ochiq</p>
              <p className="font-bold text-yellow-400">{Math.floor(myRank.score || 0)} GT</p>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard list */}
      <div className="px-4 space-y-2">
        {leaderboard.map((entry, index) => {
          const isMe = user?.id === entry.userId;
          const isTop3 = index < 3;

          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                isMe
                  ? 'bg-primary-900/40 border border-primary-700'
                  : isTop3
                  ? RANK_STYLES[index]
                  : 'bg-gray-900 border border-gray-800'
              }`}
            >
              {/* Rank */}
              <div className="w-8 text-center font-black">
                {isTop3 ? (
                  <span className="text-xl">{RANK_EMOJIS[index]}</span>
                ) : (
                  <span className="text-gray-500 text-sm">#{entry.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {entry.username.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`font-semibold text-sm truncate ${isMe ? 'text-primary-300' : 'text-white'}`}>
                    {entry.username}
                  </span>
                  {isMe && <span className="text-[10px] text-primary-500 flex-shrink-0">(Siz)</span>}
                </div>
                <div className="text-gray-500 text-xs">
                  Lv.{entry.level} · {entry.region || 'Unknown'}
                </div>
              </div>

              {/* Score */}
              <div className="text-right flex-shrink-0">
                <div className="font-bold text-yellow-400">{Math.floor(entry.tokens)}</div>
                <div className="text-[10px] text-gray-500">GT</div>
              </div>
            </motion.div>
          );
        })}

        {leaderboard.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">🏆</div>
            <p>Hali reyting yo'q</p>
            <p className="text-sm">Birinchi bo'ling!</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
