# Split Views

> A split view is a layout of two or three adjacent panes where selecting an item in one pane updates the contents of the next, such as list to detail.

**When to use it:** Use a split view to show multiple levels of hierarchy at once on wide layouts with room for two or three columns.

**Guidelines**
- Persistently highlight the current selection in each pane that drives the next.
- Use multiple panes only on wide layouts; on narrow views, collapse to a single pane with drill-in navigation.
- For deep hierarchies, use three panes (such as sidebar, list, and detail) and verify the layout at every width.
- If panes are resizable, set sensible minimum and maximum sizes and keep the divider visibly grabbable while staying thin.
- Let people hide a pane for distraction-free focus, and provide multiple ways to bring it back.
- Consider drag-and-drop between panes; a single overall title is usually enough.

**Accessibility**
- Convey the current selection in each pane by more than color alone.
- Give each pane a clear name and keep a logical focus order across panes.
- Manage focus sensibly when panes collapse or expand at different widths.
- Make any resizable divider operable without a precise drag, and keep it large enough to target.
- Ensure controls meet an adequate touch target of roughly 44pt and maintain sufficient contrast.

**Avoid**
- Forcing multiple panes on compact widths, where content wraps and truncates.
- Dividers so thin or panes so small the divider becomes unusable.
- Hiding a pane with no clear way to bring it back.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/split-views)
