"use client";

import { useEffect, useRef } from "react";

import { readAttribution } from "@/lib/attribution.client";

/**
 * A hidden `attribution` input for a plain <form>, filled from storage on the
 * client. Without attribution it stays empty and the server omits the block.
 */
export function AttributionField() {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const attribution = readAttribution();
    if (input.current && attribution) {
      input.current.value = JSON.stringify(attribution);
    }
  }, []);
  return <input ref={input} type="hidden" name="attribution" defaultValue="" />;
}
