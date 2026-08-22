import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { apiVersion, dataset, projectId } from "@/lib/sanity/env";
import { schemaTypes } from "@/sanity/schemaTypes";

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,
  schema: {
    types: schemaTypes,
  },
  plugins: [
    structureTool(),
    // Lets editors run raw GROQ in the Studio -- useful for validating the
    // parameterized queries the chatbot's search_products tool will use.
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
