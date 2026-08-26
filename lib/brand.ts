// Single source of truth for the SnapCart mark: a shopping-cart outline
// whose basket is a lightning bolt. Shared by the React logo chip and the
// next/og-rendered favicon/apple-icon, which can't import each other's
// runtime (edge vs. RSC) but can share plain path data.
export const BRAND_COLOR = "#D85A30";

export const CART_PATH_D =
  "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12";

export const BOLT_PATH_D =
  "M12.5 8.3 L8.7 12.7 L11.3 12.7 L10.4 15.7 L15.2 10.8 L12.4 10.8 Z";
