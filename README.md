<<<<<<< HEAD
<p align="center">
  <img src="apps/web/public/images/clapperboard.png" alt="Motion Studio" width="160" />
</p>

<h1 align="center">Motion Studio</h1>

<p align="center">
  An open-source library of animated video primitives, plus a browser studio to assemble them — built on <a href="https://www.remotion.dev">Remotion</a>.
</p>

<p align="center">
  By <a href="https://github.com/theexperiencecompany">TheExperienceCompany</a>
</p>

<p align="center">
  <a href="https://github.com/theexperiencecompany/motion-studio/blob/master/LICENSE"><img src="https://img.shields.io/github/license/theexperiencecompany/motion-studio?color=blue" alt="License" /></a>
  <a href="https://github.com/theexperiencecompany/motion-studio/stargazers"><img src="https://img.shields.io/github/stars/theexperiencecompany/motion-studio?style=flat&logo=github&color=yellow" alt="Stars" /></a>
  <a href="https://github.com/theexperiencecompany/motion-studio/commits/master"><img src="https://img.shields.io/github/commit-activity/m/theexperiencecompany/motion-studio" alt="Last update" /></a>
  <a href="https://github.com/theexperiencecompany/motion-studio/issues"><img src="https://img.shields.io/github/issues/theexperiencecompany/motion-studio" alt="Issues" /></a>
  <a href="https://deepwiki.com/theexperiencecompany/motion-studio"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki" /></a>
</p>

<p align="center">
  <a href="https://heygaia.io"><img src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/theexperiencecompany/gaia/refs/heads/master/apps/web/public/badge.json" alt="GAIA" /></a>
  <a href="https://docs.heygaia.io"><img src="https://img.shields.io/badge/Documentation-00bbff?style=flat&logo=gitbook&logoColor=white" alt="Documentation" /></a>
  <a href="https://discord.heygaia.io"><img src="https://discord-live-members-count-badge.vercel.app/api/discord-members?guildId=585464664650022914&color=5c6af3&label=Discord" alt="Discord" /></a>
  <a href="https://x.com/intent/user?screen_name=trygaia"><img src="https://img.shields.io/twitter/follow/trygaia?style=social" alt="Twitter" /></a>
  <a href="https://whatsapp.heygaia.io"><img src="https://img.shields.io/badge/WhatsApp-25D366?logo=whatsapp&logoColor=fff&style=flat" alt="WhatsApp" /></a>
</p>

<br />

<p align="center">
  <picture>
    <img src="apps/web/public/images/screenshots/components.jpg" alt="Browse the Motion Studio component library" width="100%" />
  </picture>
  <br />
  <sub><i>Browse 70+ animated scenes — every preview is a one-click drop onto the timeline.</i></sub>
</p>

<br />

<p align="center">
  <picture>
    <img src="apps/web/public/images/screenshots/studio.jpg" alt="The Motion Studio editor — timeline, preview and inspector" width="100%" />
  </picture>
  <br />
  <sub><i>Assemble scenes on a timeline, edit per-clip styling and transitions, export to MP4.</i></sub>
</p>

---

## What this is

A set of high-quality, animated video scenes — every scene is a single React component you can copy into your own project. On top of that lives a browser-based **Studio** for stitching scenes on a timeline, configuring per-clip styling and transitions, and exporting to MP4.

No SDK. No install. The library and the studio share the same scene registry, so anything you see in the docs is one click away from being on a timeline.

## Two ways to use it

- **You drive it.** Open the Studio, pick scenes from the Library, edit props in the Inspector, set transitions, hit Export.
- **An agent drives it.** Every scene has a typed props interface that AI coding agents (Claude Code, Codex, Cursor) read trivially. Tell an agent "build me a 12-second SaaS launch reel" and it composes `TitlePopup` → `Terminal` → `BarChart` → `Toast` → `LogoCloud` for you.

## What's inside

- **70+ scenes** — text animations, animated charts (bar / line / area / pie / radar / radial), brand-locked chat (iMessage, WhatsApp, Slack, Discord, Telegram, Instagram), tweets, frame mockups (phone / laptop / browser), feature & pricing cards, terminal, toast, GitHub star button, and more.
- **Universal style controls** — every non-brand-locked scene exposes background / text / font / accent so you can match a brand kit in seconds.
- **Per-clip transitions** — fade, swipe, zoom between scenes.
- **Stackable effects** — fade-out, slide-out, Ken Burns, zoom-out layered on top of any clip.
- **Project save / load** as JSON, plus MP4 export.

## Repo layout

```
apps/
  web/        Next.js app — the Studio, docs, and registry-driven pages
  remotion/   Remotion compositions (every scene lives here)
packages/
  ui/         Shared shadcn/ui components
```

## Getting started

```bash
bun install
bun run --cwd apps/web dev
```

Then open [http://localhost:3000/studio](http://localhost:3000/studio).

## License

MIT.
=======
# Motion Studio
By [TheExperienceCompany](https://github.com/theexperiencecompany)

<p align="center">
  <video src="https://github.com/theexperiencecompany/motion-studio/raw/master/apps/remotion/public/motion.mp4" controls autoplay loop muted playsinline width="100%"></video>
</p>

<p align="center">
  <a href="apps/remotion/public/motion.mp4">▶ Watch the showcase</a>
</p>
>>>>>>> 8deffd0 (feat(readme): update README with video showcase and link)
