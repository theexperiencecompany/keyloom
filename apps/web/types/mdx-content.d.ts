declare module "@/content/docs/*.mdx" {
  import type { ComponentType } from "react";
  import type { DocMeta } from "@/lib/docs";

  export const meta: DocMeta;
  const Component: ComponentType;
  export default Component;
}
