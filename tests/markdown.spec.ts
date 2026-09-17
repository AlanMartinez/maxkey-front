import { describe, expect, it } from 'vitest'
import { renderMarkdown, stripMarkdown } from '~/utils/markdown'

describe('renderMarkdown', () => {
  it('renders bold, italic, and bullet lists with the project\'s Tailwind classes', () => {
    const html = renderMarkdown('**bold** and *italic*\n\n- one\n- two')

    expect(html).toContain('<strong class="font-semibold text-white">bold</strong>')
    expect(html).toContain('<em class="italic">italic</em>')
    expect(html).toContain('<ul')
    expect(html).toContain('<li>one</li>')
    expect(html).toContain('<li>two</li>')
  })

  it('opens links in a new tab without leaking window.opener', () => {
    const html = renderMarkdown('[guía](https://example.com/guide)')

    expect(html).toContain('href="https://example.com/guide"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('strips script tags and inline event handlers — admin-authored Markdown is never trusted as safe HTML', () => {
    const html = renderMarkdown('<script>alert(1)</script>Hola <img src=x onerror="alert(2)">')

    expect(html).not.toContain('<script')
    expect(html).not.toContain('onerror')
  })
})

describe('stripMarkdown', () => {
  it('returns plain text with no Markdown syntax characters', () => {
    expect(stripMarkdown('**bold** and *italic*, plus a\n- list\n- item')).toBe('bold and italic, plus a list item')
  })
})
