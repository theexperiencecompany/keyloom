# Embedded Content

> Embedded content displays external rich content such as web pages or media inline within your own screen.

**When to use it:** To show external content inline — a rendered message, a help article, or a third-party widget — or to briefly surface an outside source within your app's context.

**Guidelines**
- Offer forward and back navigation only when people visit multiple pages, with explicit, visible controls.
- Don't rebuild a full browser inside an embed — link out for general browsing.
- Defer loading of off-screen embeds so the surrounding experience stays fast.
- Show only trusted content and request only the access it genuinely needs.
- Size the embed to its content and let it adapt responsively.

**Accessibility**
- Give each embed a descriptive label so people understand what it contains.
- Keep the embedded content reachable in a sensible focus order and don't trap focus inside it.
- Ensure the embedded content itself is perceivable to assistive technology.
- Provide a meaningful fallback or message if the embed fails to load.

**Avoid**
- Replicating full browser functionality inside the app.
- Untitled embeds or showing untrusted content without safeguards.

**Full reference:** [web-views.md](https://developer.apple.com/design/human-interface-guidelines/web-views)
