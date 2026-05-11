import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

export default function NeuralParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Respect reduced-motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId: number;
    const particles: Particle[] = [];
    const isMobile = window.innerWidth < 640;
    const isTablet = window.innerWidth < 1024;
    const COUNT = isMobile ? 14 : isTablet ? 28 : 48;
    const COLOR = "0,245,212";
    const LINK_DIST = isMobile ? 80 : isTablet ? 110 : 130;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const spawn = () => {
      for (let i = 0; i < COUNT; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 1.2 + 0.4,
          opacity: Math.random() * 0.18 + 0.06,
        });
      }
    };

    // throttle to ~30fps on mobile for better performance
    let lastTime = 0;
    const fpsCap = isMobile ? 33 : 16;

    const draw = (ts: number) => {
      animId = requestAnimationFrame(draw);
      if (ts - lastTime < fpsCap) return;
      lastTime = ts;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${COLOR},${p.opacity})`;
        ctx.fill();
      }

      // Skip line drawing on mobile for performance
      if (!isMobile) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < LINK_DIST) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = `rgba(${COLOR},${0.1 * (1 - dist / LINK_DIST)})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }
      }
    };

    resize();
    spawn();
    animId = requestAnimationFrame(draw);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full z-0 pointer-events-none"
    />
  );
}
