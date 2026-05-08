export type PrimitiveField =
  | { kind: "text"; key: string; label: string; placeholder?: string }
  | { kind: "textarea"; key: string; label: string; rows?: number }
  | { kind: "number"; key: string; label: string; min?: number; max?: number }
  | { kind: "color"; key: string; label: string }
  | { kind: "image"; key: string; label: string; placeholder?: string }
  | {
      kind: "select";
      key: string;
      label: string;
      options: { value: string; label: string }[];
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
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyCompositionInfo = CompositionInfo<any>;

export type EditorProps<T> = {
  value: T;
  onChange: (next: T) => void;
};
