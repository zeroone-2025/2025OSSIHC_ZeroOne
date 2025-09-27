"use client";

// MenuCard renders a menu item with placeholder thumbnail support. TODO: imageUrl 연동 예정.
type Props = {
  name: string;
  score: number;
  imageUrl?: string; // TODO: imageUrl 연동 예정
};

export default function MenuCard({ name, score, imageUrl }: Props) {
  const src = imageUrl || "https://via.placeholder.com/64";
  return (
    <div className="flex items-center gap-4 rounded-xl bg-white/90 dark:bg-black/50 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-black/5 dark:ring-white/10 p-4">
      <img
        src={src}
        alt={name}
        className="w-16 h-16 object-cover rounded-lg ring-1 ring-black/10 dark:ring-white/20"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{name}</p>
        <p className="text-sm opacity-80">추천도: {score.toFixed(2)}</p>
      </div>
    </div>
  );
}
