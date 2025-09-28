"use client";

import MenuCard from "./MenuCard";

export type MenuItem = { name: string; score: number; imageUrl: string };

export default function MenuList({ menus }: { menus: MenuItem[] }) {
  const visible = Array.isArray(menus) ? menus.slice(0, 3) : [];
  return (
    <div className="flex flex-col h-full space-y-6">
      {visible.map((menu, index) => (
        <MenuCard
          key={menu.name}
          name={menu.name}
          score={menu.score}
          imageUrl={menu.imageUrl}
          rank={index + 1}
        />
      ))}
    </div>
  );
}
