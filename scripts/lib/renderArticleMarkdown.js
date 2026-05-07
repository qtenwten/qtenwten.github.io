function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isSafeHref(href) {
  if (typeof href !== 'string') return false
  return href.startsWith('http://')
    || href.startsWith('https://')
    || (/^\/(?!\/)[^\s]*$/.test(href) && !href.includes('\\'))
}

function parseMarkdown(content) {
  const lines = (content || '').replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let paragraphLines = []
  let listItems = []
  let orderedListItems = []
  let codeLines = []
  let codeLanguage = ''
  let inCodeBlock = false
  let blockquoteLines = []
  let tableRows = []
  let inTable = false
  let tableAligns = []

  const flushParagraph = () => {
    if (!paragraphLines.length) return
    blocks.push({ type: 'paragraph', text: paragraphLines.join(' ').trim() })
    paragraphLines = []
  }

  const flushList = () => {
    if (!listItems.length) return
    blocks.push({ type: 'list', ordered: false, items: listItems })
    listItems = []
  }

  const flushOrderedList = () => {
    if (!orderedListItems.length) return
    blocks.push({ type: 'list', ordered: true, items: orderedListItems })
    orderedListItems = []
  }

  const flushCodeBlock = () => {
    if (!codeLines.length && !codeLanguage) return
    blocks.push({ type: 'code', language: codeLanguage, code: codeLines.join('\n') })
    codeLines = []
    codeLanguage = ''
  }

  const flushBlockquote = () => {
    if (!blockquoteLines.length) return
    blocks.push({ type: 'blockquote', text: blockquoteLines.join(' ').trim() })
    blockquoteLines = []
  }

  const flushTable = () => {
    if (!tableRows.length) return
    blocks.push({ type: 'table', rows: tableRows, aligns: tableAligns })
    tableRows = []
    tableAligns = []
    inTable = false
  }

  lines.forEach((line) => {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock()
        inCodeBlock = false
      } else {
        flushParagraph()
        flushList()
        flushOrderedList()
        flushBlockquote()
        codeLanguage = line.slice(3).trim()
        inCodeBlock = true
      }
      return
    }

    if (inCodeBlock) {
      codeLines.push(line)
      return
    }

    const trimmedLine = line.trim()

    if (!trimmedLine) {
      flushParagraph()
      flushList()
      flushOrderedList()
      flushBlockquote()
      return
    }

    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      flushParagraph()
      flushList()
      flushOrderedList()
      flushBlockquote()
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2].trim() })
      return
    }

    const unorderedListMatch = trimmedLine.match(/^[-*]\s+(.*)$/)
    if (unorderedListMatch) {
      flushParagraph()
      flushOrderedList()
      flushBlockquote()
      listItems.push(unorderedListMatch[1].trim())
      return
    }

    const orderedListMatch = trimmedLine.match(/^\d+\.\s+(.*)$/)
    if (orderedListMatch) {
      flushParagraph()
      flushList()
      flushBlockquote()
      orderedListItems.push(orderedListMatch[1].trim())
      return
    }

    if (trimmedLine.startsWith('>')) {
      flushParagraph()
      flushList()
      flushOrderedList()
      flushTable()
      blockquoteLines.push(trimmedLine.slice(1).trim())
      return
    }

    const isTableSeparator = trimmedLine.match(/^\|[\s:-]+\|[\s:-]+\|[\s:-]*\|?\s*$/)
    const isTableRow = trimmedLine.startsWith('|') && trimmedLine.endsWith('|')

    if (isTableRow) {
      flushParagraph()
      flushList()
      flushOrderedList()
      flushBlockquote()
      if (isTableSeparator) {
        const cells = trimmedLine.split('|').slice(1, -1)
        tableAligns = cells.map((cell) => {
          const trimmed = cell.trim()
          if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center'
          if (trimmed.endsWith(':')) return 'right'
          return 'left'
        })
        inTable = true
      } else {
        const cells = trimmedLine.split('|').slice(1, -1).map((c) => c.trim())
        if (cells.some((c) => c.includes('---'))) {
          flushTable()
        } else {
          if (inTable || tableRows.length > 0) {
            tableRows.push(cells)
          } else {
            blocks.push({ type: 'paragraph', text: paragraphLines.join(' ').trim() })
            paragraphLines = []
          }
        }
      }
      return
    }

    if (trimmedLine === '---' || trimmedLine === '***' || trimmedLine === '___') {
      flushParagraph()
      flushList()
      flushOrderedList()
      flushBlockquote()
      flushTable()
      blocks.push({ type: 'hr' })
      return
    }

    if (listItems.length) {
      listItems[listItems.length - 1] = `${listItems[listItems.length - 1]} ${trimmedLine}`
      return
    }

    if (orderedListItems.length) {
      orderedListItems[orderedListItems.length - 1] = `${orderedListItems[orderedListItems.length - 1]} ${trimmedLine}`
      return
    }

    if (blockquoteLines.length) {
      blockquoteLines[blockquoteLines.length - 1] = `${blockquoteLines[blockquoteLines.length - 1]} ${trimmedLine}`
      return
    }

    paragraphLines.push(trimmedLine)
  })

  flushParagraph()
  flushList()
  flushOrderedList()
  flushBlockquote()
  flushTable()
  if (inCodeBlock) flushCodeBlock()

  return blocks
}

