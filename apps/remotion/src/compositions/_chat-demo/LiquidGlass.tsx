"use client";

/**
 * Liquid Glass — WebGL refraction layer.
 *
 * A faithful port of the WebGL shader from
 * https://github.com/archisvaze/liquid-glass (webgl.html). The fragment
 * shader is reproduced verbatim except for one change: instead of a single
 * glass rectangle it loops over an array of rounded-rects so any number of
 * DOM elements (incoming bubbles, the composer pill, the round buttons) can
 * share one full-bleed canvas and one background texture.
 *
 * Usage:
 *
 *   <GlassStage enabled={glassOn} bgImage="images/wallpaper.jpg">
 *     ... chat chrome ...
 *     <LiquidGlass radius={18}>{bubbleContent}</LiquidGlass>
 *   </GlassStage>
 *
 * `GlassStage` owns the container, the background image layer, the canvas,
 * and a seek-driven draw that re-measures every registered `LiquidGlass`
 * child on the current frame. Each `LiquidGlass` only registers its DOM
 * rect + corner radius; the canvas refracts the wallpaper beneath it.
 *
 * When `enabled` is false (or WebGL/texture is unavailable) every
 * `LiquidGlass` renders its children with the solid styling it was given —
 * so the same tree works identically with and without glass.
 */

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { continueRender, delayRender } from "remotion";
import { asset } from "../../lib/asset";
import { useDesignFrame } from "../../use-design-frame";

const MAX_RECTS = 32;

export type GlassParams = {
  /** Refraction bezel width (px). Clamped to the element's radius/half-size. */
  bezel: number;
  /** Glass thickness — drives how far the bg is displaced. */
  thickness: number;
  /** Index of refraction. */
  ior: number;
  /** Background blur radius (px). */
  blur: number;
  /** Specular rim highlight strength. */
  specular: number;
  /** White tint mixed into the refracted color (0–1). */
  tint: number;
  /** Drop-shadow opacity around each glass shape. */
  shadow: number;
  /** Frosted (glossy) bubble blur radius (px). */
  frostBlur: number;
  /** Frosted dark-tint color, 0–1 rgb. */
  frostColor: [number, number, number];
  /** Frosted dark-tint strength (0–1). */
  frostStrength: number;
};

export const DEFAULT_GLASS: GlassParams = {
  bezel: 22,
  thickness: 32,
  ior: 1.45,
  blur: 3,
  specular: 0.4,
  tint: 0.0,
  shadow: 0.2,
  frostBlur: 24,
  frostColor: [0.12, 0.12, 0.14],
  frostStrength: 0.55,
};

