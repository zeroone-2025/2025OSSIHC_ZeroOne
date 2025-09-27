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
    <div className="flex items-center gap-6 rounded-xl bg-white/95 dark:bg-black/60 text-gray-900 dark:text-gray-100 shadow-md ring-1 ring-black/10 dark:ring-white/15 p-6 transition-transform hover:scale-[1.02]">
      <img
        src={src}
        alt={name}
        className="w-20 h-20 object-cover rounded-xl ring-2 ring-black/15 dark:ring-white/25 shadow-sm"
      />
      <div className="flex-1 min-w-0">
        <p className="text-lg font-bold truncate mb-1">{name}</p>
        <p className="text-base font-semibold opacity-85">추천도: {(score * 100).toFixed(0)}점</p>
      </div>
    </div>
  );
}
