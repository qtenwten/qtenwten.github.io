import { useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import {
  fetchArticles,
  readCachedArticleDetail,
  readCachedArticlesIndex,
  readInitialArticleDetail,
  readInitialArticlesIndex,
  writeCachedArticlesIndex,
} from '../api/articlesApi'
import { safeSetItem } from '../utils/storage'

export function useLanguageSwitcher() {
  const navigate = useNavigate()
  const location = useLocation()
  const { language: currentLang, changeLanguage: setCtxLanguage } = useLanguage()

  function findTranslatedSlug(items, translationKey, targetLanguage) {
    if (!translationKey || !Array.isArray(items) || items.length === 0) {
      return ''
    }

    const match = items.find((item) => (
      (item?.translationKey || item?.translation_key) === translationKey
      && (item?.language === targetLanguage || item?.lang === targetLanguage)
      && item?.slug
    ))

    return match?.slug || ''
  }

  function readTranslationKeyForCurrentArticle(slug, currentLanguage) {
    const seeded = readInitialArticleDetail(slug, currentLanguage)
    const cached = seeded || readCachedArticleDetail(slug, currentLanguage)
    return cached?.translationKey || cached?.translation_key || ''
  }

  function applyLocalePrefix(pathname, newLang) {
    if (typeof pathname !== 'string' || pathname.length === 0) {
      return `/${newLang}/`
    }

    const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`
    if (normalized === '/') {
      return `/${newLang}/`
    }

    if (normalized.startsWith('/ru/') || normalized.startsWith('/en/') || normalized === '/ru' || normalized === '/en') {
      const replaced = normalized.replace(/^\/(ru|en)(?=\/|$)/, `/${newLang}`)
      return replaced === `/${newLang}` ? `/${newLang}/` : replaced
    }

    return `/${newLang}${normalized}`
  }

  function navigateLocalized(pathname, newLang) {
    const nextUrlState = {
      localeSwitch: true,
      scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
    }
    navigate(`${pathname}${location.search}${location.hash}`, { state: nextUrlState })
    safeSetItem('language', newLang)
  }

  function switchLanguage(newLang) {
    if (newLang !== 'ru' && newLang !== 'en') return
    if (newLang === currentLang) return

    const currentPath = location.pathname
    const articleMatch = currentPath.match(/^\/(ru|en)\/articles\/([^/?#]+)/)

    if (articleMatch) {
      const slug = decodeURIComponent(articleMatch[2] || '')
      const translationKey = readTranslationKeyForCurrentArticle(slug, currentLang)

      const seededTargetIndex = readInitialArticlesIndex(newLang)
      const cachedTargetIndex = readCachedArticlesIndex()
      const translatedFromCache = findTranslatedSlug(
        seededTargetIndex.length ? seededTargetIndex : cachedTargetIndex,
        translationKey,
        newLang,
      )

      if (translatedFromCache) {
        navigateLocalized(`/${newLang}/articles/${encodeURIComponent(translatedFromCache)}`, newLang)
        return
      }

      fetchArticles(newLang)
        .then((items) => {
          writeCachedArticlesIndex(items)
          const translated = findTranslatedSlug(items, translationKey, newLang)
          if (translated) {
            navigateLocalized(`/${newLang}/articles/${encodeURIComponent(translated)}`, newLang)
            return
          }
          navigateLocalized(`/${newLang}/articles/`, newLang)
        })
        .catch(() => {
          navigateLocalized(`/${newLang}/articles/`, newLang)
        })

      return
    }

    const pathLang = currentPath.split('/')[1]
    if (pathLang === 'ru' || pathLang === 'en') {
      const newPath = applyLocalePrefix(currentPath, newLang)
      navigateLocalized(newPath, newLang)
    } else {
      const newPath = applyLocalePrefix(currentPath, newLang)
      navigateLocalized(newPath, newLang)
    }
  }

  return { switchLanguage }
}