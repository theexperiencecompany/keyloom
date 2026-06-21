<p align="center">
  <img src="https://docs-assets.developer.apple.com/published/fcb6f603e6672e3443637efe652e5bdb/platforms-iOS-intro%402x.png" width="620" alt="Apple platforms">
</p>

<h1 align="center">Apple Human Interface Skills</h1>

<p align="center">
  <img src="https://img.shields.io/badge/source-Apple%20HIG-000000?logo=apple&logoColor=white" alt="Source: Apple HIG">
  <img src="https://img.shields.io/badge/format-Agent%20Skill-7c3aed" alt="Format: Agent Skill">
  <img src="https://img.shields.io/badge/design%20skills-65-0a84ff" alt="65 design skills">
  <img src="https://img.shields.io/badge/reference%20pages-172-0a84ff" alt="172 reference pages">
  <img src="https://img.shields.io/badge/scope-design%20only-34c759" alt="Design only">
</p>

<p align="center">
  <img src="https://docs-assets.developer.apple.com/published/10ec5551985c77cabaeaaaff016cdfd8/foundations-color-intro%402x.png" width="150" alt="Color">
  <img src="https://docs-assets.developer.apple.com/published/d90940d120149af7220e4fedfd1c10bd/foundations-typography-intro%402x.png" width="150" alt="Typography">
  <img src="https://docs-assets.developer.apple.com/published/fe3e14f290a6986d2490634a9e2fab0c/foundations-layout-intro%402x.png" width="150" alt="Layout">
  <img src="https://docs-assets.developer.apple.com/published/2bed567b2804738b174adfe4cbfecb17/foundations-materials-intro%402x.png" width="150" alt="Materials">
  <img src="https://docs-assets.developer.apple.com/published/1a0efd7807cfcba7a5821be86b20bafc/foundations-motion-intro%402x.png" width="150" alt="Motion">
</p>

Apple's Human Interface Guidelines are some of the best design writing out there, but they're spread across ~170 web pages. I wanted that thinking in a form an AI could actually follow while designing something, so I scraped the whole thing and boiled the useful parts down.

The goal is simple: give an agent good design taste. Not "use this component," just Apple's principles for what makes an interface clear, calm, and easy to use.

## What's here

Every HIG page, pulled down and turned into Markdown, plus a short distilled file for each design topic. Each one says what the thing is, when it's the right choice, the guidelines to follow, the accessibility points to keep in mind, and the mistakes to avoid.

It's design guidance on purpose — it tells you how something should look and behave, never which framework or code to build it with. That part's up to you.

## Layout

```
SKILL.md      the entry point: a short intro and a table that points to the right topic
skills/       65 short design skills — foundations, patterns, components, interaction
```

Each skill links to its full Apple HIG page on developer.apple.com if you want the complete original text.

## Install

This repo is an [Agent Skill](https://docs.claude.com/en/docs/agents-and-tools/agent-skills) — a folder with a `SKILL.md`. Installing it just means dropping that folder where your agent looks for skills.

**Claude Code** — clone it into your skills folder:

```bash
# every project:
git clone https://github.com/sankalpaacharya/apple-human-interface-skills.git \
  ~/.claude/skills/apple-human-interface-skills

# or a single project:
git clone https://github.com/sankalpaacharya/apple-human-interface-skills.git \
  .claude/skills/apple-human-interface-skills
```

Claude then loads it automatically whenever your request matches what it's for — "design this screen," "review my UI," "lay out a settings page." No command to remember.

**Any other agent (Cursor, your own tooling, etc.)** — clone the repo anywhere and tell the agent to read `SKILL.md` first. It routes itself from there.

## Using it

Once installed, you don't really "call" it — just ask your agent to design or review something and it pulls the relevant topic in. Under the hood it reads the router in `SKILL.md`, opens the one file it needs (designing a modal? `sheets.md`), and applies the guidance. Every skill links back to the original Apple page if you want the full version.

## Credit

Everything here is from Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines) — I just scraped it (June 2026) and reorganized it. It's Apple's work; this is an unofficial reference, and the image up top is theirs too.
