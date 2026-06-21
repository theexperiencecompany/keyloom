---
name: apple-human-interface-skills
description: Apple's Human Interface Guidelines distilled into design principles an AI can follow to make better-looking, better-behaved interfaces. Use when designing or reviewing any UI: laying out a screen, choosing and placing a component (button, sheet, tab bar, menu, form field, list, alert), designing a flow (onboarding, search, loading, feedback, settings, notifications), or applying foundations (color, typography, layout, spacing, hierarchy, dark mode, motion, accessibility). Each skill gives Apple's guidance, accessibility considerations, and anti-patterns. This is design guidance only — it does not prescribe frameworks, components, or code.
---

# Apple Human Interface Skills

Apple's Human Interface Guidelines, distilled into short design-principle files so an AI follows good design instead of guessing. Each file covers one topic: what it is, when to use it, the design guidelines, accessibility considerations, and what to avoid.

This is **design guidance**, not implementation — it says how something should look and behave, never which framework or component to build it with.

## How to use this skill

1. Figure out what you're designing — a **foundation**, a **pattern/flow**, a **component**, or an **interaction**.
2. Find it in the router below and read that one short file.
3. Apply its **Guidelines**, **Accessibility**, and **Avoid** points to your design.
4. Want the complete original guidance? Each file links to its full Apple HIG page on developer.apple.com.

`skills/` holds **65** design skills, grouped into foundations, patterns, components, and interaction.

## Router

### Foundations — Visual & UX principles that apply to every screen.

| Topic | What it covers |
| --- | --- |
| [Accessibility](skills/foundations/accessibility.md) | Designing interfaces everyone can perceive, operate, and understand regardless of ability or context |
| [Branding](skills/foundations/branding.md) | Expressing a recognizable brand identity while keeping the experience familiar and content-first |
| [Color](skills/foundations/color.md) | Using color deliberately to communicate status, express brand, convey hierarchy, and provide cont… |
| [Dark Mode](skills/foundations/dark-mode.md) | A systemwide dark color palette for low-light viewing that people expect every experience to resp… |
| [Icon Systems](skills/foundations/icon-systems.md) | A consistent, configurable library of symbols that align with your typography across all weights … |
| [Icons](skills/foundations/icons.md) | Simple graphic symbols that express a single action, item, or mode in a way people instantly unde… |
| [Images](skills/foundations/images.md) | Delivering artwork at the right format and resolution so it looks sharp on every display |
| [Inclusion](skills/foundations/inclusion.md) | Putting people first by using respectful language and imagery and presenting content everyone can… |
| [Layout](skills/foundations/layout.md) | A consistent, adaptive layout grounds people in content and works across screen sizes and orienta… |
| [Materials](skills/foundations/materials.md) | Translucent, blurred surfaces that separate a floating control or navigation layer from backgroun… |
| [Motion](skills/foundations/motion.md) | Purposeful, fluid animation that conveys status, gives feedback, and enriches the experience — wi… |
| [Privacy](skills/foundations/privacy.md) | Being transparent about the data and device capabilities you need, and protecting whatever people… |
| [Right to Left](skills/foundations/right-to-left.md) | Mirroring your interface to match the reading direction of right-to-left scripts like Arabic and … |
| [Typography](skills/foundations/typography.md) | Typographic choices establish legibility, hierarchy, and brand through deliberate use of size, we… |
| [Writing](skills/foundations/writing.md) | The words in your interface — labels, messages, empty states, errors — are a core part of the use… |

### Patterns — How to design recurring flows and experiences.

| Topic | What it covers |
| --- | --- |
| [Collaboration and Sharing](skills/patterns/collaboration-and-sharing.md) | Simple, responsive ways for people to share content and collaborate on it together while communic… |
| [Drag and Drop](skills/patterns/drag-and-drop.md) | Moving or copying content by dragging a selection from a source location to a destination |
| [Entering Data](skills/patterns/entering-data.md) | Designing input so people can supply information quickly and without mistakes |
| [Feedback](skills/patterns/feedback.md) | Cues that tell people what's happening, the result of an action, and how to avoid or fix mistakes |
| [File Management](skills/patterns/file-management.md) | Letting people create, open, save, browse, and preview documents and files within an app |
| [Launching](skills/patterns/launching.md) | The startup experience from open to first interactive screen, ideally feeling instant |
| [Loading](skills/patterns/loading.md) | Handling waits for content so they don't disrupt the experience, ideally finishing before people … |
| [Managing Accounts](skills/patterns/managing-accounts.md) | Authentication and account flows that let people reach their content without becoming a barrier t… |
| [Modality](skills/patterns/modality.md) | Content shown in a dedicated mode that blocks interaction with the rest of the app until people e… |
| [Notifications](skills/patterns/notifications.md) | Timely, permission-gated messages that inform people of events, delivered respectfully without ov… |
| [Offering Help](skills/patterns/offering-help.md) | Contextual help — tips, hints, and links — offered when an interface isn't fully self-explanatory |
| [Onboarding](skills/patterns/onboarding.md) | A fast, optional flow that helps people get a quick start using your app |
| [Ratings and Reviews](skills/patterns/ratings-and-reviews.md) | Asking people for feedback on your product at the right moment, without nagging |
| [Search](skills/patterns/search.md) | Lets people find content within your app, optionally scoped or filtered |
| [Settings](skills/patterns/settings.md) | A place for general, infrequently changed preferences that customize the experience |
| [Undo and Redo](skills/patterns/undo-and-redo.md) | Letting people reverse and re-apply recent actions so they can explore and recover from mistakes … |

