# File Management

> Letting people create, open, save, browse, and preview documents and files within an app.

**When to use it:** For experiences that let people open, edit, save, or attach documents and files, such as editors, uploaders, and document viewers.

**Guidelines**
- Give convenient ways to create and open files: a visible New or Add control plus familiar shortcuts.
- If you build a custom file browser, mirror people's mental model; open at the most relevant location but let them navigate freely.
- Save continuously and automatically rather than forcing an explicit Save; persist on edit, on close, and when switching away.
- When automatic saving isn't possible, clearly signal unsaved changes and prompt to save before leaving.
- Hide file extensions by default but let people reveal them, and reflect that choice consistently.
- Let people choose the destination and format when saving or exporting, with a sensible default name and location.
- Provide previews so people can view a file without fully opening it, even for types your app can't edit.

**Accessibility**
- Make pickers and custom browsers navigable in a logical order with clearly labeled controls and adequate target sizes.
- Announce save status changes (saved, unsaved, saving) so people using assistive technology stay informed.
- Provide text alternatives for file thumbnails and preview controls.

**Avoid**
- Forcing manual saves with no safety net against lost work.
- Showing an "unsaved" indicator while changes are already being saved automatically.

**Full reference:** [full reference](https://developer.apple.com/design/human-interface-guidelines/file-management)
