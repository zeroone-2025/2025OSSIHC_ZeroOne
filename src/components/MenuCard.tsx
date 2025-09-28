"use client";

type Props = { name: string; score: number; imageUrl: string; rank: number };

export default function MenuCard({ name, score, imageUrl, rank }: Props) {
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-amber-600';
      default: return 'text-gray-500';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return rank;
    }
  };

  const getScoreLevel = (score: number) => {
    if (score >= 85) return { text: '매우추천', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 70) return { text: '추천', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 55) return { text: '보통', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (score >= 40) return { text: '별로', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { text: '비추천', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const scoreLevel = getScoreLevel(score);

  return (
    <div
      className="flex w-full items-center gap-6 rounded-xl shadow-lg ring-1 p-8 transition-all duration-500 hover:scale-[1.02] flex-1 min-h-[140px]"
      style={{
        backgroundColor: 'var(--app-card)',
        color: 'var(--app-fg)',
        borderColor: 'var(--app-accent)'
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="text-3xl">{getRankIcon(rank)}</div>
        <div className={`text-sm font-bold ${getRankColor(rank)}`}>#{rank}</div>
      </div>
      <img
        src={imageUrl}
        alt={name}
        className="w-32 h-32 object-cover rounded-2xl ring-2 shadow-md transition-colors duration-500"
        style={{ borderColor: 'var(--app-accent)' }}
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <p className="text-xl font-bold truncate mb-3" style={{ color: 'var(--app-fg)' }}>{name}</p>
        <span
          className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${scoreLevel.color} ${scoreLevel.bg}`}
        >
          {scoreLevel.text}
        </span>
      </div>
    </div>
  );
}
