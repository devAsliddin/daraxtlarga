'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { BottomNav } from '@/components/ui/BottomNav';
import { motion } from 'framer-motion';
import { Trophy, Users, TreePine, Coins, Crown } from 'lucide-react';

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

const TOP3_CONFIG = [
  { emoji: '🥇', bg: 'from-yellow-900/60 to-yellow-800/30', border: 'border-yellow-700/60', text: 'text-yellow-400', glow: 'shadow-yellow-900/40', size: 'w-16 h-16', rank: 1 },
  { emoji: '🥈', bg: 'from-gray-700/60 to-gray-600/30', border: 'border-gray-500/60', text: 'text-gray-300', glow: 'shadow-gray-700/40', size: 'w-14 h-14', rank: 2 },
  { emoji: '🥉', bg: 'from-orange-900/60 to-orange-800/30', border: 'border-orange-700/60', text: 'text-orange-400', glow: 'shadow-orange-900/40', size: 'w-14 h-14', rank: 3 },
];

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

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="min-h-screen bg-gray-950 pb-28">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-950/40 via-gray-950/60 to-gray-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-yellow-600/10 rounded-full blur-3xl" />

        <div className="relative px-4 pt-8 pb-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Crown size={22} className="text-yellow-400" />
            <h1 className="text-2xl font-black text-white">Reyting</h1>
            <Crown size={22} className="text-yellow-400" />
          </div>
          <p className="text-gray-500 text-sm text-center mb-5">Global liderlar ro'yxati</p>

          {/* Platform stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { icon: <Users size={13} />, value: stats.totalUsers, label: 'Foydalanuvchi' },
                { icon: <TreePine size={13} />, value: stats.totalTrees, label: 'Joylashuv' },
                { icon: '✅', value: stats.totalVerifications, label: 'Tasdiq' },
                { icon: <Coins size={13} />, value: Math.floor(stats.totalTokensCirculation), label: 'GT' },
              ].map((s, i) => (
                <div key={i} className="glass rounded-2xl text-center py-2.5 px-1">
                  <div className="text-primary-400 mb-1 flex justify-center">{s.icon}</div>
                  <div className="font-black text-sm text-white">{s.value}</div>
                  <div className="text-gray-600 text-[9px] font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* My rank */}
          {user && myRank && (
            <div className="glass rounded-2xl px-4 py-3 flex items-center justify-between border border-primary-800/30">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Sizning o'rningiz</p>
                <p className="font-black text-primary-300 text-lg">
                  #{myRank.rank ?? '—'}
                  <span className="text-gray-600 text-sm font-normal"> / {myRank.totalParticipants}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-0.5">Balans</p>
                <p className="font-black text-yellow-400 text-lg">{Math.floor(myRank.score || 0)} GT</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top 3 podium */}
      {top3.length >= 3 && (
        <div className="px-4 mb-4">
          <div className="flex items-end justify-center gap-3">
            {/* 2nd place */}
            {top3[1] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex-1 flex flex-col items-center"
              >
                <div className={`${TOP3_CONFIG[1].size} rounded-full bg-gradient-to-br from-gray-600 to-gray-800 border-2 ${TOP3_CONFIG[1].border} flex items-center justify-center font-black text-xl text-white shadow-lg mb-2`}>
                  {top3[1].username.charAt(0).toUpperCase()}
                </div>
                <p className="text-white font-bold text-xs text-center truncate w-full px-1">{top3[1].username}</p>
                <p className="text-gray-500 text-[10px]">Lv.{top3[1].level}</p>
                <div className={`w-full mt-2 bg-gradient-to-t ${TOP3_CONFIG[1].bg} border ${TOP3_CONFIG[1].border} rounded-t-xl py-3 text-center`}>
                  <span className="text-xl">🥈</span>
                  <p className={`${TOP3_CONFIG[1].text} font-black text-sm`}>{Math.floor(top3[1].tokens)}</p>
                  <p className="text-gray-600 text-[9px]">GT</p>
                </div>
              </motion.div>
            )}

            {/* 1st place */}
            {top3[0] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
                className="flex-1 flex flex-col items-center"
              >
                <div className="relative mb-2">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">👑</div>
                  <div className={`${TOP3_CONFIG[0].size} rounded-full bg-gradient-to-br from-yellow-500 to-yellow-700 border-2 ${TOP3_CONFIG[0].border} flex items-center justify-center font-black text-2xl text-white shadow-xl ${TOP3_CONFIG[0].glow} mt-4`}>
                    {top3[0].username.charAt(0).toUpperCase()}
                  </div>
                </div>
                <p className="text-white font-black text-sm text-center truncate w-full px-1">{top3[0].username}</p>
                <p className="text-gray-500 text-[10px]">Lv.{top3[0].level}</p>
                <div className={`w-full mt-2 bg-gradient-to-t ${TOP3_CONFIG[0].bg} border ${TOP3_CONFIG[0].border} rounded-t-xl py-4 text-center`}>
                  <span className="text-2xl">🥇</span>
                  <p className={`${TOP3_CONFIG[0].text} font-black text-base`}>{Math.floor(top3[0].tokens)}</p>
                  <p className="text-gray-600 text-[9px]">GT</p>
                </div>
              </motion.div>
            )}

            {/* 3rd place */}
            {top3[2] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex-1 flex flex-col items-center"
              >
                <div className={`${TOP3_CONFIG[2].size} rounded-full bg-gradient-to-br from-orange-700 to-orange-900 border-2 ${TOP3_CONFIG[2].border} flex items-center justify-center font-black text-lg text-white shadow-lg mb-2`}>
                  {top3[2].username.charAt(0).toUpperCase()}
                </div>
                <p className="text-white font-bold text-xs text-center truncate w-full px-1">{top3[2].username}</p>
                <p className="text-gray-500 text-[10px]">Lv.{top3[2].level}</p>
                <div className={`w-full mt-2 bg-gradient-to-t ${TOP3_CONFIG[2].bg} border ${TOP3_CONFIG[2].border} rounded-t-xl py-3 text-center`}>
                  <span className="text-xl">🥉</span>
                  <p className={`${TOP3_CONFIG[2].text} font-black text-sm`}>{Math.floor(top3[2].tokens)}</p>
                  <p className="text-gray-600 text-[9px]">GT</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Rest of the list */}
      <div className="px-4 space-y-2">
        {rest.map((entry, index) => {
          const isMe = user?.id === entry.userId;
          const realIndex = index + 3;

          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: realIndex * 0.03 }}
              className={`flex items-center gap-3 p-3 rounded-2xl border ${
                isMe
                  ? 'bg-primary-900/30 border-primary-700/50'
                  : 'bg-gray-900/60 border-gray-800/60'
              }`}
            >
              {/* Rank */}
              <div className="w-8 text-center">
                <span className="text-gray-500 text-sm font-bold">#{entry.rank}</span>
              </div>

              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                isMe
                  ? 'bg-gradient-to-br from-primary-500 to-primary-700'
                  : 'bg-gradient-to-br from-gray-700 to-gray-800'
              }`}>
                {entry.username.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className={`font-semibold text-sm truncate ${isMe ? 'text-primary-300' : 'text-white'}`}>
                    {entry.username}
                  </span>
                  {isMe && <span className="text-[9px] text-primary-600 flex-shrink-0 font-bold">(Siz)</span>}
                </div>
                <div className="text-gray-600 text-xs">
                  Lv.{entry.level} · {entry.region || 'Noma\'lum'}
                </div>
              </div>

              {/* Score */}
              <div className="text-right flex-shrink-0">
                <div className="font-black text-yellow-400 text-sm">{Math.floor(entry.tokens)}</div>
                <div className="text-[9px] text-gray-600 font-medium">GT</div>
              </div>
            </motion.div>
          );
        })}

        {leaderboard.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <div className="text-5xl mb-3">🏆</div>
            <p className="font-semibold">Hali reyting yo'q</p>
            <p className="text-sm text-gray-600 mt-1">Birinchi bo'ling!</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