function parseHexColor(c: string | undefined): [number, number, number] {
  if (!c) return [255, 255, 255];
  let h = c.trim().replace(/^#/, "");
  if (h.length === 3)
    h = h
      .split("")
      .map((x) => x + x)
      .join("");
  if (h.length !== 6) return [255, 255, 255];
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return [255, 255, 255];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/* ------------------------------------------------------------------ shaders */

const VERT = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

// Fragment shader — verbatim math from archisvaze/liquid-glass webgl.html,
// generalised to loop over MAX_RECTS rounded-rects (the original handled one).
const FRAG = `
precision highp float;
varying vec2 vUv;

uniform vec2 uResolution;
uniform int uCount;
uniform vec2 uCenters[${MAX_RECTS}];
uniform vec2 uSizes[${MAX_RECTS}];
uniform float uRadii[${MAX_RECTS}];
uniform float uFrost[${MAX_RECTS}];
uniform float uBezel;
uniform float uThickness;
uniform float uIOR;
uniform float uBlur;
uniform float uSpecular;
uniform float uTint;
uniform float uShadow;
uniform float uFrostBlur;
uniform vec3 uFrostColor;
uniform float uFrostStrength;
uniform float uSolid;
uniform sampler2D uBgTex;
uniform float uBgAspect;

float sdRoundedRect(vec2 p, vec2 halfSize, float r) {
  vec2 q = abs(p) - halfSize + r;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - r;
}

float surfaceHeight(float t) {
  float s = 1.0 - t;
  return pow(1.0 - s*s*s*s, 0.25);
}

float hash21(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

vec3 sampleBg(vec2 screenUV) {
  float screenAspect = uResolution.x / uResolution.y;
  vec2 uv = screenUV;
  if (uBgAspect > screenAspect) {
    float s = screenAspect / uBgAspect;
    uv.x = uv.x * s + (1.0 - s) * 0.5;
  } else {
    float s = uBgAspect / screenAspect;
    uv.y = uv.y * s + (1.0 - s) * 0.5;
  }
  uv.y = 1.0 - uv.y;
  return texture2D(uBgTex, uv).rgb;
}

vec3 sampleBgBlurred(vec2 uv, float radius) {
  if (radius < 0.5) return sampleBg(uv);
  vec3 sum = vec3(0.0);
  vec2 px = 1.0 / uResolution;
  // Two concentric rings (32 effective taps) — 16 alone is grainy at the
  // larger frost radius and reads as low-res. The half-radius inner ring
  // fills the kernel so the blur stays smooth instead of speckled.
  vec2 offsets[16];
  offsets[0]  = vec2(-0.94201, -0.39906);
  offsets[1]  = vec2( 0.94558, -0.76890);
  offsets[2]  = vec2(-0.09418, -0.92938);
  offsets[3]  = vec2( 0.34495,  0.29387);
  offsets[4]  = vec2(-0.91588, -0.45771);
  offsets[5]  = vec2(-0.81544,  0.48568);
  offsets[6]  = vec2(-0.38277, -0.56071);
  offsets[7]  = vec2(-0.12675,  0.84686);
  offsets[8]  = vec2( 0.89642,  0.41254);
  offsets[9]  = vec2( 0.18150, -0.30020);
  offsets[10] = vec2(-0.01445, -0.16001);
  offsets[11] = vec2( 0.59614,  0.71118);
  offsets[12] = vec2( 0.49742, -0.47280);
  offsets[13] = vec2( 0.80685,  0.04588);
  offsets[14] = vec2(-0.32490, -0.03965);
  offsets[15] = vec2(-0.60975,  0.06566);
  // Per-pixel kernel rotation — the fixed Poisson directions otherwise line up
  // into a structured grain / dashed ring; jittering the angle per pixel turns
  // that into fine, eye-smooth noise instead.
  float a = hash21(uv * uResolution) * 6.2831853;
  float ca = cos(a);
  float sa = sin(a);
  mat2 rot = mat2(ca, -sa, sa, ca);
  for (int i = 0; i < 16; i++) {
    vec2 o = rot * offsets[i];
    sum += sampleBg(uv + o * radius * px);
    sum += sampleBg(uv + o * radius * 0.5 * px);
  }
  return sum / 32.0;
}

void main() {
  vec2 screenPx = vec2(vUv.x, 1.0 - vUv.y) * uResolution;

  // Nearest glass shape (smallest signed distance). Shapes never overlap, so
  // the closest one is the one this pixel belongs to (inside or in its halo).
  float bestSd = 1e9;
  vec2 bestCenter = vec2(0.0);
  vec2 bestHalf = vec2(0.0);
  float bestR = 0.0;
  float bestFrost = 0.0;
  // Frosted bubbles are made of TWO overlapping rects (body + tail). For a
  // seamless union we also need the smallest signed distance among ONLY the
  // frosted shapes — that's the true union silhouette of the bubble+tail.
  float frostSd = 1e9;
  for (int i = 0; i < ${MAX_RECTS}; i++) {
    if (i >= uCount) break;
    vec2 hs = uSizes[i] * 0.5;
    float sd = sdRoundedRect(screenPx - uCenters[i], hs, uRadii[i]);
    if (sd < bestSd) {
      bestSd = sd;
      bestCenter = uCenters[i];
      bestHalf = hs;
      bestR = uRadii[i];
      bestFrost = uFrost[i];
    }
    if (uFrost[i] > 0.5) frostSd = min(frostSd, sd);
  }

  if (uCount == 0) discard;

  vec2 screenUV = screenPx / uResolution;

  // ---- Frosted (glossy) bubbles: blur + dark tint + inner outline ---------
  if (bestFrost > 0.5) {
    float fsd = frostSd;
    if (fsd > 0.0) {
      float shadowFalloff = exp(-fsd * fsd / 320.0);
      gl_FragColor = vec4(0.0, 0.0, 0.0, uShadow * shadowFalloff * 0.5);
      return;
    }
    float d = -fsd;
    vec3 bg = sampleBgBlurred(screenUV, max(uFrostBlur, 1.0));
    vec3 col = mix(bg, uFrostColor, uFrostStrength);
    // subtle inner hairline outline just inside the edge
    float outline = smoothstep(0.0, 1.2, d) * (1.0 - smoothstep(1.2, 4.0, d));
    col += vec3(outline * 0.18);
    // gentle overall sheen brightening toward the top edge
    float sheen = 1.0 - smoothstep(0.0, 10.0, d);
    col += vec3(sheen * 0.035);
    float alpha = smoothstep(0.0, 1.2, d);
    gl_FragColor = vec4(col, alpha);
    return;
  }

  vec2 p = screenPx - bestCenter;
  float sd = bestSd;
  vec2 halfSize = bestHalf;
  float radius = bestR;

  if (sd > 0.0) {
    float shadowFalloff = exp(-sd * sd / 340.0);
    float shadowAlpha = uShadow * shadowFalloff * 0.6;
    gl_FragColor = vec4(0.0, 0.0, 0.0, shadowAlpha);
    return;
  }

  float distFromEdge = -sd;
  float bezel = min(uBezel, min(radius, min(halfSize.x, halfSize.y)) - 1.0);
  float t = clamp(distFromEdge / bezel, 0.0, 1.0);

  float h = surfaceHeight(t);
  float dt = 0.001;
  float h2 = surfaceHeight(min(t + dt, 1.0));
  float dh = (h2 - h) / dt;

  float slopeAngle = atan(dh * (uThickness / bezel));
  float sinR = sin(slopeAngle) / uIOR;
  sinR = clamp(sinR, -1.0, 1.0);
  float thetaR = asin(sinR);
  float displacement = h * uThickness * (tan(slopeAngle) - tan(thetaR));

  vec2 grad;
  float eps = 1.0;
  grad.x = sdRoundedRect(p + vec2(eps, 0.0), halfSize, radius)
         - sdRoundedRect(p - vec2(eps, 0.0), halfSize, radius);
  grad.y = sdRoundedRect(p + vec2(0.0, eps), halfSize, radius)
         - sdRoundedRect(p - vec2(0.0, eps), halfSize, radius);
  grad = normalize(grad);

  vec2 offset = -grad * displacement / uResolution;

  vec2 refractedUV = screenUV + offset;

  vec3 color = sampleBgBlurred(refractedUV, uBlur);

  vec2 lightDir = normalize(vec2(0.5, -0.7));
  float rimDot = abs(dot(grad, lightDir));
  float rimFalloff = 1.0 - smoothstep(0.0, bezel * 0.4, distFromEdge);
  float specHighlight = pow(rimDot * rimFalloff, 1.5);
  color += vec3(specHighlight * uSpecular);

  float innerShadow = 1.0 - smoothstep(0.0, bezel * 0.6, distFromEdge);
  color *= mix(1.0, 0.7, innerShadow * 0.3);

  // Soft, wide inner sheen instead of a thin hairline — a 2–5px bright ring
  // undersamples into the dashed/dotted outline the user saw.
  float innerRim = smoothstep(0.0, 3.5, distFromEdge) * (1.0 - smoothstep(3.5, 10.0, distFromEdge));
  color += vec3(innerRim * 0.09 * uSpecular);

  color = mix(color, vec3(1.0), uTint);

  // ---- Self-defining adaptive material + edge -----------------------------
  // Liquid glass must read cleanly over ANY background: a bright or dark
  // wallpaper, a plain white sheet, or pure black. Pure refraction alone
  // vanishes wherever the background behind the glass is dark or flat (nothing
  // to lens), which is why it looked broken on black AND in the dark regions of
  // a wallpaper. So we add a frosted body + a soft edge whose strength scales
  // with the LOCAL background:
  //   • dark areas  → a translucent light body + a soft bright rim
  //   • bright/flat → a faint dark rim only (refraction stays dominant)
  //   • busy mid-tone wallpaper → almost nothing; the lensing already defines it
  // uSolid (no wallpaper at all) keeps a guaranteed minimum edge so a pill on
  // a plain white or black sheet always has a crisp lip.
  {
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    // How dark / how bright the refracted background is, and how "extreme"
    // (i.e. flat & featureless) it is overall.
    float darkness = 1.0 - smoothstep(0.12, 0.5, lum);
    float brightness = smoothstep(0.5, 0.92, lum);
    float definedness = max(darkness, brightness);
    float dir = lum > 0.5 ? -1.0 : 1.0;

    // 0 at the top edge → 1 at the bottom edge of THIS shape (top-lit gradient).
    float vy = clamp((p.y + halfSize.y) / max(2.0 * halfSize.y, 1.0), 0.0, 1.0);
    float envGrad = mix(1.0, 0.66, vy);

    // Frosted body — only a whisper, so the glass reads as clear/transparent
    // rather than milky. Kept just strong enough (over dark regions) to keep
    // the shape from vanishing; the edge does most of the defining work.
    vec3 mat = vec3(0.5) * envGrad;
    color = mix(color, mat, (uSolid > 0.5 ? 0.08 : 0.055) * darkness);

    // Soft, diffuse edge — gentle wide rim + inner bevel, never a hard hairline.
    float rim = 1.0 - smoothstep(0.0, 4.5, distFromEdge);
    float bevel = 1.0 - smoothstep(0.0, bezel * 0.9, distFromEdge);
    float edgeLight = mix(1.0, 0.45, vy);
    // Over a wallpaper the edge only shows where the bg is flat/extreme; on a
    // solid sheet we force a small minimum so the pill is always defined.
    float edgeAmt = max(uSolid > 0.5 ? 0.4 : 0.0, definedness);
    color += vec3(dir * (rim * 0.09 + bevel * 0.035) * edgeLight * edgeAmt);

    // A whisper of the moving specular sparkle on top.
    color += vec3(specHighlight * 0.15 * (0.5 + 0.5 * definedness));
  }

  float alpha = smoothstep(0.0, 1.5, distFromEdge);
  gl_FragColor = vec4(color, alpha);
}`;

/* ----------------------------------------------------------- gl renderer */

type Renderer = {
  setBg: (img: HTMLImageElement) => void;
  /** Upload a 1×1 solid color as the bg texture (no-wallpaper case). */
  setSolidBg: (r: number, g: number, b: number) => void;
  draw: (
    rects: {
      cx: number;
      cy: number;
      w: number;
      h: number;
      r: number;
      frost: boolean;
    }[],
    cssW: number,
    cssH: number,
    pixelW: number,
    pixelH: number,
    params: GlassParams,
    /** Refracting a flat color → use the adaptive self-defining edge. */
    solid: boolean,
  ) => void;
  dispose: () => void;
};

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error("LiquidGlass shader compile failed: " + log);
  }
  return sh;
}

function createRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const gl = (canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: false,
    antialias: true,
  }) ||
    canvas.getContext("experimental-webgl", {
      alpha: true,
      premultipliedAlpha: false,
    })) as WebGLRenderingContext | null;
  if (!gl) return null;

  let program: WebGLProgram;
  try {
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? "link failed");
    }
  } catch (e) {
    console.error(e);
    return null;
  }

  // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is a WebGL API call, not a React hook.
  gl.useProgram(program);

  // Fullscreen quad.
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  // x, y, u, v
  const quad = new Float32Array([
    -1, -1, 0, 0, 1, -1, 1, 0, -1, 1, 0, 1, 1, 1, 1, 1,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
  const posLoc = gl.getAttribLocation(program, "position");
  const uvLoc = gl.getAttribLocation(program, "uv");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
  gl.enableVertexAttribArray(uvLoc);
  gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 16, 8);

  const u = (name: string) => gl.getUniformLocation(program, name);
  const uResolution = u("uResolution");
  const uCount = u("uCount");
  const uCenters = u("uCenters");
  const uSizes = u("uSizes");
  const uRadii = u("uRadii");
  const uFrost = u("uFrost");
  const uBezel = u("uBezel");
  const uThickness = u("uThickness");
  const uIOR = u("uIOR");
  const uBlur = u("uBlur");
  const uSpecular = u("uSpecular");
  const uTint = u("uTint");
  const uShadow = u("uShadow");
  const uFrostBlur = u("uFrostBlur");
  const uFrostColor = u("uFrostColor");
  const uFrostStrength = u("uFrostStrength");
  const uSolid = u("uSolid");
  const uBgTex = u("uBgTex");
  const uBgAspect = u("uBgAspect");

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // 1x1 transparent placeholder until the real bg loads.
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 0]),
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  let bgAspect = 1.5;

  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(
    gl.SRC_ALPHA,
    gl.ONE_MINUS_SRC_ALPHA,
    gl.ONE,
    gl.ONE_MINUS_SRC_ALPHA,
  );

  const centers = new Float32Array(MAX_RECTS * 2);
  const sizes = new Float32Array(MAX_RECTS * 2);
  const radii = new Float32Array(MAX_RECTS);
  const frosts = new Float32Array(MAX_RECTS);

  return {
    setBg(img) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      // three.js loads textures flipped (flipY=true by default); the shader
      // was authored against that, so mimic it here.
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      bgAspect =
        (img.naturalWidth || img.width) / (img.naturalHeight || img.height);
    },
    setSolidBg(r, g, b) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array([r, g, b, 255]),
      );
      bgAspect = 1;
    },
    draw(rects, cssW, cssH, pixelW, pixelH, params, solid) {
      // `pixelW/H` are the REAL on-screen device pixels (already accounting
      // for ChatFill's transform scale + devicePixelRatio). `uResolution`
      // stays in layout px so rect coords line up; only the sample density
      // scales — that's what keeps the glass crisp instead of half-res.
      const pw = Math.max(1, Math.round(pixelW));
      const ph = Math.max(1, Math.round(pixelH));
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      gl.viewport(0, 0, pw, ph);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      const n = Math.min(rects.length, MAX_RECTS);
      for (let i = 0; i < n; i++) {
        const r = rects[i]!;
        centers[i * 2] = r.cx;
        centers[i * 2 + 1] = r.cy;
        sizes[i * 2] = r.w;
        sizes[i * 2 + 1] = r.h;
        radii[i] = r.r;
        frosts[i] = r.frost ? 1 : 0;
      }

      // biome-ignore lint/correctness/useHookAtTopLevel: gl.useProgram is a WebGL API call, not a React hook.
      gl.useProgram(program);
      gl.uniform2f(uResolution, cssW, cssH);
      gl.uniform1i(uCount, n);
      gl.uniform2fv(uCenters, centers);
      gl.uniform2fv(uSizes, sizes);
      gl.uniform1fv(uRadii, radii);
      gl.uniform1fv(uFrost, frosts);
      gl.uniform1f(uBezel, params.bezel);
      gl.uniform1f(uThickness, params.thickness);
      gl.uniform1f(uIOR, params.ior);
      gl.uniform1f(uBlur, params.blur);
      gl.uniform1f(uSpecular, params.specular);
      gl.uniform1f(uTint, params.tint);
      gl.uniform1f(uShadow, params.shadow);
      gl.uniform1f(uSolid, solid ? 1 : 0);
      gl.uniform1f(uFrostBlur, params.frostBlur);
      gl.uniform3f(
        uFrostColor,
        params.frostColor[0],
        params.frostColor[1],
        params.frostColor[2],
      );
      gl.uniform1f(uFrostStrength, params.frostStrength);
      gl.uniform1f(uBgAspect, bgAspect);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(uBgTex, 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      gl.deleteProgram(program);
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
    },
  };
}

