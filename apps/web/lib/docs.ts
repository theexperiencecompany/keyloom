import type { ComponentType } from "react"

import IntroductionMDX, {
  meta as introductionMeta,
} from "@/content/docs/introduction.mdx"
import MessagePopupMDX, {
  meta as messagePopupMeta,
} from "@/content/docs/message-popup.mdx"
import MessageBubblesMDX, {
  meta as messageBubblesMeta,
} from "@/content/docs/message-bubbles.mdx"

export type DocTocItem = { label: string; id: string }

export type DocMeta = {
  title: string
  description: string
  toc: DocTocItem[]
}

export type Doc = {
  slug: string
  href: string
  meta: DocMeta
  Content: ComponentType
}

export const docs: Doc[] = [
  {
    slug: "introduction",
    href: "/docs",
    meta: introductionMeta,
    Content: IntroductionMDX,
  },
  {
    slug: "MessagePopup",
    href: "/docs/MessagePopup",
    meta: messagePopupMeta,
    Content: MessagePopupMDX,
  },
  {
    slug: "MessageBubbles",
    href: "/docs/MessageBubbles",
    meta: messageBubblesMeta,
    Content: MessageBubblesMDX,
  },
]

const docsBySlug: Record<string, Doc> = Object.fromEntries(
  docs.map((d) => [d.slug, d]),
)

export function getDoc(slug: string): Doc | undefined {
  return docsBySlug[slug]
}

export function getAdjacent(slug: string): {
  prev: { href: string; label: string } | null
  next: { href: string; label: string } | null
} {
  const i = docs.findIndex((d) => d.slug === slug)
  if (i < 0) return { prev: null, next: null }
  const prev = i > 0 ? docs[i - 1]! : null
  const next = i < docs.length - 1 ? docs[i + 1]! : null
  return {
    prev: prev ? { href: prev.href, label: prev.meta.title } : null,
    next: next ? { href: next.href, label: next.meta.title } : null,
  }
}
