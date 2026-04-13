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

function renderInline(text = '') {
  const segments = text.split(/(`[^`]+`)/g).filter(Boolean)

  return segments.map((segment, index) => {
    if (segment.startsWith('`') && segment.endsWith('`')) {
      return <code key={`${segment}-${index}`}>{segment.slice(1, -1)}</code>
    }

    return <span key={`${segment}-${index}`}>{segment}</span>
  })
}

function ArticleMarkdown({ content }) {
  const blocks = parseMarkdown(content)

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

        return <p key={`paragraph-${index}`}>{renderInline(block.text)}</p>
      })}
    </div>
  )
}

export default ArticleMarkdown
