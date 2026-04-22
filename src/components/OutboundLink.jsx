import { analytics } from '../utils/analytics'

export function OutboundLink({ href, children, className, onClick, ...props }) {
  const handleClick = (e) => {
    if (typeof href === 'string' && (href.startsWith('http://') || href.startsWith('https://'))) {
      const isExternal = !href.includes('qsen.ru')
      if (isExternal) {
        analytics.trackOutboundLinkClicked({
          url: href,
          domain: typeof window !== 'undefined' ? new URL(href).hostname : href,
        })
      }
    }
    if (onClick) {
      onClick(e)
    }
  }

  return (
    <a href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </a>
  )
}

export default OutboundLink
