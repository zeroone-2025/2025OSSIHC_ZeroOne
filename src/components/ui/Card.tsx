import { ReactNode } from 'react';

export function Card({ children }: { children: ReactNode }) {
  return <div className="bg-white rounded-xl shadow p-6">{children}</div>;
}
export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-xl font-bold mb-2">{children}</h2>;
}
export function Pill({ children }: { children: ReactNode }) {
  return <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{children}</span>;
}
