"use client";

import { NextStudio } from "next-sanity/studio";

import config from "@/sanity.config";

// `sanity.config.ts` pulls in the Studio's internal deps (structureTool,
// visionTool, the schema), which aren't React components and so don't get
// the automatic server/client split -- importing config from a Server
// Component drags those deps into the RSC bundle and breaks the build
// (swr has no default export under Next's "react-server" condition).
// Marking this page a Client Component keeps that whole graph client-side.
// metadata/viewport live in layout.tsx instead, since a "use client" file
// can't export them.
export default function StudioPage() {
  return <NextStudio config={config} />;
}
