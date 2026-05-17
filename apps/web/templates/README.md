# Project templates

Sample `Project` JSONs you can import into the studio once the import flow is wired up.

## Schema

```ts
type Project = {
  fps: number              // typically 60
  width: number            // typically 1920
  height: number           // typically 1080
  clips: Clip[]
}

type Clip = {
  id: string               // unique within the project
  compositionId: string    // must match an id in registry.ts
  durationInFrames: number // can be different from the composition's default duration
  props: Record<string, unknown>  // must match the composition's props shape
}
```

## Files

- **sample-launch.json** — 5-clip launch story (intro title → browser → tweet → chat → outro). ~30s @ 60fps. Uses `TitleSlideUp`, `BrowserWindow`, `TweetCard`, `WhatsAppMessages`, `TitleFade`.
- **gaia-whatsapp.json** — 6-clip "GAIA on WhatsApp" demo (notification → title → hero chat in phone frame → proof toast → tagline → typing-search CTA). ~33s @ 60fps. Uses `MessagePopup`, `TextSoftBlurIn`, `PhoneFrame` wrapping `WhatsAppMessages`, `Toast`, `TextLineByLineSlide`, `TypingSearch`. The hero chat is wrapped in `PhoneFrame` and passes the message thread through the `innerProps` pass-through on the frame, so edits to the chat live in this file (not the composition's `defaultProps`). First entry in a per-channel ad series — clone and swap the inner composition to produce the Slack / Telegram / Discord cuts.

## Notes

- `compositionId` must exactly match an id from `apps/remotion/src/registry.ts` (case-sensitive).
- `props` shape comes from each composition's `meta.ts` (`defaultProps`). Mismatched props will render with the missing fields as `undefined`.
- `id` on each clip just needs to be unique within the project — it doesn't have to be a UUID.
