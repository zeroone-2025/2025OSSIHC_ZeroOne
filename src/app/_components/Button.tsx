import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'critical' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, PropsWithChildren {
  variant?: ButtonVariant
  fullWidth?: boolean
}

const baseClass =
  'inline-flex items-center justify-center rounded-full min-h-[44px] px-5 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sub1/60 disabled:cursor-not-allowed disabled:opacity-60'

const variantMap: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white shadow-card hover:opacity-90',
  secondary: 'bg-brand-sub1 text-white shadow-card hover:opacity-90',
  tertiary: 'bg-brand-sub2 text-black shadow-sm hover:shadow-card',
  danger: 'bg-brand text-white shadow-card hover:opacity-90',
  critical: 'bg-brand text-white shadow-card hover:opacity-90',
  icon: 'border border-brand-sub1/60 bg-white text-brand shadow-sm hover:bg-brand-bg min-h-[44px] min-w-[44px] h-11 w-11 px-0',
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  fullWidth = false,
  type = 'button',
  ...props
}: ButtonProps): JSX.Element {
  const variantClass = variantMap[variant] ?? variantMap.primary
  const widthClass = fullWidth ? 'w-full' : ''
  const iconSizing = variant === 'icon' ? '' : ''
  return (
    <button type={type} className={`${baseClass} ${variantClass} ${widthClass} ${className}`} {...props}>
      {children}
    </button>
  )
}