### Components — How to design each UI element well.

| Topic | What it covers |
| --- | --- |
| [Action Sheets](skills/components/action-sheets.md) | An action sheet presents a set of choices related to an action the user just initiated, typically… |
| [Alerts](skills/components/alerts.md) | An alert is a modal that delivers critical information and requires the user to respond before co… |
| [Boxes](skills/components/boxes.md) | A box visually groups logically related content and controls, set off by a border or background |
| [Buttons](skills/components/buttons.md) | A button initiates an instantaneous action, combining style, content, and a semantic role |
| [Charts](skills/components/charts.md) | A chart organizes data visually to highlight key insights and help people understand and decide |
| [Color Pickers](skills/components/color-pickers.md) | A color picker lets people choose and adjust a color for text, shapes, or other elements |
| [Combo Boxes](skills/components/combo-boxes.md) | A combo box combines a text field with a dropdown list, so people can type a custom value or pick… |
| [Context Menus](skills/components/context-menus.md) | A context menu provides quick access to actions relevant to a specific item or view, revealed on … |
| [Disclosure Controls](skills/components/disclosure-controls.md) | Controls that reveal or hide related information or functionality, keeping advanced or secondary … |
| [Embedded Content](skills/components/embedded-content.md) | Embedded content displays external rich content such as web pages or media inline within your own… |
| [Labels](skills/components/labels.md) | A label is static, uneditable text that people can read (and often copy) but not edit |
| [Lists and Tables](skills/components/lists-and-tables.md) | Lists and tables present data in rows, and optionally columns, supporting scanning, selection, na… |
| [Menus](skills/components/menus.md) | A menu reveals a list of commands, options, or states when the user activates a trigger, presenti… |
| [Pickers](skills/components/pickers.md) | A picker presents one or more scrollable lists of distinct values to choose from, including date … |
| [Popovers](skills/components/popovers.md) | A popover is a transient view anchored to a control that appears above other content when activated |
| [Progress Indicators](skills/components/progress-indicators.md) | A progress indicator shows that an app is working during loading or a lengthy operation, optional… |
| [Scrolling](skills/components/scrolling.md) | A scrollable region lets people view content larger than its container by moving it vertically or… |
| [Search Fields](skills/components/search-fields.md) | A search field is an editable text field, with a search icon and a clear button, that lets people… |
| [Segmented Controls](skills/components/segmented-controls.md) | A segmented control is a linear set of two or more equal-width segments, each acting as a button,… |
| [Pop-Up Buttons](skills/components/select-menus.md) | A pop-up button displays a menu of mutually exclusive options and updates to show the current sel… |
| [Sheets](skills/components/sheets.md) | A sheet presents a focused, self-contained task closely related to the current context, layered o… |
| [Sidebars](skills/components/sidebars.md) | A sidebar is a panel on the leading side of a view for navigating between app areas or top-level … |
| [Sliders](skills/components/sliders.md) | A slider is a track with a draggable thumb that people adjust between a minimum and maximum value |
| [Split Views](skills/components/split-views.md) | A split view is a layout of two or three adjacent panes where selecting an item in one pane updat… |
| [Steppers](skills/components/steppers.md) | A stepper is a two-segment control for increasing or decreasing a value by a fixed amount |
| [Tab Bars](skills/components/tab-bars.md) | A tab bar is a persistent bar of top-level destinations that lets people switch between an app's … |
| [Text Fields](skills/components/text-fields.md) | A text field is a rectangular area where people enter or edit a small, specific piece of text suc… |
| [Toggles](skills/components/toggles.md) | A toggle lets people choose between a pair of opposing states, using a distinct appearance for ea… |
| [Toolbars](skills/components/toolbars.md) | A toolbar is a horizontal bar of frequently used commands, controls, navigation, and search along… |
| [Windows](skills/components/windows.md) | A window is the bounded surface that presents an app's content |

### Interaction — Designing for keyboard, pointer, touch, and focus.

| Topic | What it covers |
| --- | --- |
| [Focus and Selection](skills/interaction/focus-and-selection.md) | Focus marks the single element an interaction will target; selection marks the item or items a us… |
| [Keyboard](skills/interaction/keyboard.md) | Operating and navigating an interface — text entry, activation, and shortcuts — without relying o… |
| [Pointer and Hover](skills/interaction/pointer-and-hover.md) | Precise pointing input — moving, hovering, and invoking contextual actions — typical of mouse and… |
| [Touch and Gestures](skills/interaction/touch-and-gestures.md) | Direct physical manipulation of on-screen objects through motions like tap, swipe, drag, and pinch |
