"use client";

import MenuCard from "./MenuCard";

export type MenuItem = { name: string; score: number; imageUrl?: string };

export default function MenuList({ menus }: { menus: MenuItem[] }) {
  return (
    <div className="space-y-3">
      {menus.map((m) => (
        <MenuCard key={m.name} {...m} />
      ))}
    </div>
  );
}
