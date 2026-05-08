import { ArrowRight01Icon, Edit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

export function EditorLink({ id }: { id: string }) {
  return (
    <Button asChild className="not-prose my-4">
      <Link href={`/component/${id}/edit`}>
        <HugeiconsIcon icon={Edit02Icon} size={14} />
        Open editor
        <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
      </Link>
    </Button>
  );
}
