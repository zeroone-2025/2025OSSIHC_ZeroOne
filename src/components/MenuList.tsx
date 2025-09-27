"use client";
import MenuCard from "@/components/MenuCard";

// MenuList renders a ranked list of menu cards with optional medal badges.
export type MenuListItem = {
  name: string;
  score: number;
  imageUrl?: string;
};

const MEDALS = ["🏆", "🥈", "🥉"] as const;
const BADGE_STYLES = [
  "bg-primary/20 text-primary dark:bg-white/20 dark:text-white",
  "bg-white/70 text-black dark:bg-black/40 dark:text-white",
  "bg-yellow-200 text-yellow-900 dark:bg-yellow-500/80 dark:text-yellow-50",
];

export default function MenuList({ menus }: { menus: MenuListItem[] }) {
  if (!menus.length) {
    return (
      <p className="rounded-xl bg-white/60 p-4 text-center text-sm text-black/60 shadow dark:bg-black/20 dark:text-white/70">
        추천 데이터를 불러오지 못했습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-6">
      {menus.map((menu, index) => {
        const badge = MEDALS[index] ?? null;
        const badgeClass = BADGE_STYLES[index] ?? "bg-white/40 text-black dark:bg-black/40 dark:text-white";
        return (
          <li key={`${menu.name}-${index}`} className="relative pt-6">
            <span
              className={`absolute left-4 top-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}
            >
              {badge ? badge : `#${index + 1}`} {index < 3 ? `${index + 1}위` : "순위"}
            </span>
            <MenuCard {...menu} />
          </li>
        );
      })}
    </ul>
  );
}
