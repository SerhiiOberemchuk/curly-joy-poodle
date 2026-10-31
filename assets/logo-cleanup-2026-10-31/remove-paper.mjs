import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Alpha matting of the original JPEG, with no tracing, resampling or redrawing.
async function main() {
  const root = path.resolve(import.meta.dirname, "../..");
  const sourcePath = path.join(root, "public/logo_brand.jpg");
  const outputPath = path.join(root, "public/images/brand/logo-brand-clean.png");
  const { data, info } = await sharp(sourcePath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.channels, 3);
  const { width, height } = info;
  const paper = new Uint8Array(width * height);
  const output = Buffer.alloc(width * height * 4);
  const ink = [5, 13, 9];

  for (let p = 0; p < paper.length; p++) {
    const [r, g, b] = data.subarray(p * 3, p * 3 + 3);
    paper[p] = Number(r > 235 && g > 225 && b > 180 && r - b < 80 && g - b < 65);
    data.copy(output, p * 4, p * 3, p * 3 + 3);
    output[p * 4 + 3] = paper[p] ? 0 : 255;
  }

  // Only paper-adjacent antialiased ink edges need decontamination.
  let transparent = 0;
  let edgePixels = 0;
  let protectedPixels = 0;
  for (let p = 0; p < paper.length; p++) {
    const rgb = [...data.subarray(p * 3, p * 3 + 3)];
    const protectedInk = Math.max(...rgb) < 65 || rgb[0] - rgb[2] > 80;
    if (protectedInk) {
      assert.equal(paper[p], 0);
      protectedPixels++;
    }
    if (paper[p]) { transparent++; continue; }
    if (protectedInk) continue;

    const x = p % width;
    const y = Math.floor(p / width);
    const samples = [[], [], []];
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const neighbor = ny * width + nx;
        if (!paper[neighbor]) continue;
        for (let c = 0; c < 3; c++) samples[c].push(data[neighbor * 3 + c]);
      }
    }
    if (samples[0].length === 0) continue;
    const background = samples.map((channel) => channel.sort((a, b) => a - b)[Math.floor(channel.length * 0.8)]);
    const channelAlpha = rgb.map((value, c) => (background[c] - value) / (background[c] - ink[c]));
    const alpha = Math.max(0, Math.min(1, channelAlpha.sort((a, b) => a - b)[1]));
    if (alpha >= 0.98) continue;
    if (alpha <= 0.025) {
      output[p * 4 + 3] = 0;
      transparent++;
      continue;
    }
    output[p * 4 + 3] = Math.round(alpha * 255);
    for (let c = 0; c < 3; c++) {
      output[p * 4 + c] = Math.round(Math.max(0, Math.min(255, (rgb[c] - (1 - alpha) * background[c]) / alpha)));
    }
    edgePixels++;
  }

  for (let p = 0; p < paper.length; p++) {
    if (output[p * 4 + 3] === 0) output.fill(0, p * 4, p * 4 + 3);
  }
  await sharp(output, { raw: { width, height, channels: 4 } }).png().toFile(outputPath);
  const decoded = await sharp(outputPath).ensureAlpha().raw().toBuffer();
  assert.deepEqual(decoded, output);
  for (let p = 0; p < paper.length; p++) {
    const rgb = [...data.subarray(p * 3, p * 3 + 3)];
    if (Math.max(...rgb) < 65 || rgb[0] - rgb[2] > 80) {
      assert.deepEqual([...decoded.subarray(p * 4, p * 4 + 4)], [...rgb, 255]);
    }
  }
  const report = { source: "public/logo_brand.jpg", output: "public/images/brand/logo-brand-clean.png", width, height, transparentPixels: transparent, decontaminatedEdgePixels: edgePixels, unchangedProtectedPixels: protectedPixels, protectedPixelsVerified: true, resampled: false };
  await fs.writeFile(path.join(import.meta.dirname, "verification.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
