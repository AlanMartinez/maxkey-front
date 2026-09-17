import { Marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'
import type { RendererObject, Tokens } from 'marked'

// Renders admin-authored product descriptions (bold/italic/bullets — see admin-catalog-crud contract).
// Tailwind classes are injected here instead of a `<style>` block to match this codebase's convention
// of styling entirely through utility classes, even for `v-html` content.
const renderer: RendererObject = {
  paragraph({ tokens }: Tokens.Paragraph) {
    return `<p class="mb-3 last:mb-0">${this.parser.parseInline(tokens)}</p>`
  },
  strong({ tokens }: Tokens.Strong) {
    return `<strong class="font-semibold text-white">${this.parser.parseInline(tokens)}</strong>`
  },
  em({ tokens }: Tokens.Em) {
    return `<em class="italic">${this.parser.parseInline(tokens)}</em>`
  },
  del({ tokens }: Tokens.Del) {
    return `<del class="text-white/40">${this.parser.parseInline(tokens)}</del>`
  },
  codespan({ text }: Tokens.Codespan) {
    return `<code class="rounded bg-white/10 px-1 py-0.5 text-xs">${text}</code>`
  },
  link({ href, title, tokens }: Tokens.Link) {
    const titleAttr = title ? ` title="${title}"` : ''
    return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer" class="text-accent underline hover:text-accent-hover">${this.parser.parseInline(tokens)}</a>`
  },
  heading({ tokens, depth }: Tokens.Heading) {
    const size = depth <= 2 ? 'text-base' : 'text-sm'
    return `<h${depth} class="mb-2 mt-4 ${size} font-semibold text-white first:mt-0">${this.parser.parseInline(tokens)}</h${depth}>`
  },
  blockquote({ tokens }: Tokens.Blockquote) {
    return `<blockquote class="mb-3 border-l-2 border-white/20 pl-3 italic text-white/60 last:mb-0">${this.parser.parse(tokens)}</blockquote>`
  },
  list(token: Tokens.List) {
    const items = token.items.map((item) => this.listitem(item)).join('')
    const tag = token.ordered ? 'ol' : 'ul'
    const listStyle = token.ordered ? 'list-decimal' : 'list-disc'
    const start = token.ordered && token.start !== 1 ? ` start="${token.start}"` : ''
    return `<${tag}${start} class="mb-3 flex flex-col gap-1.5 pl-5 ${listStyle} last:mb-0">${items}</${tag}>`
  },
  listitem(item: Tokens.ListItem) {
    return `<li>${this.parser.parse(item.tokens)}</li>`
  },
}

const md = new Marked({ gfm: true, breaks: true })
md.use({ renderer })

/** Renders admin-authored Markdown to sanitized HTML — safe to bind via `v-html`. */
export function renderMarkdown(source: string): string {
  // `target` isn't in DOMPurify's default attribute allow-list, so external links would silently
  // lose `target="_blank"` (the `rel="noopener noreferrer"` renderer already sets stays either way).
  return DOMPurify.sanitize(md.parse(source, { async: false }) as string, { ADD_ATTR: ['target'] })
}

/**
 * Plain-text rendering of Markdown source, for the short teaser on the product page — showing raw
 * `**`/`-`/`#` syntax in a one-line preview would look broken, so this strips formatting entirely.
 */
export function stripMarkdown(source: string): string {
  const html = md.parse(source, { async: false }) as string
  return html
    // Only block-level closings introduce a word boundary; stripping inline tags (em/strong/a/code)
    // as plain removals avoids injecting a stray space before trailing punctuation.
    .replace(/<\/(p|li|h[1-6]|blockquote|div|tr)>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
