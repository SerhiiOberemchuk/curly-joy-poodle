export type VideoSource = { kind: "embed" | "file" | "link"; src: string };

/** Only the known providers become embeds; every other HTTPS URL stays a link. */
export function videoSource(value: string): VideoSource | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const hostname = url.hostname.toLowerCase();
  const youtubeHosts = ["youtube.com", "www.youtube.com", "m.youtube.com"];
  const id =
    hostname === "youtu.be"
      ? url.pathname.slice(1)
      : youtubeHosts.includes(hostname)
        ? (url.searchParams.get("v") ??
          url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)$/)?.[1])
        : null;
  if (id && /^[\w-]{11}$/.test(id)) {
    return {
      kind: "embed",
      src: `https://www.youtube-nocookie.com/embed/${id}`,
    };
  }
  if (["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(hostname)) {
    const match = url.pathname.match(/^\/(?:video\/)?(\d+)$/);
    if (match) {
      const embed = new URL(`https://player.vimeo.com/video/${match[1]}`);
      // Unlisted Vimeo clips require their privacy hash to play.
      const hash = url.searchParams.get("h");
      if (hash && /^[a-z0-9]+$/i.test(hash)) embed.searchParams.set("h", hash);
      return { kind: "embed", src: embed.href };
    }
  }
  return {
    kind: /\.(mp4|webm|ogg)$/i.test(url.pathname) ? "file" : "link",
    src: url.href,
  };
}
