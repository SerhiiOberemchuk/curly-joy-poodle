import type { ToggleEvent } from "react";

/** A closing native surface stays painted for its CSS exit. Disable its
 * descendants after the browser restores focus, and enable before reopening. */
export function syncSurfaceInteraction(event: ToggleEvent<HTMLElement>) {
  if (event.type === "toggle" || event.newState === "open") {
    event.currentTarget.inert = event.newState === "closed";
  }
}
