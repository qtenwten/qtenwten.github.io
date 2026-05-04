import { OutboundLink } from '../OutboundLink'

function parseMarkdown(content = '') {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let paragraphLines = []
  let listItems = []
  let orderedListItems = []
  let codeLines = []
  let codeLanguage = ''
  let inCodeBlock = false

  const flushParagraph = () => {
    if (!paragraphLines.length) {
      return
    }

    blocks.push({
      type: 'paragraph',
      text: paragraphLines.join(' ').trim(),
    })
    paragraphLines = []
  }

  const flushList = () => {
    if (!listItems.length) {
      return
    }

    blocks.push({
      type: 'list',
      ordered: false,
      items: listItems,
    })
    listItems = []
  }

  const flushOrderedList = () => {
    if (!orderedListItems.length) {
      return
    }

    blocks.push({
      type: 'list',
      ordered: true,
      items: orderedListItems,
    })
    orderedListItems = []
  }

  const flushCodeBlock = () => {
    if (!codeLines.length && !codeLanguage) {
      return
    }

    blocks.push({
      type: 'code',
      language: codeLanguage,
      code: codeLines.join('\n'),
    })
    codeLines = []
    codeLanguage = ''
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
      return
    }

    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.*)$/)
    if (headingMatch) {
      flushParagraph()
      flushList()
      flushOrderedList()
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      })
      return
    }

    const unorderedListMatch = trimmedLine.match(/^[-*]\s+(.*)$/)
    if (unorderedListMatch) {
      flushParagraph()
      flushOrderedList()
      listItems.push(unorderedListMatch[1].trim())
      return
    }

    const orderedListMatch = trimmedLine.match(/^\d+\.\s+(.*)$/)
    if (orderedListMatch) {
      flushParagraph()
      flushList()
      orderedListItems.push(orderedListMatch[1].trim())
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

    paragraphLines.push(trimmedLine)
  })

  flushParagraph()
  flushList()
  flushOrderedList()

  if (inCodeBlock) {
    flushCodeBlock()
  }

  return blocks
}

function isSafeHref(href) {
  if (typeof href !== 'string') return false
  return href.startsWith('http://')
    || href.startsWith('https://')
    || (/^\/(?!\/)[^\s]*$/.test(href) && !href.includes('\\'))
}

function isExternalHref(href) {
  return typeof href === 'string' && (href.startsWith('http://') || href.startsWith('https://'))
}

function MarkdownLink({ href, children, className }) {
  if (isExternalHref(href)) {
    return (
      <OutboundLink href={href} className={className} target="_blank" rel="noreferrer">
        {children}
      </OutboundLink>
    )
  }

  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}

function getSingleMarkdownLink(text = '') {
  if (typeof text !== 'string') {
    return null
  }

  const trimmedText = text.trim()
  if (!trimmedText) {
    return null
  }

  const strictMatch = trimmedText.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/)
  if (strictMatch) {
    const [, label, href] = strictMatch
    return isSafeHref(href) ? { label, href } : null
  }

  const linkMatch = trimmedText.match(/\[([^\]]+)\]\(([^\s)]+)\)/)
  if (linkMatch) {
    const [, label, href] = linkMatch
    return isSafeHref(href) ? { label, href } : null
  }

  return null
}

function renderInline(text = '') {
  // Preserve inline code first, then parse links in the remaining text.
  const segments = text.split(/(`[^`]+`)/g).filter(Boolean)

  return segments.map((segment, index) => {
    if (segment.startsWith('`') && segment.endsWith('`')) {
      return <code key={`${segment}-${index}`}>{segment.slice(1, -1)}</code>
    }

    const parts = []
    let remaining = segment
    const linkRe = /\[([^\]]+)\]\(([^\s)]+)\)/g
    let match
    let lastIndex = 0

    while ((match = linkRe.exec(segment)) !== null) {
      const [full, label, href] = match
      const start = match.index
      const end = start + full.length

      if (start > lastIndex) {
        parts.push(segment.slice(lastIndex, start))
      }

      if (isSafeHref(href)) {
        parts.push(
          <MarkdownLink key={`link-${index}-${start}`} href={href}>
            {label}
          </MarkdownLink>
        )
      } else {
        parts.push(full)
      }

      lastIndex = end
    }

    if (lastIndex < segment.length) {
      parts.push(segment.slice(lastIndex))
    }

    // Also auto-linkify bare https:// URLs for convenience.
    const autoParts = []
    const urlRe = /(https?:\/\/[^\s]+)(?![^<]*>)/g
    parts.forEach((item, partIndex) => {
      if (typeof item !== 'string') {
        autoParts.push(item)
        return
      }

      let cursor = 0
      let urlMatch
      while ((urlMatch = urlRe.exec(item)) !== null) {
        const href = urlMatch[1]
        const start = urlMatch.index
        const end = start + href.length

        if (start > cursor) {
          autoParts.push(item.slice(cursor, start))
        }

        if (isSafeHref(href)) {
          autoParts.push(
            <MarkdownLink key={`autolink-${index}-${partIndex}-${start}`} href={href}>
              {href}
            </MarkdownLink>
          )
        } else {
          autoParts.push(href)
        }

        cursor = end
      }

      if (cursor < item.length) {
        autoParts.push(item.slice(cursor))
      }
    })

    return <span key={`${segment}-${index}`}>{autoParts}</span>
  })
}

function normalizeComparableText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[«»"'`*_#()[\]{}<>.,:;!?/\\|–—-]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function stripDuplicateIntroBlocks(blocks, { title, lead } = {}) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return blocks
  }

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

function ArticleMarkdown({ content, title = '', lead = '' }) {
  const blocks = stripDuplicateIntroBlocks(parseMarkdown(content), { title, lead })

  return (
    <div className="article-markdown">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          if (block.level === 1) {
            return <h1 key={`heading-${index}`}>{block.text}</h1>
          }

          if (block.level === 2) {
            return <h2 key={`heading-${index}`}>{block.text}</h2>
          }

          if (block.level === 3) {
            return <h3 key={`heading-${index}`}>{block.text}</h3>
          }

          return <h4 key={`heading-${index}`}>{block.text}</h4>
        }

        if (block.type === 'list') {
          const ListTag = block.ordered ? 'ol' : 'ul'
          return (
            <ListTag key={`list-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`item-${itemIndex}`}>{renderInline(item)}</li>
              ))}
            </ListTag>
          )
        }

        if (block.type === 'code') {
          return (
            <pre key={`code-${index}`} className="article-code-block">
              <code>{block.code}</code>
            </pre>
          )
        }

        const ctaLink = getSingleMarkdownLink(block.text)
        if (ctaLink) {
          return (
            <div key={`cta-${index}`} className="article-cta-row">
              <MarkdownLink href={ctaLink.href} className="article-cta-button">
                {ctaLink.label}
              </MarkdownLink>
            </div>
          )
        }

        return <p key={`paragraph-${index}`}>{renderInline(block.text)}</p>
      })}
    </div>
  )
}

export default ArticleMarkdown
