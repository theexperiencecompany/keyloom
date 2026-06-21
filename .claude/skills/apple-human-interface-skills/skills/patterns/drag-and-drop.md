# Drag and Drop

> Moving or copying content by dragging a selection from a source location to a destination.

**When to use it:** For reordering lists or boards, moving items between containers, or transferring content between views or apps.

**Guidelines**
- Support drag where people expect it, but always offer a non-drag alternative such as a menu or button; dragging is hard for some people.
- Decide move versus copy by context (within a container suggests move, across containers suggests copy) and honor that convention to prevent accidental data loss.
- Support dragging multiple items where it makes sense; let people undo a drop or confirm an irreversible one.
- Show a clear, translucent preview of what's being dragged so people stay oriented.
- Clearly distinguish valid from invalid drop targets, and give feedback when an item leaves a target.
- On an invalid drop, animate the item back to its source; auto-scroll near container edges; show progress for slow transfers.

**Accessibility**
- Provide a fully keyboard- and switch-operable alternative (move buttons, cut and paste, reorder controls) so dragging is never the only way.
- Announce drag start, valid targets, and drop results to people using assistive technology.
- Use clear position cues and labels, not color alone, to signal valid drop zones; respect reduced-motion preferences for drag animations.

**Avoid**
- Making drag the only way to perform an action.
- Unexpected move or copy behavior, or no feedback on hover or an invalid drop.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/drag-and-drop)
