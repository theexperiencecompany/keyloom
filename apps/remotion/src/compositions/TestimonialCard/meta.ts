import type { CompositionInfo } from "../../schema";
import type { TestimonialCardProps } from "./TestimonialCard";

export const TESTIMONIAL_CARD_DURATION = 110;
export const TESTIMONIAL_CARD_FPS = 60;
export const TESTIMONIAL_CARD_WIDTH = 1280;
export const TESTIMONIAL_CARD_HEIGHT = 720;

export const testimonialCardDefaultProps: TestimonialCardProps = {
  quote:
    "We replaced three tools with this and shipped our launch in half the time. It's the most thoughtful product we've used all year.",
  avatarUrl: "https://avatars.githubusercontent.com/t3dotgg?s=200",
  name: "Theo Browne",
  role: "Founder",
  company: "Ping",
  theme: "light",
};

export const testimonialCardInfo: CompositionInfo<TestimonialCardProps> = {
  id: "TestimonialCard",
  title: "Testimonial Card",
  description:
    "A polished testimonial — quote with scaling quote mark, avatar, name, role, and company.",
  durationInFrames: TESTIMONIAL_CARD_DURATION,
  fps: TESTIMONIAL_CARD_FPS,
  width: TESTIMONIAL_CARD_WIDTH,
  height: TESTIMONIAL_CARD_HEIGHT,
  defaultProps: testimonialCardDefaultProps,
  fields: [
    { kind: "textarea", key: "quote", label: "Quote", rows: 4 },
    { kind: "text", key: "avatarUrl", label: "Avatar URL" },
    { kind: "text", key: "name", label: "Name" },
    { kind: "text", key: "role", label: "Role" },
    { kind: "text", key: "company", label: "Company" },
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
