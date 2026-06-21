import type { CompositionInfo } from "../../schema";
import type { MessageBubblesProps } from "./MessageBubbles";

export const MESSAGE_BUBBLES_DURATION = 660;
export const MESSAGE_BUBBLES_FPS = 60;
// Full-HD base resolution so the export is crisp at full-screen (TikTok/Reels
// are 1080×1920). The whole chat is vector/text + a designWidth scale, so the
// higher canvas just renders sharper — no layout change. Was 1280×720, which
// looked soft when baked to video even though the live DOM preview was crisp.
export const MESSAGE_BUBBLES_WIDTH = 1920;
export const MESSAGE_BUBBLES_HEIGHT = 1080;

export const messageBubblesDefaultProps: MessageBubblesProps = {
  contactName: "sanku",
  contactAvatar: "🤠",
  unreadCount: 12,
  messages: [
    // Older conversation — already ON SCREEN from frame 0 (history), no typing
    // animation. This is the context the new chat starts from.
    {
      text: "morning dad 👋",
      side: "right",
      typingFrames: 0,
      delay: 0,
      history: true,
    },
    {
      text: "morning kiddo 🙂",
      side: "left",
      typingFrames: 0,
      delay: 0,
      history: true,
    },
    {
      text: "did you feed the cat?",
      side: "left",
      typingFrames: 0,
      delay: 0,
      history: true,
    },
    {
      text: "yes he was starving lol",
      side: "right",
      typingFrames: 0,
      delay: 0,
      history: true,
    },
    {
      text: "Good. He looked hungry.",
      side: "left",
      typingFrames: 0,
      delay: 0,
      history: true,
    },
    {
      text: "he always looks hungry",
      side: "right",
      typingFrames: 0,
      delay: 0,
      history: true,
    },
    // … then the NEW conversation animates in under a "Today" divider.
    {
      text: "Uhh dad i forgot my lunch",
      side: "right",
      typingFrames: 55,
      delay: 40,
      time: "Today",
      sound: "sounds/keyboard/key.mp3",
    },
    {
      text: "i left it on the counter",
      side: "right",
      typingFrames: 55,
      delay: 200,
      sound: "sounds/keyboard/key.mp3",
    },
    {
      text: "again?? 🙄",
      side: "left",
      typingFrames: 45,
      delay: 360,
      sound: "sounds/keyboard/key.mp3",
    },
    {
      text: "can you bring it pls",
      side: "right",
      typingFrames: 55,
      delay: 500,
      sound: "sounds/keyboard/key.mp3",
    },
    {
      text: "pleaseee 🥺",
      side: "right",
      typingFrames: 45,
      delay: 640,
      sound: "sounds/keyboard/key.mp3",
    },
    {
      text: "fine, on my way 🚗",
      side: "left",
      typingFrames: 55,
      delay: 790,
      sound: "sounds/keyboard/key.mp3",
    },
    // Outgoing PHOTO — with the keyboard on, this plays the iMessage attachment
    // picker (+ → Photos → grid → tap) over the long typingFrames window, then
    // sends as a photo bubble. (Demo image; swap for any photo.)
    {
      text: "",
      side: "right",
      image: "images/imessage-wallpaper.jpg",
      // Window for the WHOLE picker flow (+ tap → menu opens → Photos → grid →
      // select photo → send). The entire sequence is squeezed into this window,
      // so this is the master speed dial. ~2s at 60fps — the whole flow (open
      // card → browse → select → send) plays in about two seconds, flowing step
      // to step. Only THIS photo message uses the long window; the regular text
      // messages keep their own (shorter) typing speeds, so chatting is normal.
      typingFrames: 120,
      delay: 940,
    },
  ],
  orientation: "portrait",
  scale: 1,
  backgroundImage: "",
  theme: "dark",
  showKeyboard: true,
  galleryImages: [],
};

