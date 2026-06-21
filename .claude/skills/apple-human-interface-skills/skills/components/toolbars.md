# Toolbars

> A toolbar is a horizontal bar of frequently used commands, controls, navigation, and search along the top or bottom edge of a view, acting on the current content.

**When to use it:** Use a toolbar for actions that operate on the current view's content, and for hosting the view's title, navigation controls, and search.

**Guidelines**
- Choose items deliberately to avoid overcrowding, and decide which move into an overflow menu as space shrinks rather than overflowing by default.
- Prioritize the most frequent actions, pushing secondary ones into overflow.
- Prefer recognizable icon buttons over text for most actions, using familiar standard symbols.
- Group items logically into a few groups, and keep grouping and placement consistent across views and sizes.
- Position items by role: navigation and title leading, common controls in the center, and the primary action, search, and overflow trailing.
- Give one prominent action at most, on the trailing side, and keep text-labeled buttons spaced apart.
- Use standard navigation and close controls, and keep the title concise — never the app name.

**Accessibility**
- Give every icon-only action a clear name so its purpose isn't conveyed by the icon alone.
- Provide a logical focus order across the bar and a visible focus indicator.
- Ensure each toolbar action is also reachable another way, such as through a menu.
- Make every action meet an adequate touch target of roughly 44pt.
- Maintain sufficient contrast for icons, labels, and the prominent action.

**Avoid**
- Using a toolbar for primary section navigation, which belongs in a tab bar.
- More than a few control groups, or running text labels together.
- Overcrowding the bar, or adding an overflow menu when none is needed.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/toolbars)
