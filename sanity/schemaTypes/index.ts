import type { SchemaTypeDefinition } from "sanity";

import category from "./category";
import order from "./order";
import product from "./product";
import searchLog from "./searchLog";

export const schemaTypes: SchemaTypeDefinition[] = [
  product,
  category,
  order,
  searchLog,
];
