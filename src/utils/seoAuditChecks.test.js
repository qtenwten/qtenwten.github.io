import { describe, expect, it } from 'vitest'
import {
  getDefaultExpandedCheckIds,
  getVisibleAuditCategories,
  getVisibleAuditCheckCount,
  matchesCheckFilter,
} from './seoAuditChecks'

const sampleAnalysis = {
  categories: [
    {
      id: 'technical',
      label: 'Technical',
      checks: [
        { id: 'http-status', status: 'pass' },
        { id: 'robots', status: 'fail' },
      ],
    },
    {
      id: 'content',
      label: 'Content',
      checks: [
        { id: 'h1-length', status: 'warning' },
        { id: 'h2-coverage', status: 'pass' },
        { id: 'word-count', status: 'na' },
      ],
    },
  ],
  highlights: {
    topFixes: [
      { id: 'robots', status: 'fail' },
      { id: 'h1-length', status: 'warning' },
    ],
  },
}

describe('SEO audit check filters', () => {
  it('matches issue, status, and aggregate filters', () => {
    expect(matchesCheckFilter({ status: 'fail' }, 'issues')).toBe(true)
    expect(matchesCheckFilter({ status: 'warning' }, 'issues')).toBe(true)
    expect(matchesCheckFilter({ status: 'pass' }, 'issues')).toBe(false)
    expect(matchesCheckFilter({ status: 'fail' }, 'errors')).toBe(true)
    expect(matchesCheckFilter({ status: 'warning' }, 'warnings')).toBe(true)
    expect(matchesCheckFilter({ status: 'pass' }, 'passed')).toBe(true)
    expect(matchesCheckFilter({ status: 'na' }, 'na')).toBe(true)
    expect(matchesCheckFilter({ status: 'pass' }, 'all')).toBe(true)
  })

  it('filters visible categories by status and active category', () => {
    const visibleCategories = getVisibleAuditCategories(sampleAnalysis, {
      checkFilter: 'issues',
      activeCategoryId: 'content',
    })

    expect(visibleCategories).toHaveLength(1)
    expect(visibleCategories[0].id).toBe('content')
    expect(visibleCategories[0].visibleChecks.map((check) => check.id)).toEqual(['h1-length'])
    expect(getVisibleAuditCheckCount(visibleCategories)).toBe(1)
  })

  it('expands top priority checks by default', () => {
    const expandedIds = getDefaultExpandedCheckIds(sampleAnalysis)

    expect([...expandedIds].sort()).toEqual(['h1-length', 'robots'])
  })
})
