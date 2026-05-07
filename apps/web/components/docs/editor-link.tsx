import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, Edit02Icon } from "@hugeicons/core-free-icons"

export function EditorLink({ id }: { id: string }) {
  return (
    <Link
      href={`/component/${id}/edit`}
      className="not-prose inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90 my-4"
    >
      <HugeiconsIcon icon={Edit02Icon} size={14} />
      Open editor
      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
    </Link>
  )
}
