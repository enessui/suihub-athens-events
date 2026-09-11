import sanitizeHtml from 'sanitize-html'
import type { GuidelinesContent } from '@/lib/guidelines'

// The guidelines rich-text editor only produces bold / italic / underline.
// Allow those tags (and layout tags contentEditable emits) and strip everything
// else — scripts, event handlers, styles, iframes — so stored content can't
// become XSS when rendered with dangerouslySetInnerHTML.
export function cleanRichText(html: string): string {
  return sanitizeHtml(html ?? '', {
    allowedTags: ['b', 'strong', 'i', 'em', 'u', 'br', 'p', 'div', 'span'],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  })
}

// Sanitize every string field of the guidelines content before it is rendered.
export function sanitizeGuidelines(c: GuidelinesContent): GuidelinesContent {
  return {
    purpose: cleanRichText(c.purpose),
    requestSteps: c.requestSteps.map(cleanRichText),
    eventTypes: c.eventTypes.map(cleanRichText),
    eventTypesNote: cleanRichText(c.eventTypesNote),
    spaceRules: c.spaceRules.map((r) => ({
      label: cleanRichText(r.label),
      value: cleanRichText(r.value),
    })),
    requirementsIntro: cleanRichText(c.requirementsIntro),
    requirementsSteps: c.requirementsSteps.map(cleanRichText),
    coorganiserSteps: c.coorganiserSteps.map(cleanRichText),
    conduct: cleanRichText(c.conduct),
  }
}
