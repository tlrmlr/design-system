export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

const LIGHTNESS: Record<number, number> = {
  50:  0.975,
  100: 0.950,
  200: 0.900,
  300: 0.825,
  400: 0.700,
  500: 0.550,
  600: 0.425,
  700: 0.330,
  800: 0.240,
  900: 0.160,
  950: 0.110,
};

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

// Shortest-path hue interpolation around the 0–360 wheel
function lerpHue(a: number, b: number, t: number): number {
  const diff = ((b - a + 540) % 360) - 180;
  return (a + diff * t + 360) % 360;
}

export interface PaletteColor {
  step: number;
  l: number;
  c: number;
  h: number;
  css: string;
}

export interface PaletteParams {
  hue: number;
  chromaPeak: number;
  inkTint: number;
  paperTint: number;
  tintHue?: number;    // hue to blend toward at extremes; defaults to hue (no shift)
  tintChroma?: number; // chroma of the tint at extremes; defaults to chromaPeak
}

export function generatePalette(params: PaletteParams): PaletteColor[] {
  const { hue, chromaPeak, inkTint, paperTint, tintHue = hue } = params;
  const tintChroma = params.tintChroma ?? chromaPeak;

  const cPaper = tintChroma * (paperTint / 100);
  const cInk   = tintChroma * (inkTint   / 100);

  return STEPS.map((step, i) => {
    const l = LIGHTNESS[step];

    // Chroma curve: smoothstep from tinted floor → peak → tinted floor
    let c: number;
    if (i <= 5) {
      const t = smoothstep(i / 5);
      c = cPaper + (chromaPeak - cPaper) * t;
    } else {
      const t = smoothstep((i - 5) / 5);
      c = chromaPeak + (cInk - chromaPeak) * t;
    }

    // Hue: blend toward tintHue at the extremes, weighted by tint %
    const tPaper = Math.max(0, (5 - i) / 5); // 1 at step 50,  0 at step 500
    const tInk   = Math.max(0, (i - 5) / 5); // 0 at step 500, 1 at step 950
    const tintFactor = tPaper * (paperTint / 100) + tInk * (inkTint / 100);
    const h = lerpHue(hue, tintHue, tintFactor);

    return {
      step,
      l,
      c,
      h,
      css: `oklch(${l} ${c.toFixed(4)} ${h.toFixed(1)})`,
    };
  });
}
