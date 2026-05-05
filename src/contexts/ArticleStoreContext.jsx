import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchArticles,
  fetchArticleBySlug,
  readCachedArticlesIndex,
  readCachedArticleDetail,
  readInitialArticlesIndex,
  readInitialArticleDetail,
  writeCachedArticlesIndex,
  writeCachedArticleDetail,
} from '../api/articlesApi'
import { articleMatchesLanguage, filterArticlesForLanguage } from '../utils/articleLanguage'

const ArticleStoreContext = createContext(null)

export const ARTICLE_INDEX_KEY = 'qsen:articles:index:v6'
export const ARTICLE_DETAIL_KEY = (slug) => `qsen:articles:detail:${slug}`

export function ArticleStoreProvider({ children }) {
  const [indexStatus, setIndexStatus] = useState('idle')
  const [indexError, setIndexError] = useState(null)
  const [detailStatus, setDetailStatus] = useState('loading')
  const [detailError, setDetailError] = useState(null)

  const [articlesIndex, setArticlesIndex] = useState(() => {
    if (typeof window === 'undefined') return []
    const initialLang = typeof window !== 'undefined' && window.__QSEN_INITIAL_LANGUAGE__ ? window.__QSEN_INITIAL_LANGUAGE__ : 'ru'
    const initial = readInitialArticlesIndex(initialLang)
    return initial.length ? initial : readCachedArticlesIndex()
  })

  const [currentArticle, setCurrentArticle] = useState(null)

  const articlesIndexRef = useRef(articlesIndex)
  const refreshTimerRef = useRef(null)

  useEffect(() => {
    articlesIndexRef.current = articlesIndex
  }, [articlesIndex])

  const getVisibleArticles = useCallback((language) => {
    return filterArticlesForLanguage(articlesIndex, language)
  }, [articlesIndex])

  const fetchIndex = useCallback(async (language, { force = false } = {}) => {
    const lang = language || 'ru'

    if (!force && articlesIndexRef.current.length > 0) {
      setIndexStatus('success')
      return articlesIndexRef.current
    }

    setIndexStatus('loading')
    setIndexError(null)

    try {
      const items = await fetchArticles(lang)
      setArticlesIndex(items)
      writeCachedArticlesIndex(items)
      setIndexStatus('success')
      return items
    } catch (error) {
      setIndexError(error)
      setIndexStatus('error')
      return []
    }
  }, [])

  const fetchDetail = useCallback(async (slug, language) => {
    const lang = language || 'ru'

    const initial = readInitialArticleDetail(slug, lang)
    if (initial) {
      setCurrentArticle(initial)
      setDetailStatus('success')
      return initial
    }

    const cached = readCachedArticleDetail(slug, lang)
    if (cached) {
      setCurrentArticle(cached)
      setDetailStatus('success')
      return cached
    }

    setDetailStatus('loading')
    setDetailError(null)

    try {
      const article = await fetchArticleBySlug(slug, lang)
      setCurrentArticle(article)
      writeCachedArticleDetail(article)
      setDetailStatus('success')
      return article
    } catch (error) {
      setDetailError(error)
      if (!cached) {
        setDetailStatus('error')
      } else {
        setDetailStatus('success')
      }
      return null
    }
  }, [])

  const clearDetail = useCallback(() => {
    setCurrentArticle(null)
    setDetailStatus('idle')
    setDetailError(null)
  }, [])

  const refreshIndex = useCallback((language) => {
    return fetchIndex(language, { force: true })
  }, [fetchIndex])

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [])

  const value = {
    articlesIndex,
    indexStatus,
    indexError,
    currentArticle,
    detailStatus,
    detailError,
    getVisibleArticles,
    fetchIndex,
    fetchDetail,
    clearDetail,
    refreshIndex,
  }

  return (
    <ArticleStoreContext.Provider value={value}>
      {children}
    </ArticleStoreContext.Provider>
  )
}

export function useArticleStore() {
  const context = useContext(ArticleStoreContext)
  if (!context) {
    throw new Error('useArticleStore must be used within ArticleStoreProvider')
  }
  return context
}

export function useArticlesIndex(language) {
  const { getVisibleArticles, fetchIndex, indexStatus, indexError, articlesIndex } = useArticleStore()

  useEffect(() => {
    fetchIndex(language)
  }, [fetchIndex, language])

  const visible = getVisibleArticles(language)

  return {
    articles: visible,
    status: indexStatus,
    error: indexError,
    refetch: () => fetchIndex(language, { force: true }),
  }
}

export function useArticleDetail(slug, language) {
  const {
    fetchDetail,
    currentArticle,
    detailStatus,
    detailError,
    clearDetail,
  } = useArticleStore()

  const initialArticle = useMemo(() => {
    if (!slug) return null
    return readInitialArticleDetail(slug, language)
  }, [slug, language])

  const isMatchingArticle = (article, checkSlug, checkLanguage) => {
    if (!article || !checkSlug) return false
    const articleSlug = article.slug || article.article_slug
    const articleLanguage = article.language || article.lang
    if (articleSlug !== checkSlug) return false
    if (checkLanguage && articleLanguage && articleLanguage !== checkLanguage) return false
    return true
  }

  const matchingCurrentArticle = isMatchingArticle(currentArticle, slug, language)
    ? currentArticle
    : null

  const matchingInitialArticle = isMatchingArticle(initialArticle, slug, language)
    ? initialArticle
    : null

  const article = matchingCurrentArticle || matchingInitialArticle
  const status = article ? 'success' : detailStatus

  useEffect(() => {
    if (!slug) return
    fetchDetail(slug, language)
  }, [slug, language, fetchDetail])

  return {
    article,
    status,
    error: article ? null : detailError,
    refetch: () => fetchDetail(slug, language),
  }
}
