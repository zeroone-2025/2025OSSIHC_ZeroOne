import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'critical'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, PropsWithChildren {
  variant?: ButtonVariant
  fullWidth?: boolean
}

const baseClass =
  'inline-flex items-center justify-center rounded-full h-12 px-5 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light/60 disabled:cursor-not-allowed disabled:opacity-60'

const variantMap: Record<ButtonVariant, string> = {
  primary: 'border border-brand bg-brand text-white shadow-card hover:opacity-90',
  secondary: 'border border-brand-light/60 bg-white text-brand shadow-sm hover:bg-brand-pale',
  critical: 'border border-critical bg-critical text-white shadow-card hover:bg-critical/90',
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
  return (
    <button type={type} className={`${baseClass} ${variantClass} ${widthClass} ${className}`} {...props}>
      {children}
    </button>
  )
}
