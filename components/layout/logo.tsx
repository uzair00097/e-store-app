import { cn } from "@/lib/utils";
import { BOLT_PATH_D, CART_PATH_D } from "@/lib/brand";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-coral-600",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-[62%]"
        aria-hidden="true"
      >
        <circle cx="8" cy="21" r="1" fill="white" stroke="none" />
        <circle cx="19" cy="21" r="1" fill="white" stroke="none" />
        <path d={CART_PATH_D} />
        <path d={BOLT_PATH_D} fill="white" stroke="none" />
      </svg>
    </span>
  );
}
