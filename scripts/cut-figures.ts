// Turns public/auto-driver-source.webp (auto + driver on a flat yellow background)
// into public/auto.png and public/driver.png with transparent backgrounds.
//   npm run cut-figures
import sharp from "sharp";

//   npm run cut-figures -- <source> <output.png>   key out one figure, no split
const SRC = "public/auto-driver-source.webp";

async function main() {
  const [singleSrc, singleOut] = process.argv.slice(2);
  const img = sharp(singleSrc ?? SRC).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // The background is a flat yellow gradient (R≈252, G 185–205, B 55–90). The auto's
  // body is a deeper yellow with much less blue (B≈25), so the blue channel separates
  // them where plain colour distance can't. Keying every pixel (not a flood fill) also
  // clears the background seen through the open cabin.
  // Sample the background from the four corners (the sheets are flat yellow, but the exact
  // shade varies between images). A pixel is background if it is close to that colour.
  // Threshold is tight enough to leave khaki shirts and the auto's deeper yellow alone.
  const corner = (x: number, y: number) => { const i = (y * width + x) * channels; return [data[i], data[i + 1], data[i + 2]]; };
  const cs = [corner(2, 2), corner(width - 3, 2), corner(2, height - 3), corner(width - 3, height - 3)];
  // Use the corner colour that most other corners agree with (a strip may have content at the bottom edge).
  const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const bg = cs.reduce((best, c) => (cs.filter((o) => dist(o, c) < 25).length > cs.filter((o) => dist(o, best) < 25).length ? c : best), cs[0]);
  console.log(`background ≈ rgb(${bg.join(",")})`);
  const HARD = 34, SOFT = 52;
  for (let p = 0; p < width * height; p++) {
    const i = p * channels;
    const d = Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]);
    if (d < HARD) data[i + 3] = 0;
    else if (d < SOFT) data[i + 3] = Math.round(((d - HARD) / (SOFT - HARD)) * 255);
  }

  if (singleSrc) {
    const keyed = await sharp(data, { raw: { width, height, channels } }).png().toBuffer();
    const names = singleOut.split(",");
    if (names.length === 1) {
      await sharp(keyed).trim().png().toFile(singleOut);
      const m = await sharp(singleOut).metadata();
      console.log(`${singleOut}: ${m.width}x${m.height}`);
      return;
    }
    // A sheet of several figures side by side: split at every clear column gap.
    const colHas = new Array<boolean>(width).fill(false);
    for (let p = 0; p < width * height; p++) if (data[p * channels + 3] > 20) colHas[p % width] = true;
    const segments: [number, number][] = [];
    let start = -1;
    for (let x = 0; x <= width; x++) {
      const has = x < width && colHas[x];
      if (has && start === -1) start = x;
      if (!has && start !== -1) { segments.push([start, x]); start = -1; }
    }
    // Merge slivers (a stray pixel column) into their neighbour.
    const merged: [number, number][] = [];
    for (const s of segments) {
      const last = merged[merged.length - 1];
      if (last && s[0] - last[1] < 12) last[1] = s[1];
      else merged.push([...s]);
    }
    // Figures that touch (an arm crossing the gap) share a segment: split the widest
    // segment at its thinnest column until the count matches.
    const colCount = new Array<number>(width).fill(0);
    for (let p = 0; p < width * height; p++) if (data[p * channels + 3] > 20) colCount[p % width]++;
    while (merged.length < names.length) {
      merged.sort((a, b) => a[0] - b[0]);
      const i = merged.reduce((best, s, idx) => (s[1] - s[0] > merged[best][1] - merged[best][0] ? idx : best), 0);
      const [l, r] = merged[i];
      let cut = -1, min = Infinity;
      for (let x = l + Math.floor((r - l) * 0.3); x < l + Math.floor((r - l) * 0.7); x++) {
        if (colCount[x] < min) { min = colCount[x]; cut = x; }
      }
      merged.splice(i, 1, [l, cut], [cut, r]);
      console.log(`split touching figures at x=${cut} (${min} px of overlap)`);
    }
    if (merged.length !== names.length) {
      console.log(`found ${merged.length} figures but ${names.length} names given: ${merged.map((s) => s.join("-")).join(", ")}`);
      process.exit(1);
    }
    for (let i = 0; i < merged.length; i++) {
      const [l, r] = merged[i];
      const buf = await sharp(keyed).extract({ left: l, top: 0, width: r - l, height }).png().toBuffer();
      await sharp(buf).trim().png().toFile(names[i]);
      const m = await sharp(names[i]).metadata();
      console.log(`${names[i]}: ${m.width}x${m.height}`);
    }
    return;
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
