"use client";

import React, { useEffect, useRef } from "react";

interface InterstellarCanvasProps {
  active: boolean;
}

export function InterstellarCanvas({ active }: InterstellarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Starfield particles
    const starCount = 200;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width - width / 2,
      y: Math.random() * height - height / 2,
      z: Math.random() * width,
      size: Math.random() * 1.5 + 0.5,
    }));

    let angle = 0;

    const render = () => {
      ctx.fillStyle = "rgba(4, 5, 10, 0.25)";
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height * 0.4;

      // 1. Gargantua Black Hole Accretion Disk (Cosmic orange-gold glowing ring)
      angle += 0.006;
      ctx.save();
      ctx.translate(cx, cy);

      // Outer Gravitational Lensing Glow
      const grad = ctx.createRadialGradient(0, 0, 40, 0, 0, 240);
      grad.addColorStop(0, "rgba(0, 0, 0, 1)");
      grad.addColorStop(0.3, "rgba(245, 158, 11, 0.4)");
      grad.addColorStop(0.55, "rgba(217, 119, 6, 0.2)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 260, 0, Math.PI * 2);
      ctx.fill();

      // Accretion Ring (Tilted Oval)
      ctx.rotate(angle * 0.4);
      ctx.beginPath();
      ctx.ellipse(0, 0, 200, 45, angle, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(251, 191, 36, 0.75)";
      ctx.lineWidth = 6;
      ctx.shadowColor = "#F59E0B";
      ctx.shadowBlur = 24;
      ctx.stroke();

      // Shadow of the Event Horizon (Pure Black Sphere)
      ctx.beginPath();
      ctx.arc(0, 0, 52, 0, Math.PI * 2);
      ctx.fillStyle = "#000000";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(251, 191, 36, 0.8)";
      ctx.fill();

      ctx.restore();

      // 2. Warp Starfield
      ctx.fillStyle = "#FFFFFF";
      for (const s of stars) {
        s.z -= 1.5;
        if (s.z <= 0) {
          s.z = width;
          s.x = Math.random() * width - width / 2;
          s.y = Math.random() * height - height / 2;
        }

        const k = 280 / s.z;
        const px = s.x * k + width / 2;
        const py = s.y * k + height / 2;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          const size = Math.max(0.6, (1 - s.z / width) * 2.5);
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000 opacity-80"
    />
  );
}
