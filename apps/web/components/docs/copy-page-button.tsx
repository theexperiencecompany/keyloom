"use client";

import { Copy01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import * as React from "react";

export function CopyPageButton({ content }: { content: string }) {
  const [copied, setCopied] = React.useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="hidden gap-1.5 text-[12px] sm:flex"
      onClick={handleCopy}
    >
      <HugeiconsIcon icon={Copy01Icon} size={12} />
      <span>{copied ? "Copied!" : "Copy Page"}</span>
    </Button>
  );
}
