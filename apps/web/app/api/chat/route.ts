import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import {
  buildMentionContext,
  type SelectedClipInput,
} from "@/lib/agent/mentions";
import { systemPrompt } from "@/lib/agent/system";
import { tools } from "@/lib/agent/tools";

// Builds need time: ~15 tool calls (listScenesInCategory ×2-3 +
// getSceneDetails ×6-8 + buildProject), plus the model has to think
// about narrative pacing between calls. 30s was cutting builds off
// mid-flow with only half the planned scenes added.
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages, mentions, selectedClip } = (await req.json()) as {
    messages: unknown;
    mentions?: unknown;
    selectedClip?: SelectedClipInput;
  };

  let fullSystem = systemPrompt;

  // When the user @mentioned components, append a focused-mode block that
  // inlines those components' field contracts + the targeting rule, so the
  // agent fills them precisely without discovery round-trips.
  const mentionContext = buildMentionContext(mentions, selectedClip ?? null);
  if (mentionContext) {
    fullSystem = `${fullSystem}\n\n---\n\n${mentionContext}`;
  }

  const result = streamText({
    model: openai("gpt-5-mini"),
    system: fullSystem,
    messages: await convertToModelMessages(messages as never, { tools }),
    tools,
    stopWhen: stepCountIs(60),
    // Default is ~1.0 but explicit so we remember to tune. Higher than
    // default would risk invalid tool args; lower would make the agent
    // pick the same scenes every build (which it was doing).
    temperature: 0.9,
    // Log stream-internal errors so we can see rate limits / malformed
    // tool-result state issues server-side instead of staring at a
    // silent client.
    onError: ({ error }) => {
      console.error("[agent] streamText error:", error);
    },
  });

  return result.toUIMessageStreamResponse({
    // Surface the actual error text to the client UI instead of the
    // generic "Error in input stream". Walks `.cause` chains so we get
    // the real OpenAI/Zod message buried under SDK wrappers.
    onError: (error) => {
      console.error("[agent] response error:", error);
      return formatAgentError(error);
    },
  });
}

function formatAgentError(error: unknown): string {
  // Unwrap nested .cause chains — AI SDK and OpenAI both wrap.
  const visited = new Set<unknown>();
  let cur: unknown = error;
  const layers: string[] = [];
  while (cur && !visited.has(cur)) {
    visited.add(cur);
    if (cur instanceof Error) {
      if (cur.message) layers.push(cur.message);
      cur = (cur as { cause?: unknown }).cause;
    } else if (typeof cur === "string") {
      layers.push(cur);
      cur = undefined;
    } else if (cur && typeof cur === "object") {
      const obj = cur as Record<string, unknown>;
      if (typeof obj.message === "string") layers.push(obj.message);
      else if (typeof obj.error === "string") layers.push(obj.error);
      cur = obj.cause;
    } else {
      cur = undefined;
    }
  }
  // Prefer the deepest (root cause) layer — that's usually the actionable one.
  const deepest = layers[layers.length - 1] ?? "Agent request failed.";
  // Heuristic friendly mapping for the most common opaque message.
  if (/input stream/i.test(deepest) && layers.length > 1) {
    return `Stream error — ${layers[layers.length - 2]}`;
  }
  return deepest;
}
