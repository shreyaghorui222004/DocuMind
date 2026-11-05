import { useEffect, useRef } from "react";
import { useApp } from "../context/AppContext.jsx";

// Soft glowing orbs (CSS) + a lightweight canvas of drifting particles joined by faint "neural" lines.
export default function AnimatedBackground() {
  const ref = useRef(null);
  const { prefs } = useApp();
  const on = prefs.animation;

  useEffect(() => {
    const cv = ref.current; if (!cv || !on) return;
    const ctx = cv.getContext("2d");
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w, h, raf, pts = [];
    const resize = () => {
      w = cv.width = innerWidth; h = cv.height = innerHeight;
      const n = Math.min(70, Math.floor((w * h) / 22000));
      pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35, c: Math.random() < 0.25 ? "32,217,210" : "168,130,255" }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        if (!still) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1; }
        ctx.fillStyle = `rgba(${p.c},.8)`; ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, 6.3); ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d < 130) { ctx.strokeStyle = `rgba(140,120,255,${0.16 * (1 - d / 130)})`; ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke(); }
      }
      if (!still) raf = requestAnimationFrame(draw);
    };
    resize(); draw(); addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }, [on]);

  return (
    <div className="bg" aria-hidden="true">
      {on && <><i /><i /><i /></>}
      <canvas ref={ref} className="net" />
      <div className="veil" />
      
    </div>
  );
}
