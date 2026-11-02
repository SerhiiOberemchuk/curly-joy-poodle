import type { SVGProps } from "react";

const paths = {
  star: "m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L2 9.6l6.2-.9L12 3Z",
  chat: "M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-1 2v-9.5a8.5 8.5 0 1 1 18-1ZM8 10h8M8 14h5",
  close: "m6 6 12 12M6 18 18 6",
  shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3ZM8 12l3 3 5-6",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  menu: "M4 6h16M4 12h16M4 18h16",
  search: "M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  user: "M4 21v-2a8 8 0 0 1 16 0v2M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  heart:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  truck:
    "M1 4h13v13H1ZM14 9h5l4 5v3h-9M8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0M21 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0",
  leaf: "M3 21C3 7 12 2 22 2c0 13-7 19-17 16M3 21 17 7",
  paw: "M8 13c2-4 6-4 8 0 1 2 5 4 3 7-2 3-5-1-7-1s-5 4-7 1c-2-3 2-5 3-7ZM9 5c0 4-4 4-4 0s4-4 4 0ZM16 4c0 4-4 4-4 0s4-4 4 0ZM22 9c-1 4-5 3-4-1s5-3 4 1ZM5 10c1 4-3 5-4 1s3-5 4-1Z",
  bag: "M4 7h16l-1 14H5L4 7ZM8 7V5a4 4 0 0 1 8 0v2",
  cart: "M2.5 3h2.2l2.4 11.2a1.8 1.8 0 0 0 1.8 1.4h8.6a1.8 1.8 0 0 0 1.7-1.3L21 7H5.7M8 20.5a1 1 0 1 0 2 0 1 1 0 1 0-2 0M16.5 20.5a1 1 0 1 0 2 0 1 1 0 1 0-2 0",
  cartAdd: "M2.5 3h2.2l2.4 11.2a1.8 1.8 0 0 0 1.8 1.4h8.6a1.8 1.8 0 0 0 1.7-1.3L21 7H5.7M8 20.5a1 1 0 1 0 2 0 1 1 0 1 0-2 0M16.5 20.5a1 1 0 1 0 2 0 1 1 0 1 0-2 0M13 8.5v4M11 10.5h4",
  check: "m5 12.5 4.5 4.5L19 7.5",
  chevronDown: "m6 9 6 6 6-6",
  chevronLeft: "m15 6-6 6 6 6",
  chevronRight: "m9 6 6 6-6 6",
  home: "M3 10.5 12 3l9 7.5M5.5 8.5V21h13V8.5M10 21v-6h4v6",
  phone:
    "M5 3h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 5.3 5.3l1.4-2.2L19 13.5V17a2 2 0 0 1-2 2A15 15 0 0 1 3 5a2 2 0 0 1 2-2Z",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  filter: "M4 6h16M7 12h10M10 18h4",
} as const;

/** Line icons shared by the site chrome and the home page. Decorative: always `aria-hidden`. */
export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: keyof typeof paths }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
