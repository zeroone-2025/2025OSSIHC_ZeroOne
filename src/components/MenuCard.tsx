"use client";

// MenuCard renders a menu item with placeholder thumbnail support. TODO: imageUrl 연동 예정.
type Props = {
  name: string;
  score: number;
  imageUrl?: string; // TODO: imageUrl 연동 예정
};

export default function MenuCard({ name, score, imageUrl }: Props) {
  const src = imageUrl || "https://via.placeholder.com/80";
  return (
    <div
      className="flex items-center gap-6 rounded-xl shadow-md ring-1 p-6 transition-all duration-500 hover:scale-[1.02]"
      style={{
        backgroundColor: 'var(--app-card)',
        color: 'var(--app-fg)',
        borderColor: 'var(--app-accent)'
      }}
    >
      <img
        src={src}
        alt={name}
        className="w-20 h-20 object-cover rounded-xl ring-2 shadow-sm transition-colors duration-500"
        style={{ borderColor: 'var(--app-accent)' }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-lg font-bold truncate mb-1" style={{ color: 'var(--app-fg)' }}>{name}</p>
        <p className="text-base font-semibold opacity-85" style={{ color: 'var(--app-accent)' }}>추천도: {(score * 100).toFixed(0)}점</p>
      </div>
    </div>
  );
}
