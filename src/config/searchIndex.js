import { ROUTE_REGISTRY } from './routeRegistry'
import { getRouteSeo, getLocalizedRoutePath } from './routeSeo'

function normalizeForSearch(value = '') {
  return value
    .toLowerCase()
    .replace(/[\s\-_]+/g, ' ')
    .trim()
}

export function buildSearchIndex(language, translate) {
  return ROUTE_REGISTRY
    .filter((route) => route.showOnHome)
    .map((route) => {
      const seo = getRouteSeo(language, route.path)
      const title = translate(route.titleKey)
      const description = translate(route.descriptionKey)
      const category = route.categoryKey ? translate(route.categoryKey) : ''

      return {
        id: route.key,
        path: getLocalizedRoutePath(language, route.path),
        routePath: route.path,
        title,
        description,
        category,
        icon: route.icon,
        seoTitle: seo.title,
        seoDescription: seo.description,
        seoKeywords: seo.keywords,
        searchableText: normalizeForSearch(`${title} ${description} ${category} ${seo.title} ${seo.description} ${seo.keywords}`),
      }
    })
}

export function searchRoutes(index, query) {
  const normalizedQuery = normalizeForSearch(query)
  if (!normalizedQuery) return index

  return index.filter((item) => item.searchableText.includes(normalizedQuery))
}
