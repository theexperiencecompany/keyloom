import type { CompositionInfo } from "../../schema";
import { buildThread } from "../_imessage-thread/build";
import { outroSeconds, videoHookSeconds } from "../_imessage-thread/segments";
import { textSoftBlurInFrames } from "../TextSoftBlurIn/TextSoftBlurIn";
import type { IMessageThreadProps } from "./IMessageThread";

export const IMESSAGE_THREAD_FPS = 60;
export const IMESSAGE_THREAD_WIDTH = 1080;
export const IMESSAGE_THREAD_HEIGHT = 1920;

export const iMessageThreadDefaultProps: IMessageThreadProps = {
  contactName: "GAIA",
  contactAvatar: "avatars/gaia-avatar.webp",
  layout: "fullscreen",
  keyboard: false,
  sounds: true,
  beats: [
    {
      id: "m1",
      time: "8:02 AM",
      from: "gaia",
      text: "Morning! Only 2 of your 38 emails need you, and I've already written the replies.",
    },
    {
      id: "m2",
      from: "gaia",
      text: "You've got 3 user research calls today. I've read up on each person so you know who you're talking to.",
    },
    {
      id: "m3",
      time: "1:10 PM",
      from: "gaia",
      text: "All 3 calls are done, and I've sent each person a thank-you email.",
    },
    {
      id: "m4",
      from: "gaia",
      text: "From the notes, Neha wants her whole team to try it, so I've booked a follow-up with her for Monday.",
    },
    {
      id: "u1",
      time: "3:10 PM",
      from: "user",
      text: "need flights to Bangalore for the Antler x Dodo Payments pitch tomorrow, for both of us. cheapest one that gets us there before 10",
    },
    { id: "r1", react: "u1", by: "gaia", emoji: "👀" },
    {
      id: "i1",
      time: "3:14 PM",
      images: [
        "browser/01-google-flights-results-crop.png",
        "browser/02-google-flights-booking-crop.png",
        "browser/03-airline-checkout-crop.png",
      ],
      hold: 2.6,
    },
    {
      id: "m5",
      from: "gaia",
      text: "Found one. The 5am Akasa flight lands at 7:10, well before 10, and it's the cheapest at ₹5,312 each.",
    },
    {
      id: "m6",
      from: "gaia",
      text: "I've filled in both your details. You just need to pay 👇",
    },
    {
      id: "l1",
      link: {
        url: "https://heygaia.link/pay-akasa",
        title: "Pay ₹10,624 for your 5am flights to Bangalore",
        domain: "heygaia.link",
        image: "link/pay-preview.png",
      },
      hold: 1.6,
    },
    { id: "t1", tap: "l1", hold: 1.3 },
    {
      id: "m7",
      time: "3:17 PM",
      from: "gaia",
      think: 1.3,
      text: "Paid! Both tickets are in your email.",
    },
    {
      id: "m8",
      time: "9:30 PM",
      from: "gaia",
      text: "Big day tomorrow! I'll call you at 3am so you make the 5am flight 😅 Good luck!",
    },
  ],
};

export const iMessageThreadInfo: CompositionInfo<IMessageThreadProps> = {
  id: "IMessageThread",
  category: "social",
  title: "iMessage Thread",
  description:
    "A scripted iMessage conversation on a real-proportioned iPhone: typing dots, composer typing, tapback reactions, photo stacks, tappable link cards, read receipts and a status-bar clock that follows the story.",
  durationInFrames: Math.ceil(
    buildThread(iMessageThreadDefaultProps.beats).end * IMESSAGE_THREAD_FPS,
  ),
  fps: IMESSAGE_THREAD_FPS,
  width: IMESSAGE_THREAD_WIDTH,
  height: IMESSAGE_THREAD_HEIGHT,
  defaultProps: iMessageThreadDefaultProps,
  themes: [
    { id: "ios26", label: "iOS 26" },
    { id: "ios18", label: "iOS 18" },
  ],
  fields: [
    { kind: "text", key: "contactName", label: "Contact name" },
    {
      kind: "select",
      key: "layout",
      label: "Layout",
      options: [
        { value: "phone", label: "Phone mockup" },
        { value: "fullscreen", label: "Full screen" },
      ],
    },
    { kind: "switch", key: "keyboard", label: "iOS 18 keyboard" },
    { kind: "switch", key: "sounds", label: "iMessage sounds" },
  ],
  calculateMetadata: ({ props }) => ({
    durationInFrames: Math.ceil(
      ((props.title
        ? textSoftBlurInFrames(props.title.headline) / IMESSAGE_THREAD_FPS
        : 0) +
        videoHookSeconds(props.hook) +
        buildThread(props.beats).end +
        outroSeconds(props.outro)) *
        IMESSAGE_THREAD_FPS,
    ),
  }),
};
