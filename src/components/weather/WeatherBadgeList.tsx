import { Pill } from '@/components/ui/Card';
import type { WeatherFlags } from '@/types';

export function WeatherBadgeList({ flags }: { flags: WeatherFlags[] }) {
  if (!flags?.length) return <div className="text-sm text-gray-500">날씨 플래그 없음</div>;
  return (
    <div className="flex flex-wrap gap-1 mb-3">
      {flags.map((f) => <Pill key={f}>{f}</Pill>)}
    </div>
  );
}
