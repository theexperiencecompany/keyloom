# Windows

> A window is the bounded surface that presents an app's content.

**When to use it:** Use the main window as the primary surface for navigation and content, and use additional windows only for auxiliary surfaces where multitasking genuinely helps.

**Guidelines**
- Make layouts adapt fluidly across sizes so they support resizing and side-by-side use.
- Open a new window only when it genuinely helps; too many create clutter.
- Offer "open in new window" as an explicit choice rather than default behavior.
- Set sensible minimum and maximum sizes so the layout never breaks at extremes.
- Don't fake native window chrome or controls; rely on the platform's real frame.
- Account for system-provided overlays and safe areas, and inset content accordingly.

**Accessibility**
- Preserve a logical focus and reading order as the layout reflows across sizes.
- Give each window a descriptive title and move focus to it when it opens.
- Keep the layout usable at high zoom and small sizes, with nothing clipped or unreachable.
- Convey transitions between windows so they're perceivable without sight.
- Ensure controls meet an adequate touch target of roughly 44pt and keep sufficient contrast.

**Avoid**
- Opening new windows as default behavior.
- Custom window frames or controls that imitate the operating system.
- Layouts that overlap or clip content at extreme sizes.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/windows)
