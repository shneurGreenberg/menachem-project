import type { LucideIcon } from 'lucide-react'

export const ICON_SIZE = 18
export const ICON_SIZE_SM = 16
export const ICON_SIZE_LG = 22

interface IconProps {
  icon: LucideIcon
  size?: number
  className?: string
}

export function Icon({ icon: IconComp, size = ICON_SIZE, className }: IconProps) {
  return <IconComp size={size} strokeWidth={2} className={className} aria-hidden />
}

interface WithIconProps {
  icon: LucideIcon
  children: React.ReactNode
  size?: number
}

export function WithIcon({ icon, children, size = ICON_SIZE_SM }: WithIconProps) {
  return (
    <>
      <Icon icon={icon} size={size} />
      {children}
    </>
  )
}
