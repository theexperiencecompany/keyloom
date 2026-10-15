export type Sender = "gaia" | "user";

export type ThreadItem =
  | { id: string; kind: "divider"; at: number; day: string; time: string }
  | {
      id: string;
      kind: "text";
      at: number;
      from: Sender;
      text: string;
      typing?: number;
      compose?: number;
    }
  | {
      id: string;
      kind: "images";
      at: number;
      from: Sender;
      srcs: string[];
      typing?: number;
      aspect?: number;
      /** When the user taps the photo (press-in + fullscreen expand). */
      tapAt?: number;
      /** tapAt + tap beat hold: fullscreen overlay shows in [tapAt, expandUntil). */
      expandUntil?: number;
      /** Fullscreen slideshow frames (defaults to the tapped photo). */
      cycle?: string[];
      /** Seconds per fullscreen frame. */
      cycleInterval?: number;
    }
  | {
      id: string;
      kind: "link";
      at: number;
      from: Sender;
      url: string;
      title: string;
      domain: string;
      image?: string;
      typing?: number;
      /** When the user taps the card (press-in animation). */
      tapAt?: number;
    }
  | {
      id: string;
      kind: "reaction";
      at: number;
      target: string;
      by: Sender;
      emoji: string;
    };

/** Seconds; `typing` = how long the typing bubble shows before the item lands. */
