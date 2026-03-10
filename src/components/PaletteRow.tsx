interface Swatch {
  step: number;
  css: string;
}

interface PaletteColumnProps {
  name: string;
  swatches: Swatch[]; // expects darkest → lightest order
}

export function PaletteColumn({ name, swatches }: PaletteColumnProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      {swatches.map((s) => (
        <div
          key={s.step}
          className="w-9 h-9"
          style={{ backgroundColor: s.css }}
          title={`${name}-${s.step}`}
        />
      ))}
      <span
        className="text-xs text-neutral-400 mt-1"
        style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", fontSize: 10 }}
      >
        {name}
      </span>
    </div>
  );
}
