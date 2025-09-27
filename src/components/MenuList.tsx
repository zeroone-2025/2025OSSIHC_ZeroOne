"use client";

import MenuCard from "./MenuCard";

export type MenuItem = { name: string; score: number; imageUrl: string };

export default function MenuList({ menus }: { menus: MenuItem[] }) {
  const visible = Array.isArray(menus) ? menus.slice(0, 10) : [];
  return (
    <div className="space-y-5">
      {visible.map((menu) => (
        <MenuCard key={menu.name} name={menu.name} score={menu.score} imageUrl={menu.imageUrl} />
      ))}
    </div>
  );
}
