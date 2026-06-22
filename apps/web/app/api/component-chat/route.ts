import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText, tool } from "ai";
import { z } from "zod";

// Editing one component is a few tool turns at most (read context → rewrite →
// maybe fix a compile error the client reports back). Keep it tight.
export const maxDuration = 120;

const SYSTEM = `You edit a SINGLE Remotion React component written in TSX. The user describes a change ("move the icon to the right", "make the title bigger", "stack these vertically") and you rewrite the component's source to match.

Rules:
- Call \`updateComponentCode\` with the COMPLETE updated file every time — never a diff, never a fragment.
- Keep the SAME exported component name and the SAME props interface unless the user explicitly asks to change them.
- Only import from modules the component already uses. Allowed: "react", "remotion", "@remotion/transitions", "@remotion/media", "@remotion/layout-utils", "@hugeicons/react", "@hugeicons/core-free-icons", and the relative helpers it already imports (e.g. "../../clip-style", "../../use-design-frame"). Do NOT add new npm packages.
- This renders headlessly in Remotion: no network calls, no fetch, no eval, no timers, no direct window/document side effects.
- Keep the component a pure function of its props + the frame (use the existing useDesignFrame()/useCurrentFrame patterns already in the file).
- After you call the tool, the client compiles it and reports back. If it returns an error, fix it and call the tool again.
- Keep edits minimal and focused on what the user asked.`;

export async function POST(req: Request) {
  const { messages, code, baseId } = (await req.json()) as {
    messages: unknown;
    code?: string;
    baseId?: string;
  };

  const system = `${SYSTEM}\n\n---\nThe component${baseId ? ` (forked from "${baseId}")` : ""} current source:\n\n\`\`\`tsx\n${code ?? ""}\n\`\`\``;

  const tools = {
    updateComponentCode: tool({
      description:
        "Replace the component's full TSX source with an updated version. Always pass the COMPLETE file.",
      inputSchema: z.object({
        code: z
          .string()
          .describe("The complete updated TSX source for the component."),
      }),
    }),
  };

  const result = streamText({
    model: openai("gpt-5-mini"),
    system,
    messages: await convertToModelMessages(messages as never, { tools }),
    tools,
    stopWhen: stepCountIs(8),
    temperature: 0.4,
    onError: ({ error }) => {
      console.error("[component-agent] streamText error:", error);
    },
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      console.error("[component-agent] response error:", error);
      if (error instanceof Error) return error.message;
      return "Component agent request failed.";
    },
  });
}
