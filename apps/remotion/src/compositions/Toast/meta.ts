import type { CompositionInfo } from "../../schema";
import type { ToastProps } from "./Toast";

export const TOAST_DURATION = 180;
export const TOAST_FPS = 60;
export const TOAST_WIDTH = 1920;
export const TOAST_HEIGHT = 1080;

export const toastDefaultProps: ToastProps = {
  title: "Render complete",
  description: "Your 30-second video is ready to download.",
  position: "bottom-right",
  variant: "success",
  showIcon: true,
  durationVisibleSec: 2.0,
};

export const toastInfo: CompositionInfo<ToastProps> = {
  id: "Toast",
  title: "Toast",
  description:
    "A configurable notification toast that slides in from any corner with a spring, holds, then fades out.",
  durationInFrames: TOAST_DURATION,
  fps: TOAST_FPS,
  width: TOAST_WIDTH,
  height: TOAST_HEIGHT,
  defaultProps: toastDefaultProps,
  fields: [
    { kind: "text", key: "title", label: "Title" },
    { kind: "textarea", key: "description", label: "Description", rows: 2 },
    {
      kind: "select",
      key: "position",
      label: "Position",
      options: [
        { value: "top-left", label: "Top left" },
        { value: "top-center", label: "Top center" },
        { value: "top-right", label: "Top right" },
        { value: "bottom-left", label: "Bottom left" },
        { value: "bottom-center", label: "Bottom center" },
        { value: "bottom-right", label: "Bottom right" },
      ],
    },
    {
      kind: "select",
      key: "variant",
      label: "Variant",
      options: [
        { value: "info", label: "Info" },
        { value: "success", label: "Success" },
        { value: "warning", label: "Warning" },
        { value: "error", label: "Error" },
      ],
    },
    {
      kind: "number",
      key: "durationVisibleSec",
      label: "Visible duration (s)",
      min: 0.5,
      max: 10,
    },
  ],
};
