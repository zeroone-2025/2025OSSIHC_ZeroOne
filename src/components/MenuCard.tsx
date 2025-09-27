"use client";
import Image from "next/image";

// MenuCard renders a single recommended menu item with optional thumbnail support.
export default function MenuCard({
  name,
  score,
  imageUrl,
}: {
  name: string;
  score: number;
  imageUrl?: string;
}) {
  const displayScore = Number.isInteger(score) ? score.toFixed(0) : score.toFixed(1);
  const resolvedImage = imageUrl || "https://via.placeholder.com/64";

  return (
    <div className="flex items-center gap-4 rounded-xl bg-white/80 p-4 shadow dark:bg-black/20">
      <div className="relative h-16 w-16 overflow-hidden rounded-full">
        <Image
          src={resolvedImage}
          alt={`${name} 대표 이미지`}
          fill
          sizes="64px"
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="flex flex-1 items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-black dark:text-white">{name}</p>
          <p className="text-sm text-black/70 dark:text-white/70">점수 {displayScore}</p>
        </div>
        {/* TODO: imageUrl 데이터 연동 시 점수 외 보조 정보 표시 고려 */}
      </div>
    </div>
  );
}
