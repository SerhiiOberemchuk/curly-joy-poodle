import type { SVGProps } from "react";

const paths = {
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
  briefcase:
    "M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 7h16a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1ZM3 12h18M10 12v2h4v-2",
} as const;

export function HomeIcon({
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
