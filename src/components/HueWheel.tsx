"use client";

import { useRef, useCallback } from "react";

interface HueWheelProps {
  hue: number;
  onChange: (hue: number) => void;
  onCommit?: () => void;
  size?: number;
}

export function HueWheel({ hue, onChange, onCommit, size = 160 }: HueWheelProps) {
  const ref = useRef<HTMLDivElement>(null);

  const getAngle = useCallback((clientX: number, clientY: number) => {
    if (!ref.current) return 0;
    const rect = ref.current.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    // atan2 is 0 at right, going clockwise. We want 0 at top.
    const angle = (Math.atan2(dy, dx) * (180 / Math.PI) + 90 + 360) % 360;
    return Math.round(angle);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onChange(getAngle(e.clientX, e.clientY));

      const onMove = (e: MouseEvent) => onChange(getAngle(e.clientX, e.clientY));
      const onUp = () => {
        onCommit?.();
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [getAngle, onChange]
  );

  // Place handle on the ring midpoint
  const outerR = size / 2;
  const innerR = size * 0.3;
  const ringMid = (outerR + innerR) / 2;
  const angleRad = ((hue - 90) * Math.PI) / 180;
  const handleX = outerR + ringMid * Math.cos(angleRad);
  const handleY = outerR + ringMid * Math.sin(angleRad);

  return (
    <div
      ref={ref}
      onMouseDown={handleMouseDown}
      style={{ width: size, height: size, position: "relative", cursor: "crosshair", flexShrink: 0 }}
    >
      {/* Hue ring */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "conic-gradient(hsl(0,80%,55%), hsl(45,80%,55%), hsl(90,80%,55%), hsl(135,80%,55%), hsl(180,80%,55%), hsl(225,80%,55%), hsl(270,80%,55%), hsl(315,80%,55%), hsl(360,80%,55%))",
        }}
      />
      {/* Inner cutout */}
      <div
        style={{
          position: "absolute",
          inset: innerR,
          borderRadius: "50%",
          background: "white",
        }}
      />
      {/* Handle */}
      <div
        style={{
          position: "absolute",
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: `hsl(${hue}, 80%, 55%)`,
          border: "2px solid white",
          boxShadow: "0 0 0 1.5px rgba(0,0,0,0.25)",
          left: handleX - 7,
          top: handleY - 7,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
