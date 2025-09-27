type Props = { name: string; score: number; imageUrl: string };

export default function MenuCard({ name, score, imageUrl }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-white/80 dark:bg-black/20 p-4 shadow">
      <img
        src={imageUrl}
        alt={name}
        className="w-16 h-16 object-cover rounded-lg"
        loading="lazy"
      />
      <div className="flex-1">
        <p className="font-bold text-lg">{name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          추천도: {Math.round(score * 100)}%
        </p>
      </div>
    </div>
  );
}
