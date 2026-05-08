import { compositionsById } from "@workspace/compositions/registry"
import type { Field } from "@workspace/compositions/schema"

export function PropsTable({ id }: { id: string }) {
  const info = compositionsById[id]
  if (!info) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
        No composition registered for id &quot;{id}&quot;.
      </div>
    )
  }
  return (
    <div className="overflow-hidden rounded-lg border border-border my-6 not-prose">
      <table className="w-full text-sm">
        <thead className="bg-muted/30">
          <tr className="text-left text-[12px] font-medium text-muted-foreground">
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Type</th>
            <th className="px-4 py-2">Default</th>
          </tr>
        </thead>
        <tbody>
          {info.fields.map((f) => (
            <tr key={f.key} className="border-t border-border">
              <td className="px-4 py-2 font-mono text-[13px]">{f.key}</td>
              <td className="px-4 py-2 text-muted-foreground">
                {describeType(f)}
              </td>
              <td className="px-4 py-2 font-mono text-[12px] text-muted-foreground">
                {formatDefault(
                  (info.defaultProps as Record<string, unknown>)[f.key],
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function describeType(field: Field): string {
  switch (field.kind) {
    case "chat":
      return "ChatMessage[]"
    case "composition":
      return "string (composition id)"
    case "slots":
      return "Record<string, string[]>"
    case "text":
    case "textarea":
      return "string"
    case "color":
      return "string (hex)"
    case "image":
      return "string (url)"
    case "number":
      return "number"
    case "select":
      return field.options.map((o) => `"${o.value}"`).join(" | ")
  }
}

function formatDefault(v: unknown): string {
  if (v === undefined) return "—"
  if (typeof v === "string") return `"${v}"`
  if (Array.isArray(v)) return `[${v.length} item${v.length === 1 ? "" : "s"}]`
  return String(v)
}
