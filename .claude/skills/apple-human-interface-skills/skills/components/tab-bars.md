# Tab Bars

> A tab bar is a persistent bar of top-level destinations that lets people switch between an app's main sections while preserving each section's state.

**When to use it:** Use a tab bar for top-level navigation between a small number of peer sections that must stay visible and quickly reachable.

**Guidelines**
- Use a tab bar for navigation, not actions; put commands that act on content in a toolbar.
- Keep the bar visible across sections, hiding it only under a full-screen modal experience.
- Keep the number of tabs small (about five or fewer); use a sidebar for complex hierarchies, and avoid overflow or "More" tabs.
- Keep every tab available even when its section is empty; explain the emptiness inside rather than disabling the tab.
- Include a short text label with each icon, and use familiar, recognizable icons.
- Use a badge only for critical or new information, and ensure the active state has sufficient contrast.
- On wide layouts, consider promoting the tab bar to a sidebar, and collapse back to a tab bar on narrow ones.

**Accessibility**
- Convey the selected tab by more than color alone.
- Include a text label with every tab rather than relying on icons alone.
- Give the bar and each tab a clear name and a logical focus order.
- Ensure each tab meets an adequate touch target of roughly 44pt.
- Maintain strong contrast for labels, icons, badges, and the active state.

**Avoid**
- Disabling or hiding individual tabs, which makes the bar look unstable.
- Using the bar for one-off actions instead of navigation.
- Icon-only tabs with no text labels.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
