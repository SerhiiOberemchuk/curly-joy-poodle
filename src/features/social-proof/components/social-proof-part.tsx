import { Suspense, type ReactNode } from "react";
import { PartBoundary } from "./part-boundary";

/** One independent part: a failure or a slow read hides or delays only this part. */
export function SocialProofPart({ children }: { children: ReactNode }) {
  return (
    <PartBoundary>
      <Suspense fallback={null}>{children}</Suspense>
    </PartBoundary>
  );
}
