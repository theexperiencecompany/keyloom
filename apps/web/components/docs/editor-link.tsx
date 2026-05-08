import { ArrowRight01Icon, Edit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { RaisedButton } from "@workspace/ui/components/raised-button";
import Link from "next/link";

export function EditorLink({ id }: { id: string }) {
  return (
    <RaisedButton asChild className="not-prose my-4" color="#3b82f6">
      <Link href={`/component/${id}/edit`}>
        <HugeiconsIcon icon={Edit02Icon} size={14} />
        Open editor
        <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
      </Link>
    </RaisedButton>
  );
}