export const messageBubblesInfo: CompositionInfo<MessageBubblesProps> = {
  id: "MessageBubbles",
  category: "social",
  title: "Message Bubbles",
  description:
    "An animated iMessage-style chat conversation with grouped bubble corners, tails, and spring-stacked rows.",
  agentNotes:
    "iMessage-style chat. Fill `messages` (array, ordered top→bottom). Each message: " +
    "{ text, side, typingFrames, delay, time?, history?, image?, sound? }. " +
    "side: 'right' = outgoing (you, blue), 'left' = incoming (the contact, gray). " +
    "delay = frame the message starts (ascending across the array); typingFrames = how long it types before landing. " +
    "history:true shows a message from frame 0 with NO animation (use for older context at the top); for history rows delay/typingFrames are ignored. " +
    "time:'Today' (or a date/time) renders a divider ABOVE that message. " +
    "PHOTO BUBBLE: to send an image, set `image` to a PUBLIC https image URL (.jpg/.png/.webp) or a bundled 'images/...' path and leave `text` empty — it renders as a photo bubble (text is ignored when image is set). " +
    "For the iMessage attachment-picker animation before an outgoing photo, set showKeyboard:true, give that photo message a longer typingFrames (~120), and fill `galleryImages` (the picker grid the cursor browses before sending). " +
    "galleryImages is an array of { name, url } objects (NOT bare strings), max 5 — e.g. [{ name: 'beach', url: 'https://…/beach.jpg' }]. The picker grid shows 6 tiles total: the photo being sent first, then your galleryImages, then gradient placeholders fill the rest. " +
    "contactAvatar is an emoji or image URL; backgroundImage is the chat wallpaper. Keep image URLs public and reachable — the renderer proxies known image hosts for cloud rendering. " +
    "EXAMPLE photo send: showKeyboard:true, galleryImages:[{name:'a',url:'https://…/a.jpg'},{name:'b',url:'https://…/b.jpg'}], and a message { side:'right', text:'', image:'https://…/a.jpg', typingFrames:120, delay:300 }.",
  durationInFrames: MESSAGE_BUBBLES_DURATION,
  fps: MESSAGE_BUBBLES_FPS,
  width: MESSAGE_BUBBLES_WIDTH,
  height: MESSAGE_BUBBLES_HEIGHT,
  defaultProps: messageBubblesDefaultProps,
  phoneFitMode: "cover",
  // Curated skins — first entry is the default look.
  themes: [{ id: "imessage", label: "iMessage" }],
  fields: [
    { kind: "text", key: "contactName", label: "Contact name" },
    {
      kind: "text",
      key: "contactAvatar",
      label: "Avatar (emoji or image URL)",
    },
    {
      kind: "number",
      key: "unreadCount",
      label: "Unread count (0 = hide)",
      min: 0,
      max: 9999,
    },
    {
      kind: "image",
      key: "backgroundImage",
      label: "Background wallpaper",
      placeholder: "images/... or https://...",
    },
    {
      kind: "imageList",
      key: "galleryImages",
      label: "Gallery photos (attachment picker)",
      itemLabel: "Photo",
      max: 5,
    },
    { kind: "switch", key: "showKeyboard", label: "Keyboard (typing)" },
    {
      kind: "select",
      key: "theme",
      label: "Appearance",
      options: [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ],
    },
    { kind: "chat", key: "messages", label: "Messages" },
    {
      kind: "select",
      key: "orientation",
      label: "Orientation",
      options: [
        { value: "landscape", label: "Landscape" },
        { value: "portrait", label: "Portrait (phone)" },
      ],
    },
    {
      kind: "number",
      key: "scale",
      label: "Zoom (1 = phone fit)",
      min: 0.5,
      max: 3,
    },
  ],
  // Grow the video to fit the conversation: the last bubble lands at
  // delay + typingFrames, so end there plus a ~1.2s hold. Without this, adding
  // messages past the default ~11s (e.g. a final photo) would be cut off and
  // never appear.
  calculateMetadata: ({ props }) => {
    const msgs = Array.isArray(props.messages) ? props.messages : [];
    let lastEnd = 0;
    for (const m of msgs) {
      const end = (m.delay ?? 0) + (m.typingFrames ?? 0);
      if (end > lastEnd) lastEnd = end;
    }
    const HOLD = Math.round(MESSAGE_BUBBLES_FPS * 1.2);
    // Canvas follows the orientation: a portrait phone renders a true 9:16
    // vertical video, landscape stays 16:9. (The dims are derived here rather
    // than hardcoded on the composition so switching the Orientation field
    // reshapes the export.)
    const portrait = props.orientation === "portrait";
    return {
      durationInFrames: Math.max(MESSAGE_BUBBLES_DURATION, lastEnd + HOLD),
      width: portrait ? MESSAGE_BUBBLES_HEIGHT : MESSAGE_BUBBLES_WIDTH,
      height: portrait ? MESSAGE_BUBBLES_WIDTH : MESSAGE_BUBBLES_HEIGHT,
    };
  },
};
