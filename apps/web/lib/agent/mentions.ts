import { compositionsById } from "@workspace/compositions/registry";
import { isAgentVisible } from "./catalog";
import { trimForAgent } from "./tools";

export type SelectedClipInput = {
  id: string;
  compositionId: string;
} | null;

/**
 * Builds the "focused component mode" system-prompt block that's appended when
 * the user @mentions one or more components in their message.
 *
 * The block inlines each mentioned composition's description, agent notes,
 * trimmed default props, and field contract — so the agent can fill the
 * component precisely WITHOUT a listScenesInCategory / getSceneDetails
 * round-trip. It also spells out the smart targeting rule: edit the selected
 * clip in place when it matches a single mention, otherwise add new clips.
 *
 * Returns null when no valid, agent-visible component was mentioned (the
 * caller then leaves the system prompt unchanged).
 */
export function buildMentionContext(
  mentionIds: unknown,
  selectedClip: SelectedClipInput,
): string | null {
  const raw = Array.isArray(mentionIds)
    ? mentionIds.filter((v): v is string => typeof v === "string")
    : [];
  // De-dupe, keep first-seen order, drop anything not a real agent scene.
  const ids = [...new Set(raw)].filter(isAgentVisible);
  if (ids.length === 0) return null;

  // Edit-in-place only when the user mentioned exactly ONE component AND a clip
  // of that same composition is selected. Every other case (multiple mentions,
  // nothing selected, or a selection of a different type) adds new clips.
  const editTarget =
    ids.length === 1 &&
    selectedClip &&
    selectedClip.compositionId === ids[0] &&
    isAgentVisible(selectedClip.compositionId)
      ? selectedClip
      : null;

  const sections = ids.map((id) => {
    const info = compositionsById[id]!;
    const notes = info.agentNotes ? `\nGuidance: ${info.agentNotes}` : "";
    return [
      `### ${info.title} (\`${info.id}\`)`,
      info.description,
      notes,
      "",
      "Default props (shape + sample values — start here, override only what the request changes):",
      "```json",
      JSON.stringify(trimForAgent(info.defaultProps), null, 2),
      "```",
      "Fields (editing contract — keys, kinds, and allowed options):",
      "```json",
      JSON.stringify(trimForAgent(info.fields), null, 2),
      "```",
    ].join("\n");
  });

  const apply = editTarget
    ? `**How to apply:** A clip of this type is already selected (clipId \`${editTarget.id}\`). EDIT it in place — call \`updateClipProps\` with that clipId and the FULL merged props object. Do NOT add a new clip, and do NOT call buildProject.`
    : `**How to apply:** For EACH mentioned component, call \`addClip\` with its compositionId to get a new clipId, then \`updateClipProps\` with that clipId and the FULL props object. Do NOT call buildProject (that would wipe the timeline).`;

  return [
    "## Focused component mode — the user @mentioned specific components",
    "",
    "The user mentioned the component(s) below and wants them filled/configured **exactly** to their message. You already have each one's field contract and defaults here, so SKIP discovery — do not call listScenesInCategory or getSceneDetails for these.",
    "",
    sections.join("\n\n"),
    "",
    apply,
    "",
    "Rules: fill every field needed to satisfy the request; keep the exact prop/field shape; choose enum/select values only from the listed options; invent nothing the user didn't ask for. For BRAND-LOCKED components, only the content fields apply — leave the authentic colors/fonts alone.",
  ].join("\n");
}
