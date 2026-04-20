import { useLanguage } from '../contexts/LanguageContext'

function SkeletonLine({ className = '' }) {
  return <span className={`skeleton-line ${className}`.trim()} aria-hidden="true" />
}

function RouteSkeleton() {
  const { t } = useLanguage()

  return (
    <div className="route-skeleton">
      <span className="sr-only" role="status" aria-live="polite">{t('common.loading')}</span>
      <div className="tool-container route-skeleton__container">
        <div className="skeleton-card route-skeleton__hero">
          <SkeletonLine className="route-skeleton__eyebrow" />
          <SkeletonLine className="route-skeleton__title" />
          <SkeletonLine className="route-skeleton__subtitle" />
        </div>

        <div className="skeleton-card route-skeleton__tool">
          <div className="route-skeleton__field">
            <SkeletonLine className="route-skeleton__label" />
            <SkeletonLine className="route-skeleton__input" />
          </div>
          <div className="route-skeleton__field">
            <SkeletonLine className="route-skeleton__label route-skeleton__label--short" />
            <SkeletonLine className="route-skeleton__input route-skeleton__input--wide" />
          </div>
          <div className="route-skeleton__actions">
            <SkeletonLine className="route-skeleton__button" />
            <SkeletonLine className="route-skeleton__button route-skeleton__button--ghost" />
          </div>
        </div>

        <div className="skeleton-card route-skeleton__content">
          <SkeletonLine className="route-skeleton__section-title" />
          <SkeletonLine className="route-skeleton__paragraph" />
          <SkeletonLine className="route-skeleton__paragraph route-skeleton__paragraph--short" />
          <SkeletonLine className="route-skeleton__section-title route-skeleton__section-title--lower" />
          <SkeletonLine className="route-skeleton__paragraph" />
          <SkeletonLine className="route-skeleton__paragraph route-skeleton__paragraph--short" />
        </div>
      </div>
    </div>
  )
}

export default RouteSkeleton