function renderInlineMarkdown(text) {
  if (!text) return ''

  const segments = text.split(/(`[^`]+`)/g).filter(Boolean)

  return segments.map((segment) => {
    if (segment.startsWith('`') && segment.endsWith('`')) {
      return `<code>${escapeHtml(segment.slice(1, -1))}</code>`
    }

    let result = ''
    const linkRe = /\[([^\]]+)\]\(([^\s)]+)\)/g
    let lastIndex = 0
    let match

    while ((match = linkRe.exec(segment)) !== null) {
      const [full, label, href] = match
      const start = match.index

      if (start > lastIndex) {
        result += escapeHtml(segment.slice(lastIndex, start))
      }

      if (isSafeHref(href)) {
        const escapedLabel = escapeHtml(label)
        if (href.startsWith('http://') || href.startsWith('https://')) {
          result += `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapedLabel}</a>`
        } else {
          result += `<a href="${escapeHtml(href)}">${escapedLabel}</a>`
        }
      } else {
        result += escapeHtml(full)
      }

      lastIndex = start + full.length
    }

    if (lastIndex < segment.length) {
      result += escapeHtml(segment.slice(lastIndex))
    }

    result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    result = result.replace(/\*(.+?)\*/g, '<em>$1</em>')
    result = result.replace(/_(.+?)_/g, '<em>$1</em>')

    const urlRe = /(https?:\/\/[^\s]+)(?![^<]*>)/g
    let urlResult = ''
    let urlLastIndex = 0
    let urlMatch

    while ((urlMatch = urlRe.exec(result)) !== null) {
      const [full, href] = urlMatch
      const start = urlMatch.index

      if (start > urlLastIndex) {
        urlResult += result.slice(urlLastIndex, start)
      }

      urlResult += `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(href)}</a>`
      urlLastIndex = start + href.length
    }

    if (urlLastIndex < result.length) {
      urlResult += result.slice(urlLastIndex)
    }

    return urlResult
  }).join('')
}

function getSingleMarkdownLink(text) {
  const trimmedText = (text || '').trim()
  if (!trimmedText) return null

  const strictMatch = trimmedText.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/)
  if (strictMatch) {
    const [, label, href] = strictMatch
    return isSafeHref(href) ? { label, href } : null
  }

  return null
}

function normalizeComparableText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[«»"'`*_#()[\]{}<>.,:;!?/\\|–—-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function stripDuplicateIntroBlocks(blocks, { title, lead } = {}) {
  if (!Array.isArray(blocks) || blocks.length === 0) return blocks

  const normalizedTitle = normalizeComparableText(title)
  const normalizedLead = normalizeComparableText(lead)
  let didStripTitle = false
  let didStripLead = false

  return blocks.filter((block) => {
    if (!block) return false

    if (!didStripTitle && normalizedTitle && block.type === 'heading' && block.level === 1) {
      const normalizedHeading = normalizeComparableText(block.text)
      if (normalizedHeading && normalizedHeading === normalizedTitle) {
        didStripTitle = true
        return false
      }
    }

    if (!didStripLead && normalizedLead && block.type === 'paragraph') {
      const normalizedParagraph = normalizeComparableText(block.text)
      if (normalizedParagraph && normalizedParagraph === normalizedLead) {
        didStripLead = true
        return false
      }
    }

    return true
  })
}

function renderMarkdownToHtml(content, { title = '', lead = '' } = {}) {
  const blocks = stripDuplicateIntroBlocks(parseMarkdown(content), { title, lead })

  const htmlBlocks = blocks.map((block) => {
    if (block.type === 'heading') {
      if (block.level === 1) {
        return `<h1>${renderInlineMarkdown(block.text)}</h1>`
      }
      if (block.level === 2) {
        return `<h2>${renderInlineMarkdown(block.text)}</h2>`
      }
      if (block.level === 3) {
        return `<h3>${renderInlineMarkdown(block.text)}</h3>`
      }
      return `<h4>${renderInlineMarkdown(block.text)}</h4>`
    }

    if (block.type === 'list') {
      const ListTag = block.ordered ? 'ol' : 'ul'
      const items = block.items.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join('')
      return `<${ListTag}>${items}</${ListTag}>`
    }

    if (block.type === 'code') {
      const lang = block.language ? ` class="language-${escapeHtml(block.language)}"` : ''
      return `<pre class="article-code-block"><code${lang}>${escapeHtml(block.code)}</code></pre>`
    }

    if (block.type === 'blockquote') {
      return `<blockquote><p>${renderInlineMarkdown(block.text)}</p></blockquote>`
    }

    if (block.type === 'table') {
      const headerRow = block.rows[0] || []
      const dataRows = block.rows.slice(1)
      const aligns = block.aligns || []

      const theadCells = headerRow.map((cell, i) => {
        const align = aligns[i] || 'left'
        return `<th style="text-align:${align}">${renderInlineMarkdown(cell)}</th>`
      }).join('')

      const tbodyRows = dataRows.map((row) => {
        const cells = row.map((cell, i) => {
          const align = aligns[i] || 'left'
          return `<td style="text-align:${align}">${renderInlineMarkdown(cell)}</td>`
        }).join('')
        return `<tr>${cells}</tr>`
      }).join('')

      return `<div class="article-table-wrap"><table class="article-table"><thead><tr>${theadCells}</tr></thead><tbody>${tbodyRows}</tbody></table></div>`
    }

    if (block.type === 'hr') {
      return `<hr class="article-divider" />`
    }

    const ctaLink = getSingleMarkdownLink(block.text)
    if (ctaLink) {
      return `<div class="article-cta-row"><a href="${escapeHtml(ctaLink.href)}" class="article-cta-button">${escapeHtml(ctaLink.label)}</a></div>`
    }

    return `<p>${renderInlineMarkdown(block.text)}</p>`
  })

  return `<div class="article-markdown">${htmlBlocks.join('')}</div>`
}

export { renderMarkdownToHtml, escapeHtml }