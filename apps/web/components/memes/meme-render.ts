/**
 * The one function that draws a meme frame. Used by BOTH the live preview loop
 * and the export encoder, so the downloaded MP4 is pixel-identical to what the
 * user sees. Layers, bottom to top:
 *   1. background image (cover-fit)
 *   2. subject video (transparent WebM) with the user's zoom/drag transform
 *   3. caption (stroke then fill = outlined meme text)
 */

export type MemeTransform = {
  /** Top-left offset of the subject video, in canvas pixels. */
  x: number;
  y: number;
  /** Multiplier on the video's natural size. */
  scale: number;
};

export type MemeCaption = {
  text: string;
  fontFamily: string;
  fontWeight: number;
  /** Font size in canvas pixels. */
  fontSize: number;
  color: string;
  /** Stroke (outline) width in canvas pixels. 0 = none. */
  stroke: number;
  /** Vertical position of the first line, as a fraction of canvas height. */
  yFraction: number;
};

export type MemeFrameInput = {
  background: HTMLImageElement | null;
  /** Anything canvas can draw: a playing <video>, or a seeked frame. */
  video: CanvasImageSource & { videoWidth?: number; videoHeight?: number };
  videoWidth: number;
  videoHeight: number;
  transform: MemeTransform;
  caption: MemeCaption;
};

/** Draw `img` to fill `w`×`h` while preserving aspect ratio (CSS object-fit: cover). */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
) {
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = w / h;
  let dw = w;
  let dh = h;
  if (ir > cr) {
    // image is wider — match height, crop sides
    dh = h;
    dw = h * ir;
  } else {
    dw = w;
    dh = w / ir;
  }
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let line = words[0] ?? "";
    for (let i = 1; i < words.length; i++) {
      const word = words[i] ?? "";
      const test = `${line} ${word}`;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    lines.push(line);
  }
  return lines;
}

export function drawMemeFrame(
  ctx: CanvasRenderingContext2D,
  input: MemeFrameInput,
) {
  const { width: W, height: H } = ctx.canvas;
  const { background, video, videoWidth, videoHeight, transform, caption } =
    input;

  ctx.clearRect(0, 0, W, H);

  // 1. background
  if (background?.complete && background.naturalWidth > 0) {
    drawCover(ctx, background, W, H);
  } else {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
  }

  // 2. subject video
  if (videoWidth > 0 && videoHeight > 0) {
    ctx.drawImage(
      video,
      transform.x,
      transform.y,
      videoWidth * transform.scale,
      videoHeight * transform.scale,
    );
  }

  // 3. caption
  const text = caption.text.trim();
  if (text) {
    ctx.font = `${caption.fontWeight} ${caption.fontSize}px ${caption.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.lineJoin = "round";

    const maxWidth = W * 0.9;
    const lines = wrapLines(ctx, text, maxWidth);
    const lineHeight = caption.fontSize * 1.2;
    let y = H * caption.yFraction;
    const x = W / 2;

    for (const line of lines) {
      if (caption.stroke > 0) {
        ctx.lineWidth = caption.stroke;
        ctx.strokeStyle = "#000";
        ctx.strokeText(line, x, y);
      }
      ctx.fillStyle = caption.color;
      ctx.fillText(line, x, y);
      y += lineHeight;
    }
  }
}
