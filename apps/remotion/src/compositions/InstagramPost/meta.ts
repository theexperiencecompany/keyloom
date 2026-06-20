import type { CompositionInfo } from "../../schema";
import type { InstagramPostProps } from "./InstagramPost";

export const INSTAGRAM_POST_DURATION = 140;
export const INSTAGRAM_POST_FPS = 60;
export const INSTAGRAM_POST_WIDTH = 1920;
export const INSTAGRAM_POST_HEIGHT = 1080;

export const instagramPostDefaultProps: InstagramPostProps = {
  username: "sanku",
  location: "Mumbai, India",
  avatarUrl: "https://avatars.githubusercontent.com/sankalpaacharya?s=200",
  verified: "yes",
  imageUrl: "",
  caption: "golden hour hits different 🌇",
  likes: 18432,
  timestamp: "2 hours ago",
  theme: "light",
};

export const instagramPostInfo: CompositionInfo<InstagramPostProps> = {
  id: "InstagramPost",
  category: "social",
  agentNotes:
    "Authentic Instagram feed post: image + caption + username + heart/comment row. Use for Instagram-themed launches, social mockups, influencer content. The image prop accepts /images/... paths or any URL — use a brand-appropriate placeholder when no specific image is given.",
  title: "Instagram Post",
  description:
    "An animated Instagram post card. Customize the author, photo, caption, and like count.",
  durationInFrames: INSTAGRAM_POST_DURATION,
  fps: INSTAGRAM_POST_FPS,
  width: INSTAGRAM_POST_WIDTH,
  height: INSTAGRAM_POST_HEIGHT,
  defaultProps: instagramPostDefaultProps,
  fields: [
    { kind: "text", key: "username", label: "Username" },
    { kind: "text", key: "location", label: "Location" },
    { kind: "text", key: "avatarUrl", label: "Avatar URL" },
    {
      kind: "select",
      key: "verified",
      label: "Verified",
      options: [
        { value: "yes", label: "Verified" },
        { value: "no", label: "Not verified" },
      ],
    },
    { kind: "image", key: "imageUrl", label: "Photo URL" },
    { kind: "textarea", key: "caption", label: "Caption", rows: 3 },
    { kind: "number", key: "likes", label: "Likes", min: 0 },
    { kind: "text", key: "timestamp", label: "Timestamp" },
    {
      kind: "select",
      key: "theme",
      label: "Theme",
      options: [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ],
    },
  ],
};
