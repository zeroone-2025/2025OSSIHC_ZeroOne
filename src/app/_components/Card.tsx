import type { PropsWithChildren } from 'react'

type CardTone = 'default' | 'soft' | 'lifted'

interface CardProps extends PropsWithChildren {
  className?: string
  tone?: CardTone
}

const toneMap: Record<CardTone, string> = {
  default: 'shadow-card',
  soft: 'shadow-sm',
  lifted: 'shadow-lg',
}

export function Card({ children, className = '', tone = 'default' }: CardProps): React.ReactElement {
  const toneClass = toneMap[tone] ?? toneMap.default
  return (
    <div className={`rounded-xl border border-brand-sub1/40 bg-white ${toneClass} ${className}`}>
      {children}
    </div>
  )
}
