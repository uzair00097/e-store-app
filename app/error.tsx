"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: Sentry.captureException(error) once Sentry is wired up.
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <AlertTriangle className="size-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        An unexpected error occurred. You can try again, or head back to the
        homepage.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </Container>
  );
}
