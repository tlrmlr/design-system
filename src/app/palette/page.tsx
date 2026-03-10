"use client";

import { useState, useRef, useCallback } from "react";
import { generatePalette } from "@/lib/color";
import { HueWheel } from "@/components/HueWheel";
import { PaletteColumn } from "@/components/PaletteRow";
import { TAILWIND_COLOR_NAMES, COLOR_OKLCH } from "@/lib/tailwindColors";

type ActiveTint = "ink" | "paper" | "both";

interface PaletteState {
  hue: number;
  chromaPeak: number;
  inkTint: number;
  paperTint: number;
  bothTint: number;
  activeTint: ActiveTint;
}

const INITIAL: PaletteState = {
  hue: 220,
  chromaPeak: 0.2,
  inkTint: 0,
  paperTint: 0,
  bothTint: 0,
  activeTint: "both",
};

export default function PalettePage() {
  const [state, setState] = useState<PaletteState>(INITIAL);
  const [past, setPast] = useState<PaletteState[]>([]);
  const [future, setFuture] = useState<PaletteState[]>([]);
  const snapRef = useRef<PaletteState | null>(null);

  function snapshot() {
    snapRef.current = state;
  }

  function commit() {
    const snap = snapRef.current;
    if (!snap) return;
    snapRef.current = null;
    setPast((p) => [...p, snap]);
    setFuture([]);
  }

  function undo() {
    if (!past.length) return;
    setFuture((f) => [state, ...f]);
    setState(past[past.length - 1]);
    setPast((p) => p.slice(0, -1));
  }

  function redo() {
    if (!future.length) return;
    setPast((p) => [...p, state]);
    setState(future[0]);
    setFuture((f) => f.slice(1));
  }

  function update(patch: Partial<PaletteState>) {
    setState((s) => ({ ...s, ...patch }));
  }

  const [copied, setCopied] = useState(false);

  const resolvedInk = state.activeTint === "both" ? state.bothTint : state.inkTint;
  const resolvedPaper = state.activeTint === "both" ? state.bothTint : state.paperTint;

  const palette = generatePalette({
    hue: state.hue,
    chromaPeak: state.chromaPeak,
    inkTint: resolvedInk,
    paperTint: resolvedPaper,
  });

  const peakColor = palette.find((c) => c.step === 500)!;

  const neutralScale = generatePalette({ hue: state.hue, chromaPeak: 0, inkTint: resolvedInk, paperTint: resolvedPaper, tintHue: state.hue, tintChroma: state.chromaPeak })
    .map((c) => ({ step: c.step, css: c.css }));

  const copyOklch = useCallback(() => {
    navigator.clipboard.writeText(peakColor.css);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [peakColor.css]);

  const tintSliders: {
    key: ActiveTint;
    label: string;
    value: number;
    onUpdate: (v: number) => void;
  }[] = [
    {
      key: "ink",
      label: "Ink Tint",
      value: state.inkTint,
      onUpdate: (v) => update({ inkTint: v, paperTint: 0, bothTint: 0, activeTint: "ink" }),
    },
    {
      key: "paper",
      label: "Paper Tint",
      value: state.paperTint,
      onUpdate: (v) => update({ paperTint: v, inkTint: 0, bothTint: 0, activeTint: "paper" }),
    },
    {
      key: "both",
      label: "Both",
      value: state.bothTint,
      onUpdate: (v) => update({ bothTint: v, inkTint: 0, paperTint: 0, activeTint: "both" }),
    },
  ];

  return (
    <main className="min-h-screen px-12 py-16 space-y-12">

      {/* Controls */}
      <section className="space-y-6 max-w-xl">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-medium tracking-widest uppercase text-neutral-400">Color Palette Generator</h1>
          <div className="flex gap-1">
            <button
              onClick={undo}
              disabled={!past.length}
              className="px-3 py-1 text-sm border rounded disabled:opacity-30 hover:bg-neutral-50 disabled:cursor-not-allowed"
            >
              Undo
            </button>
            <button
              onClick={redo}
              disabled={!future.length}
              className="px-3 py-1 text-sm border rounded disabled:opacity-30 hover:bg-neutral-50 disabled:cursor-not-allowed"
            >
              Redo
            </button>
          </div>
        </div>

        {/* Swatch + Hue + Chroma row */}
        <div className="flex items-start gap-6">

          {/* Peak swatch */}
          <div className="flex flex-col gap-2" style={{ width: 80 }}>
            <span className="text-sm">Color</span>
            <div
              className="rounded"
              style={{ width: 80, height: 80, backgroundColor: peakColor.css }}
            />
            <span className="text-xs tabular-nums text-neutral-400 leading-tight break-all">
              {peakColor.css}
            </span>
            <button
              onClick={copyOklch}
              className="text-xs border rounded px-2 py-1 hover:bg-neutral-50 transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Hue wheel */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm" style={{ width: 160 }}>
              <label>Hue</label>
              <span className="tabular-nums text-neutral-400">{state.hue}°</span>
            </div>
            <HueWheel
              hue={state.hue}
              onChange={(hue) => {
                if (!snapRef.current) snapshot();
                update({ hue });
              }}
              onCommit={commit}
              size={160}
            />
          </div>

          {/* Chroma peak */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <label>Chroma</label>
              <span className="tabular-nums text-neutral-400">{state.chromaPeak.toFixed(2)}</span>
            </div>
            <div style={{ height: 160, width: 24, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <input
                type="range"
                min={0}
                max={0.4}
                step={0.01}
                value={state.chromaPeak}
                onPointerDown={snapshot}
                onChange={(e) => update({ chromaPeak: Number(e.target.value) })}
                onPointerUp={commit}
                style={{ position: "absolute", width: 160, transform: "rotate(-90deg)" }}
              />
            </div>
          </div>

        </div>

        {/* Tint Sliders */}
        <div className="space-y-3">
          <label className="text-sm">Tint Application</label>
          {tintSliders.map(({ key, label, value, onUpdate }) => (
            <div key={key} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className={state.activeTint === key ? "text-neutral-900" : "text-neutral-400"}>{label}</span>
                <span className="tabular-nums text-neutral-400">{value}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={value}
                onPointerDown={snapshot}
                onChange={(e) => onUpdate(Number(e.target.value))}
                onPointerUp={commit}
                className="w-full"
                style={{ opacity: state.activeTint === key ? 1 : 0.35 }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Palette Reference */}
      <section>
        <h2 className="text-sm font-medium tracking-widest uppercase text-neutral-400 mb-4">Palettes</h2>
        <div className="flex gap-0.5 overflow-x-auto pb-2">

          <PaletteColumn
            name="white"
            swatches={[...neutralScale].reverse()}
          />

          {TAILWIND_COLOR_NAMES.map((name) => {
            const { hue, chromaPeak } = COLOR_OKLCH[name];
            const scale = generatePalette({ hue, chromaPeak, inkTint: resolvedInk, paperTint: resolvedPaper, tintHue: state.hue, tintChroma: state.chromaPeak });
            return (
              <PaletteColumn
                key={name}
                name={name}
                swatches={[...scale].reverse().map((c) => ({ step: c.step, css: c.css }))}
              />
            );
          })}

          <PaletteColumn
            name="black"
            swatches={[...neutralScale].reverse()}
          />

        </div>
      </section>

    </main>
  );
}
