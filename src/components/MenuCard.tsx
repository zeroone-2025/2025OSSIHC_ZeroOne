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
    <div className="flex items-center gap-4 rounded-xl bg-white/80 p-4 shadow dark:bg-black/20">
      <img
        src={src}
        alt={name}
        className="h-16 w-16 rounded-lg border object-cover"
      />
      <div className="flex-1">
        <p className="text-base font-semibold text-black dark:text-white">{name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">점수: {score.toFixed(2)}</p>
      </div>
    </div>
  );
}
