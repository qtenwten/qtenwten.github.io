import { CircleHelp } from 'lucide-react'
import { iconMap } from '../icons/map'

const warnedIcons = new Set()

function Icon({ name, size = 24, className = '', strokeWidth = 2, ...props }) {
  const IconComponent = iconMap[name]

  if (!IconComponent) {
    if (!warnedIcons.has(name)) {
      console.warn('[Icon] Unknown icon:', name)
      warnedIcons.add(name)
    }

    return (
      <CircleHelp
        size={size}
        className={className}
        strokeWidth={strokeWidth}
        aria-hidden="true"
        {...props}
      />
    )
  }

  return (
    <IconComponent
      size={size}
      className={className}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      {...props}
    />
  )
}

export default Icon
