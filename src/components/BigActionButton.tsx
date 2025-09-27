"use client";
import { Utensils } from "lucide-react";

export default function BigActionButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="gradient-background flex aspect-square w-64 items-center justify-center rounded-full shadow-2xl
                 transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
    >
      <div className="text-center text-white">
        <Utensils className="mx-auto h-16 w-16" />
        <p className="mt-2 text-lg font-bold">점심 메뉴 추천</p>
      </div>
    </button>
  );
}