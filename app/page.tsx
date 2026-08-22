import { Container } from "@/components/layout/container";

export default function Home() {
  return (
    <Container className="flex flex-1 flex-col items-center justify-center gap-2 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Storefront coming soon
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The homepage catalog and content are built in a later phase. This
        placeholder confirms the shared layout, design tokens, and
        navigation are wired up.
      </p>
    </Container>
  );
}