/* --------------------------------------------------------------- context */

export type TailSide = "left" | "right" | null;

type GlassRegItem = {
  el: HTMLElement;
  radius: number;
  frost: boolean;
  tail: TailSide;
};

type GlassCtxValue = {
  active: boolean;
  register: (
    id: string,
    el: HTMLElement,
    radius: number,
    frost: boolean,
    tail: TailSide,
  ) => void;
  unregister: (id: string) => void;
};

const GlassContext = createContext<GlassCtxValue | null>(null);

/* ----------------------------------------------------------- GlassStage */

export function GlassStage({
  enabled,
  bgImage,
  bgColor = "#ffffff",
  params,
  className,
  style,
  children,
}: {
  /** Master switch — when false the canvas never draws and children stay solid. */
  enabled: boolean;
  /** Wallpaper the glass refracts (static path or http url). */
  bgImage?: string;
  /** Solid color rendered behind the wallpaper (and used when no bgImage). */
  bgColor?: string;
  params?: Partial<GlassParams>;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const frame = useDesignFrame();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const items = useRef<Map<string, GlassRegItem>>(new Map());

  const [glOk, setGlOk] = useState(false);
  const [bgReady, setBgReady] = useState(false);
  // Bumped whenever a child registers/unregisters so the draw effect re-runs
  // even on a paused (static) frame.
  const [version, setVersion] = useState(0);

  // Glass runs whenever enabled. With a wallpaper it refracts the image; with
  // none it refracts the solid sheet color and uses the adaptive-edge path.
  const wantGlass = enabled;
  const hasImage = !!asset(bgImage);
  const resolvedParams = useMemo<GlassParams>(
    () => ({ ...DEFAULT_GLASS, ...params }),
    [params],
  );

  const register = useCallback(
    (
      id: string,
      el: HTMLElement,
      radius: number,
      frost: boolean,
      tail: TailSide,
    ) => {
      items.current.set(id, { el, radius, frost, tail });
      setVersion((v) => v + 1);
    },
    [],
  );
  const unregister = useCallback((id: string) => {
    items.current.delete(id);
    setVersion((v) => v + 1);
  }, []);

  // Init WebGL once.
  useLayoutEffect(() => {
    if (!wantGlass || !canvasRef.current) return;
    const r = createRenderer(canvasRef.current);
    if (!r) {
      setGlOk(false);
      return;
    }
    rendererRef.current = r;
    setGlOk(true);
    return () => {
      r.dispose();
      rendererRef.current = null;
    };
  }, [wantGlass]);

  // Load background texture (blocks render until ready).
  useLayoutEffect(() => {
    if (!wantGlass) {
      setBgReady(false);
      return;
    }
    const src = asset(bgImage);
    if (!src) {
      // No wallpaper — clear any prior image so the draw loop uploads the
      // solid sheet color instead. Nothing to await.
      imgRef.current = null;
      return;
    }
    const handle = delayRender(`liquid-glass-bg:${src}`);
    const img = new Image();
    img.crossOrigin = "anonymous";
    let cancelled = false;
    img.onload = () => {
      if (cancelled) return;
      imgRef.current = img;
      rendererRef.current?.setBg(img);
      setBgReady(true);
      continueRender(handle);
    };
    img.onerror = () => {
      if (cancelled) return;
      setBgReady(false);
      continueRender(handle);
    };
    img.src = src;
    return () => {
      cancelled = true;
      continueRender(handle);
    };
  }, [wantGlass, bgImage, glOk]);

  // With a wallpaper, wait for it to decode; with none, the solid texture is
  // uploaded inline in the draw loop, so no readiness gate is needed.
  const active = wantGlass && glOk && (!hasImage || bgReady);

  // Seek-driven draw — re-measure every registered child on the current frame.
  useLayoutEffect(() => {
    if (!active) return;
    const renderer = rendererRef.current;
    const container = containerRef.current;
    if (!renderer || !container) return;
    const solid = !imgRef.current;
    if (imgRef.current) {
      renderer.setBg(imgRef.current);
    } else {
      const [r, g, b] = parseHexColor(bgColor);
      renderer.setSolidBg(r, g, b);
    }

    const cb = container.getBoundingClientRect();
    const cssW = container.clientWidth || cb.width;
    const cssH = container.clientHeight || cb.height;
    // The chat is rendered inside ChatFill's `transform: scale(...)`, so
    // getBoundingClientRect() returns SCALED screen px while `cssW/cssH`
    // (clientWidth) and `uResolution` are the UNSCALED layout size. Divide
    // measured rects back into layout space so the glass shapes line up with
    // the DOM elements at any nesting/scale.
    const scaleX = cb.width > 0 ? cb.width / cssW : 1;
    const scaleY = cb.height > 0 ? cb.height / cssH : 1;
    const rects: {
      cx: number;
      cy: number;
      w: number;
      h: number;
      r: number;
      frost: boolean;
    }[] = [];
    items.current.forEach(({ el, radius, frost, tail }) => {
      const rb = el.getBoundingClientRect();
      if (rb.width < 1 || rb.height < 1) return;
      const w = rb.width / scaleX;
      const h = rb.height / scaleY;
      const cx = (rb.left - cb.left) / scaleX + w / 2;
      const cy = (rb.top - cb.top) / scaleY + h / 2;
      const r = Math.min(radius, w / 2, h / 2);
      rects.push({ cx, cy, w, h, r, frost });

      // Seamless iMessage tail: a small rounded square tucked into the bottom
      // corner that the shader unions (min-SDF) with the body — one shape, no
      // seam. Only meaningful for frosted bubbles.
      if (tail) {
        const ts = Math.min(15, h * 0.42);
        const bottom = cy + h / 2;
        const tx =
          tail === "left" ? cx - w / 2 + ts * 0.45 : cx + w / 2 - ts * 0.45;
        rects.push({
          cx: tx,
          cy: bottom - ts * 0.32,
          w: ts,
          h: ts,
          r: ts * 0.32,
          frost,
        });
      }
    });
    // Buffer resolution = on-screen size (cb.* is post-transform CSS px) ×
    // devicePixelRatio, capped so big 4K canvases stay sane.
    const dpr = Math.min(
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
      3,
    );
    const pixelW = Math.min(4096, cb.width * dpr);
    const pixelH = Math.min(4096, cb.height * dpr);
    renderer.draw(rects, cssW, cssH, pixelW, pixelH, resolvedParams, solid);
  }, [active, frame, version, resolvedParams, bgColor]);

  const ctx = useMemo<GlassCtxValue>(
    () => ({ active, register, unregister }),
    [active, register, unregister],
  );

  const resolvedBg = bgImage ? asset(bgImage) : undefined;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "relative", overflow: "hidden", ...style }}
    >
      {/* z0 — solid backdrop + wallpaper */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: bgColor,
          zIndex: 0,
        }}
      />
      {resolvedBg && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url('${resolvedBg}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            zIndex: 0,
          }}
        />
      )}
      {/* z1 — refraction canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1,
          display: active ? "block" : "none",
        }}
      />
      {/* z2 — chat chrome / content */}
      <div style={{ position: "relative", zIndex: 2, height: "100%" }}>
        <GlassContext.Provider value={ctx}>{children}</GlassContext.Provider>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- LiquidGlass */

