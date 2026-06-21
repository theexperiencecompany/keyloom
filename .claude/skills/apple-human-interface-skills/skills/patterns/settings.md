# Settings

> A place for general, infrequently changed preferences that customize the experience.

**When to use it:** For app-wide options (theme, account, defaults) people rarely change and that must persist across sessions; task-level options belong inline, not here.

**Guidelines**
- Ship strong defaults that suit most people so settings stay optional, and keep their number small.
- Keep task-specific options inline where they apply (filters, sort, show or hide), not buried in settings.
- Detect what you can (system appearance, language, locale) instead of asking.
- Respect system-level preferences such as reduced motion, color scheme, and contrast; don't duplicate or override them.
- Group related settings into clearly labeled sections, and restore the last-viewed section when people return.
- Make settings reachable in expected ways, with a clear menu or icon.

**Accessibility**
- Use clear, well-labeled controls and group related ones together.
- Reflect each control's current state clearly, and announce when a setting is applied if there's no immediate visual confirmation.
- Honor system accessibility preferences rather than forcing people to reconfigure them here.

**Avoid**
- Asking for setup information you could detect automatically.
- Duplicating global system settings inside the app.
- Putting frequently used, contextual controls on a separate settings page.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/settings)
