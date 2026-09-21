// `output: "standalone"` leaves public/ and .next/static/ out of the bundle —
// they are meant for a CDN. HostiQ has none in front, so server.js serves them
// itself once they sit next to it.
import { cpSync, existsSync } from "node:fs";

const target = ".next/standalone";

if (existsSync(target)) {
  cpSync("public", `${target}/public`, { recursive: true });
  cpSync(".next/static", `${target}/.next/static`, { recursive: true });
}
