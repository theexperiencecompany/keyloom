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
import WhatsAppMessagesMDX, {
  meta as whatsappMessagesMeta,
} from "@/content/docs/whatsapp-messages.mdx"
import SlackMessagesMDX, {
  meta as slackMessagesMeta,
} from "@/content/docs/slack-messages.mdx"
import DiscordMessagesMDX, {
  meta as discordMessagesMeta,
} from "@/content/docs/discord-messages.mdx"
import PhoneFrameMDX, {
  meta as phoneFrameMeta,
} from "@/content/docs/phone-frame.mdx"
import LaptopFrameMDX, {
  meta as laptopFrameMeta,
} from "@/content/docs/laptop-frame.mdx"
import SplitSceneMDX, {
  meta as splitSceneMeta,
} from "@/content/docs/split-scene.mdx"
import TitleSlideUpMDX, {
  meta as titleSlideUpMeta,
} from "@/content/docs/title-slide-up.mdx"
import TitleTypeMDX, {
  meta as titleTypeMeta,
} from "@/content/docs/title-type.mdx"
import TitlePopupMDX, {
  meta as titlePopupMeta,
} from "@/content/docs/title-popup.mdx"
import TitleFadeMDX, {
  meta as titleFadeMeta,
} from "@/content/docs/title-fade.mdx"
import TypingSearchMDX, {
  meta as typingSearchMeta,
} from "@/content/docs/typing-search.mdx"
import StatCounterMDX, {
  meta as statCounterMeta,
} from "@/content/docs/stat-counter.mdx"
import TweetCardMDX, {
  meta as tweetCardMeta,
} from "@/content/docs/tweet-card.mdx"
import TwitterFollowMDX, {
  meta as twitterFollowMeta,
} from "@/content/docs/twitter-follow.mdx"
import CursorWalkthroughMDX, {
  meta as cursorWalkthroughMeta,
} from "@/content/docs/cursor-walkthrough.mdx"
import BrowserWindowMDX, {
  meta as browserWindowMeta,
} from "@/content/docs/browser-window.mdx"
import CaptionTrackMDX, {
  meta as captionTrackMeta,
} from "@/content/docs/caption-track.mdx"

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
    slug: "TitleSlideUp",
    href: "/docs/TitleSlideUp",
    meta: titleSlideUpMeta,
    Content: TitleSlideUpMDX,
  },
  {
    slug: "TitleType",
    href: "/docs/TitleType",
    meta: titleTypeMeta,
    Content: TitleTypeMDX,
  },
  {
    slug: "TitlePopup",
    href: "/docs/TitlePopup",
    meta: titlePopupMeta,
    Content: TitlePopupMDX,
  },
  {
    slug: "TitleFade",
    href: "/docs/TitleFade",
    meta: titleFadeMeta,
    Content: TitleFadeMDX,
  },
  {
    slug: "TypingSearch",
    href: "/docs/TypingSearch",
    meta: typingSearchMeta,
    Content: TypingSearchMDX,
  },
  {
    slug: "StatCounter",
    href: "/docs/StatCounter",
    meta: statCounterMeta,
    Content: StatCounterMDX,
  },
  {
    slug: "TweetCard",
    href: "/docs/TweetCard",
    meta: tweetCardMeta,
    Content: TweetCardMDX,
  },
  {
    slug: "TwitterFollow",
    href: "/docs/TwitterFollow",
    meta: twitterFollowMeta,
    Content: TwitterFollowMDX,
  },
  {
    slug: "CursorWalkthrough",
    href: "/docs/CursorWalkthrough",
    meta: cursorWalkthroughMeta,
    Content: CursorWalkthroughMDX,
  },
  {
    slug: "BrowserWindow",
    href: "/docs/BrowserWindow",
    meta: browserWindowMeta,
    Content: BrowserWindowMDX,
  },
  {
    slug: "CaptionTrack",
    href: "/docs/CaptionTrack",
    meta: captionTrackMeta,
    Content: CaptionTrackMDX,
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
  {
    slug: "WhatsAppMessages",
    href: "/docs/WhatsAppMessages",
    meta: whatsappMessagesMeta,
    Content: WhatsAppMessagesMDX,
  },
  {
    slug: "SlackMessages",
    href: "/docs/SlackMessages",
    meta: slackMessagesMeta,
    Content: SlackMessagesMDX,
  },
  {
    slug: "DiscordMessages",
    href: "/docs/DiscordMessages",
    meta: discordMessagesMeta,
    Content: DiscordMessagesMDX,
  },
  {
    slug: "PhoneFrame",
    href: "/docs/PhoneFrame",
    meta: phoneFrameMeta,
    Content: PhoneFrameMDX,
  },
  {
    slug: "LaptopFrame",
    href: "/docs/LaptopFrame",
    meta: laptopFrameMeta,
    Content: LaptopFrameMDX,
  },
  {
    slug: "SplitScene",
    href: "/docs/SplitScene",
    meta: splitSceneMeta,
    Content: SplitSceneMDX,
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
