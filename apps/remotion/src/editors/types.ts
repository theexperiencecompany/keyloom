export type ChatMessage = {
  text: string;
  side: "left" | "right";
  delay: number;
  typingFrames: number;
  /**
   * Optional image attachment (data URL or static asset path). When set the
   * message renders as an iMessage photo bubble — the image masked into the
   * same curved-tail shape as a text bubble — and `text` is ignored.
   */
  image?: string;
  /**
   * Optional day/time divider shown ABOVE this message — e.g. "Today",
   * "Yesterday", "Mon 9:41 AM". Use it to separate an older conversation from a
   * new one. Rendered as a centered grey label (iMessage style); the message it
   * sits on always starts a fresh bubble group.
   */
  time?: string;
  /**
   * Mark this message as pre-existing conversation HISTORY: it's already on
   * screen from frame 0 with no typing/pop-in animation (and never typed on the
   * keyboard). Use it for the older conversation that sits above a "Today"
   * divider, so only the new messages animate in. `delay`/`typingFrames` are
   * ignored for history messages.
   */
  history?: boolean;
  /**
   * Optional custom sound effect played the moment THIS bubble lands, layered
   * on top of the default iMessage swoosh. A static asset path (e.g.
   * "sounds/memes/fahhh.mp3") or an inline data URL from an uploaded file.
   * History messages never trigger it (they're on screen from frame 0).
   */
  sound?: string;
};
