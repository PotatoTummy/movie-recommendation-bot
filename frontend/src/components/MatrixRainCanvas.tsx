"use client";

import React, { useEffect, useRef } from "react";

interface MatrixRainCanvasProps {
  active: boolean;
}

export function MatrixRainCanvas({ active }: MatrixRainCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Matrix characters: Katakana + Latin + Digits + Math operators
    const chars =
      "アカサタナハマヤラワガザダバパイキシチニヒミリヰギジヂビピウクスツヌフムユルグズヅブプエケセテネヘメレヱゲゼデベペオコソトノホモヨロヲゴゾドボポ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ+-*/=%\"'#&_()";
    const charArray = chars.split("");

    const fontSize = 16;
    const columns = Math.floor(width / fontSize);
    const drops: number[] = new Array(columns).fill(1);

    const draw = () => {
      // Translucent black fade creates the iconic digital trail
      ctx.fillStyle = "rgba(13, 2, 8, 0.08)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Leading char is bright glowing white/cyan, trail is vivid matrix green
        if (Math.random() > 0.88) {
          ctx.fillStyle = "#E8FFF0";
          ctx.shadowColor = "#00FF41";
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = "#00FF41";
          ctx.shadowBlur = 0;
        }

        ctx.fillText(text, x, y);

        // Reset drop randomly after reaching bottom
        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700 opacity-90"
      style={{ background: "#0D0208" }}
    />
  );
}
