import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText } from "ai";
import { systemPrompt } from "@/lib/agent/system";
import { tools } from "@/lib/agent/tools";

// Builds need time: ~15 tool calls (listScenesInCategory ×2-3 +
// getSceneDetails ×6-8 + buildProject), plus the model has to think
// about narrative pacing between calls. 30s was cutting builds off
// mid-flow with only half the planned scenes added.
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4.1-mini"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages, { tools }),
    tools,
    stopWhen: stepCountIs(60),
  });

  return result.toUIMessageStreamResponse();
}