export function LiquidGlass({
  radius = 18,
  frost = false,
  tail = null,
  forceCss = false,
  className,
  style,
  glassStyle,
  children,
}: {
  /** Corner radius of the glass shape (px, design space). */
  radius?: number;
  /** Glossy frosted bubble (blur + tint) instead of refractive liquid glass. */
  frost?: boolean;
  /** Draw a seamless tail tucked into this bottom corner (frosted bubbles). */
  tail?: TailSide;
  /**
   * Skip the WebGL refraction and always render `glassStyle` (CSS glass). Use
   * for chrome over a solid/dark sheet, where there's nothing to refract and
   * the shader would render a near-invisible flat shape — a real frosted CSS
   * pill (translucent fill + rim + blur) reads as glass instead.
   */
  forceCss?: boolean;
  className?: string;
  /** Style applied in BOTH modes (layout, padding, etc.). */
  style?: React.CSSProperties;
  /**
   * Style applied ONLY when glass is inactive (the solid fallback look —
   * background, border, boxShadow). Dropped when the canvas takes over so the
   * refraction shows through.
   */
  glassStyle?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const ctx = useContext(GlassContext);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const active = (ctx?.active ?? false) && !forceCss;

  useLayoutEffect(() => {
    if (!active || !ctx || !ref.current) return;
    ctx.register(id, ref.current, radius, frost, tail);
    return () => ctx.unregister(id);
  }, [active, ctx, id, radius, frost, tail]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        borderRadius: radius,
        ...(active
          ? { background: "transparent", border: "none", boxShadow: "none" }
          : glassStyle),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
