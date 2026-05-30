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
  <video
    src="https://github.com/theexperiencecompany/motion-studio/raw/refs/heads/master/apps/remotion/public/motion.mp4"
    poster="apps/web/public/images/screenshots/studio.jpg"
    controls
    autoplay
    loop
    muted
    playsinline
    width="100%"
  >
    <a href="https://github.com/theexperiencecompany/motion-studio/raw/refs/heads/master/apps/remotion/public/motion.mp4">▶ Watch the Motion Studio showcase</a>
  </video>
</p>

<br />

<table align="center">
  <tr>
    <td width="50%" valign="top">
      <img src="apps/web/public/images/screenshots/components.jpg" alt="Browse the Motion Studio component library" />
      <p align="center"><sub><i>Browse 70+ animated scenes — every preview is a one-click drop onto the timeline.</i></sub></p>
    </td>
    <td width="50%" valign="top">
      <img src="apps/web/public/images/screenshots/studio.jpg" alt="The Motion Studio editor — timeline, preview and inspector" />
      <p align="center"><sub><i>Assemble scenes on a timeline, edit per-clip styling and transitions, export to MP4.</i></sub></p>
    </td>
  </tr>
</table>

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

---

## Star History

<p align="center">
  <a href="https://www.star-history.com/#theexperiencecompany/gaia&Date">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=theexperiencecompany/gaia&type=Date&theme=dark" />
      <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=theexperiencecompany/gaia&type=Date" />
      <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=theexperiencecompany/gaia&type=Date" />
    </picture>
  </a>
</p>

<p align="center">
  Made with ❤️ by
  <a href="https://experience.heygaia.io">
    <img src="https://img.shields.io/badge/The%20Experience%20Company-121212?logo=data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyOTE3IDI1OTYuMjIiPgogIDxkZWZzPgogICAgPHN0eWxlPgogICAgICAuY2xzLTEgewogICAgICAgIGZpbGw6ICNmZmY7CiAgICAgIH0KICAgIDwvc3R5bGU+CiAgPC9kZWZzPgogIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTE2MjIuNDQsMTE0MC44MmMtMTcxLjM2LDExNi43Ny0yMTQuNzcsMTM5Ljc0LTI1MC41MSwxOTEuMTktODguNzgsMTI3Ljc4LTk2LjE4LDI3MS45LTkyLjAxLDM1OS42NiwxLjM5LDI3OC44MS00LjY3LDU1MC4xNi0zLjI4LDgyOC45NiwzNDUuNjYtMTQ0LjQ4LDc3NS40OS0zOTcuMDgsMTExNy41LTgzOS45Myw2OC4xMS04OC4xOSw3NjQuMjktOTc0LjMyLDQzNC43Ni0xNDE0LjE0QzI2OTUuMDIsODcuODYsMjQ3Mi4xNyw5LjcxLDIyNTQuMTMsMS41NCwxMzI2Ljc5LTMzLjIsNDg3Ljc3LDUyNS40NywxNTEuOTUsMTExMi4yM2MtLjY0LDEuMTEtMS41NiwyLjczLTIuNzUsNC44Mi01Ni4zNSw5OS4zOS0yMjAuNzIsMzg5LjM2LTExMy44OSw1NDUuMjIsNTMuOTUsNzguNywxNTYuNzgsOTMuNjQsMTc2LjI5LDk2LjQ3LDExMi4zOCwxNi4zMywyMDUuNDUtMzUuNjEsMzE4LjQzLTEwMC45NywxNDguMjctODUuNzcsMjIyLjYzLTEyOC4yNSwyMjMuNjYtMTI4LjkzLDExMC44LTczLjAzLDI5Mi40NS0xMzYuMzUsNDY5LjU5LTI2OS43LjI5LS4yMi01LjQ1LDMuMjctMTYuMzMsOS43OS0xNi43NiwxMC4wNC0zMDguNjksMTE2LjYzLTM5Mi42OCwxNzUuMDYtMTM4LjQ4LDk2LjM0LTUxMC40LDE2Ny44LTU3NC44NSw0OS4zNC02OS44My0xMjguMzMsMTc5Ljg1LTQ1Ni4xOSwyNTguODQtNTYwLjgyLjgxLTEuMDcsNy42Ny0xMC4wNSwxNC40Ny0xOC44NSwzMDguMDItMzk3Ljg0LDcwNC4zNS01NTAuNjgsNzc1LjgzLTU3Ny4yLDM4NC44Mi0xNDIuNzksOTM4LjgxLTE5Ny4xMiwxMDIwLjExLTIxLjE5LDc0LjQ0LDE2MS4xLTE0Mi41OSw0MjAuNDMtMzIxLjkxLDU1OC42OCIvPgogIDxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTcyNS4yNiwxNjEyLjcyYy0xMDUuMiw1NC45NC0xOTUuMTQsODguMDYtMjQ3LjQyLDEwNS42NS0xNzYuMDYsNTkuMjUtMjMxLjc3LDMxLjk2LTIzOC4xNCwxMS4xNS04LjU1LTI3LjkxLDE4NS40MS05Ny45NiwyMDkuOTItMTA3LjUxLDc0LjMyLTI4LjkzLDk5LjQ5LTM2Ljc3LDE2My41Ny02NS4wOCw0NS4zMi0yMC4wMiwxNDIuNC02Ni4xNSwyNDMuNTItMTQ0LjA1LDEwLjk1LTguNDMsMjAuMDctMTUuMzgsMzIuMjItMjUuOTIsNDAuMTEtMzQuNzcsOTAuNzItODEuMzksMTMyLjczLTE1OC4zNCwzNy44My02OS4yOSw0OS45My0xNjUuODMsNTQuMDUtMjUyLjUyLDQuMDktLjk5LDIuNjIsNy40MiwyLjk2LDExLjQ0LDcuMjYsODcuNDksMTQuODQsMjM4LjU2LDk3LjU3LDI0NS42OCw2MS42Miw1LjMxLDExMy4xNi0yNy42OSwxNjguNTQtNTMuNzcsMi4yMS0xLjA0LDcuNi00LjU5LDcuMzIsMS40Ny03Mi4wOCw0OC4wMS0xMjAuMzcsOTQuODEtMTQ5LjQ3LDEyNi40Ni0zOS4zOCw0Mi44Mi01Ny43Myw3My4yNi02OS4wMiw5NS4xOS01Ljk5LDExLjY0LTE2LjM5LDMyLjEtMjQuODIsNjAuMzctMjUuMzIsODQuOTgtMjkuMTIsMjI4LjQyLTI5LjEsMjM0LjkxLDAsMCwwLC4xNi0uMDQuMTctMS41Ni4yOS0yMy43OS0yMjQuNi04My45NC0yNDMuNzMtMTIuMjgtMy45MS0yNy44NS0uNzItMzEuNDkuNzUtMTQuMjEsNS43MS0xMTAuODIsOTAuNzYtMjM4Ljk3LDE1Ny42OFoiLz4KPC9zdmc+" alt="The Experience Company" />
  </a>
  <br />
  <a href="https://heygaia.io">heygaia.io</a> • <a href="https://docs.heygaia.io">Documentation</a> • <a href="https://heygaia.io/contact">Contact Us</a>
</p>

## Contributing

<p align="center">
  <a href="https://github.com/theexperiencecompany/gaia/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=theexperiencecompany/gaia" alt="Contributors" />
  </a>
</p>
