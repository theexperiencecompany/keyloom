export type PrimitiveField =
  | { kind: "text"; key: string; label: string; placeholder?: string }
  | { kind: "textarea"; key: string; label: string; rows?: number }
  | { kind: "number"; key: string; label: string; min?: number; max?: number }
  | { kind: "color"; key: string; label: string }
  | { kind: "image"; key: string; label: string; placeholder?: string }
  | {
      /**
       * Audio file picker. Uploads through /api/shorts/transcribe so the
       * Whisper-derived word array can land on the same clip atomically.
       * Stores the served URL under `key` and the CaptionWord[] under
       * `wordsKey` on the same props object.
       */
      kind: "audio";
      key: string;
      wordsKey: string;
      label: string;
      placeholder?: string;
    }
  | { kind: "switch"; key: string; label: string }
  | {
      kind: "select";
      key: string;
      label: string;
      options: { value: string; label: string }[];
    }
  | {
      /**
       * Curated icon picker with a custom-upload fallback. Stores the
       * selected preset key under `key` and the uploaded/pasted URL
       * under `customKey` on the same props object. Render priority is
       * always custom > preset > composition default — selecting a
       * preset clears `customKey`, uploading clears `key`.
       *
       * `presetSet` identifies which preset bundle to draw thumbnails
       * from (today only "macos" is implemented). The inspector reads
       * the actual list from the composition module, so additions to
       * the icon-presets file flow through automatically.
       */
      kind: "iconPreset";
      key: string;
      customKey: string;
      label: string;
      presetSet: "macos";
    };

export type ShapeField =
  | { kind: "chat"; key: string; label: string }
  | { kind: "scenario"; key: string; label: string }
  | { kind: "composition"; key: string; label: string; exclude?: string[] }
  | {
      kind: "slots";
      key: string;
      label: string;
      layoutKey: string;
      counts: Record<string, number>;
      exclude?: string[];
    }
  | {
      // Renders the editor for whatever composition is selected at
      // `compositionKey`, merged on top of that composition's defaultProps.
      // Used by wrappers like PhoneFrame / LaptopFrame so the inner
      // composition's fields show up in the inspector instead of being
      // locked behind JSON-only editing.
      kind: "innerProps";
      key: string;
      label: string;
      compositionKey: string;
    }
  | {
      kind: "imageList";
      key: string;
      label: string;
      itemLabel?: string;
      max?: number;
    }
  | {
      kind: "terminalLines";
      key: string;
      label: string;
    };

// A collapsible section that groups primitive fields under a label.
// Renders as an accordion at the bottom of the inspector.
export type SectionField = {
  kind: "section";
  key: string;
  label: string;
  description?: string;
  defaultOpen?: boolean;
  fields: PrimitiveField[];
};

export type Field = PrimitiveField | ShapeField | SectionField;

// Re-derived from props at studio/render time. Same shape as
// Remotion's CalculateMetadataFunction return — kept inlined to
// avoid a hard remotion type dep in the schema module.
export type CalculatedMetadata = {
  durationInFrames?: number;
  fps?: number;
  width?: number;
  height?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props?: any;
};

/**
 * brandMode controls whether a composition inherits the project Brand Kit:
 *   - "branded" (default): accent / background / font fall back to the brand
 *     when the per-clip prop is omitted or empty.
 *   - "locked": the composition impersonates a real product (Twitter,
 *     WhatsApp, Slack, Discord, iMessage, etc.) and ignores the brand kit
 *     to keep the look authentic.
 */
export type BrandMode = "branded" | "locked";

/**
 * How a composition fits inside PhoneFrame's screen when nested.
 *   - "width" (default): fit-to-width with vertical centering. Landscape
 *     compositions (Browser, charts, text) render as a horizontal band
 *     inside the phone screen with the screen background showing above
 *     and below.
 *   - "cover": cover-fit (Math.max). Use for compositions that internally
 *     render portrait content sized to the phone aspect (the chat demos
 *     in portrait orientation). PhoneFrame provides SafeAreaContext only
 *     in this mode since the inner composition fills the screen.
 *   - "contain": contain-fit (Math.min). Use when the whole composition
 *     should be visible regardless of aspect, with letterbox on both axes.
 */
export type PhoneFitMode = "cover" | "width" | "contain";

/**
 * Coarse grouping used by the agent's discovery flow. The system prompt
 * lists categories; the agent calls `listScenesInCategory` to drill in,
 * then `getSceneDetails` for the specific compositions it picks. Keeps
 * the prompt constant-size as the registry grows.
 *
 *   text         — title/text animations (TextX, TitleX)
 *   social       — chat & post impersonators (Tweet, Slack, WhatsApp, …)
 *   data         — charts, counters, stats
 *   devtools     — terminal, browser, cursor, typing demos
 *   marketing    — feature/pricing/testimonial cards, logos, toast
 *   layout       — wrapper compositions (PhoneFrame, LaptopFrame, Split)
 *   captions     — voiceover-driven caption tracks
 *   media        — images, QR codes, marquees, scenario players
 *   background   — ambient looping backdrops (gradients, grids, particles)
 */
export type CompositionCategory =
  | "text"
  | "social"
  | "data"
  | "devtools"
  | "marketing"
  | "layout"
  | "captions"
  | "media"
  | "background";

export type CompositionInfo<P extends Record<string, unknown>> = {
  id: string;
  title: string;
  description: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  defaultProps: P;
  fields: Field[];
  brandMode?: BrandMode;
  phoneFitMode?: PhoneFitMode;
  /**
   * Coarse category for agent discovery. Required so the agent's catalog
   * stays comprehensive as new compositions land.
   */
  category: CompositionCategory;
  /**
   * When true, the studio agent never sees this composition — it's
   * filtered out of the category counts, listScenesInCategory results,
   * and getSceneDetails. Use for internal/branded scenes that exist for
   * the team but shouldn't be picked by the LLM when generating user
   * videos. The composition still appears in the studio library and
   * docs surfaces.
   */
  hideFromAgent?: boolean;
  /**
   * Free-form, 1–3 sentence usage guidance for the studio agent —
   * surfaced via `getSceneDetails`. Tell the model when to reach for
   * this scene, what role it plays in a video, and what makes a good
   * prop fill. Examples:
   *   "Best for CLI install/build/deploy with 2–4 lines. Use for the
   *    'how it works' beat in a launch video. Avoid for long-form."
   *   "Use for Instagram-themed launches or social mockups. Pair the
   *    InstagramPost reveal with a TextScaleDownFade hook."
   */
  agentNotes?: string;
  // Optional callback Remotion runs at studio load + every prop edit.
  // Use this to recompute durationInFrames (or any metadata) from
  // current props — e.g. GaiaScenario derives its length from the
  // active scenarioJson so the timeline card hugs the actual content.
  calculateMetadata?: (args: {
    props: P;
  }) => CalculatedMetadata | Promise<CalculatedMetadata>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyCompositionInfo = CompositionInfo<any>;

export type EditorProps<T> = {
  value: T;
  onChange: (next: T) => void;
};
