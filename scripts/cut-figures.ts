// Turns public/auto-driver-source.webp (auto + driver on a flat yellow background)
// into public/auto.png and public/driver.png with transparent backgrounds.
//   npm run cut-figures
import sharp from "sharp";

const SRC = "public/auto-driver-source.webp";

async function main() {
  const img = sharp(SRC).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // The background is a flat yellow gradient (R≈252, G 185–205, B 55–90). The auto's
  // body is a deeper yellow with much less blue (B≈25), so the blue channel separates
  // them where plain colour distance can't. Keying every pixel (not a flood fill) also
  // clears the background seen through the open cabin.
  for (let p = 0; p < width * height; p++) {
    const i = p * channels;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const yellowish = r > 235 && g > 175 && g < 215;
    if (!yellowish) continue;
    if (b >= 52) data[i + 3] = 0;
    else if (b >= 40) data[i + 3] = Math.round(((52 - b) / 12) * 255); // soft edge
  }

  // Split at the widest fully-transparent column gap between the two figures.
  const colHas = new Array<boolean>(width).fill(false);
  for (let p = 0; p < width * height; p++) if (data[p * channels + 3] > 20) colHas[p % width] = true;
  let bestStart = 0, bestLen = 0, runStart = -1;
  for (let x = 0; x <= width; x++) {
    const empty = x < width && !colHas[x];
    if (empty && runStart === -1) runStart = x;
    if (!empty && runStart !== -1) {
      const len = x - runStart;
      // ignore the margins: only gaps with content on both sides count
      if (runStart > 0 && x < width && len > bestLen) { bestLen = len; bestStart = runStart; }
      runStart = -1;
    }
  }
  const split = bestStart + Math.floor(bestLen / 2);
  console.log(`image ${width}x${height}, split at x=${split}`);

  const keyed = await sharp(data, { raw: { width, height, channels } }).png().toBuffer();
  // sharp applies trim before extract in one pipeline, so crop first, then trim separately.
  const auto = await sharp(keyed).extract({ left: 0, top: 0, width: split, height }).png().toBuffer();
  await sharp(auto).trim().png().toFile("public/auto.png");
  const driver = await sharp(keyed).extract({ left: split, top: 0, width: width - split, height }).png().toBuffer();
  await sharp(driver).trim().png().toFile("public/driver.png");
  for (const f of ["public/auto.png", "public/driver.png"]) {
    const m = await sharp(f).metadata();
    console.log(`${f}: ${m.width}x${m.height}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
