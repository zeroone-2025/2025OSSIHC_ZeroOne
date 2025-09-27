"use client";

import { useEffect, useState } from "react";

type Props = {
  messages?: string[];
  totalMs?: number; // 전체 로딩 최소 시간 (기본 3000ms)
  stepMs?: number; // 문장 간 간격 (기본 800ms)
  onFinish?: () => void; // 로딩 완료 콜백
};

const DEFAULT_MESSAGES = [
  "지금은 날씨를 확인하고 있습니다...",
  "지금은 주변 환경을 분석 중입니다...",
  "메뉴 데이터셋을 불러오는 중입니다...",
  "복잡한 연산을 통해 메뉴를 계산하는 중...",
];

export default function LoadingSequence({
  messages = DEFAULT_MESSAGES,
  totalMs = 3000,
  stepMs = 800,
  onFinish,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    // 문장 순차 표시
    const interval = setInterval(() => {
      setVisibleCount((c) => Math.min(c + 1, messages.length));
    }, stepMs);

    // 총 로딩 시간 뒤 종료
    const timer = setTimeout(() => {
      clearInterval(interval);
      onFinish?.();
    }, totalMs);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [messages, stepMs, totalMs, onFinish]);

  return (
    <div className="min-h-[60vh] grid place-items-center px-6">
      <div
        className="w-full max-w-md rounded-xl p-5 font-mono shadow-lg transition-colors duration-500"
        style={{
          backgroundColor: 'var(--app-card)',
          color: 'var(--app-accent)',
          borderColor: 'var(--app-accent)'
        }}
      >
        {messages.slice(0, visibleCount).map((m, i) => (
          <p key={i} className="opacity-90" style={{ color: 'var(--app-fg)' }}>
            {m}
          </p>
        ))}
        {visibleCount === 0 && (
          <p className="opacity-60" style={{ color: 'var(--app-accent)' }}>초기화 중...</p>
        )}
      </div>
    </div>
  );
}
