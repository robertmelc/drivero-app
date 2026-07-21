"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  onChange: (dataUrl: string | null) => void;
};

export function SignaturePad({ label, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasStroke, setHasStroke] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#AFFFD4";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";

    function pos(e: MouseEvent | TouchEvent) {
      const r = canvas!.getBoundingClientRect();
      const p = "touches" in e ? e.touches[0] : e;
      return { x: p.clientX - r.left, y: p.clientY - r.top };
    }
    function start(e: MouseEvent | TouchEvent) {
      drawingRef.current = true;
      const p = pos(e);
      ctx!.beginPath();
      ctx!.moveTo(p.x, p.y);
      e.preventDefault();
    }
    function move(e: MouseEvent | TouchEvent) {
      if (!drawingRef.current) return;
      const p = pos(e);
      ctx!.lineTo(p.x, p.y);
      ctx!.stroke();
      setHasStroke(true);
      e.preventDefault();
    }
    function end() {
      if (drawingRef.current) {
        drawingRef.current = false;
        onChange(canvas!.toDataURL("image/png"));
      }
    }

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", end);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
    onChange(null);
  }

  return (
    <div className="border border-white/10 rounded-lg p-3.5 bg-white/[0.03]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold">{label}</span>
        <button type="button" onClick={clear} className="text-[11px] text-muted underline">
          vymazat
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-[130px] bg-white/5 border border-white/10 rounded-md cursor-crosshair touch-none"
      />
      <div className={`text-[11px] font-semibold mt-1.5 ${hasStroke ? "text-signal" : "text-amber"}`}>
        {hasStroke ? "Podepsáno" : "Čeká na podpis"}
      </div>
    </div>
  );
}
