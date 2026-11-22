"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { rememberProductThumbnail } from "./product-photo-preview";

export function ProductCardLink({
  href,
  children,
  className,
  "aria-label": label,
}: {
  href: `/product/${string}`;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  const link = useRef<HTMLAnchorElement>(null);
  return (
    <Link
      ref={link}
      href={href}
      className={className}
      aria-label={label}
      data-product-photo-link=""
      transitionTypes={["open-product"]}
      onNavigate={() => {
        if (!link.current) return;
        rememberProductThumbnail(link.current);
        // Pointer activation does not focus links in every browser.
        link.current.focus({ preventScroll: true });
      }}
    >
      {children}
    </Link>
  );
}
