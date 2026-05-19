import { useEffect, useRef } from "react";

/**
 * Renders an animated starfield canvas in the background.
 * Reacts subtly to mouse movement (parallax drift).
 */
export default function StarfieldCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    let mouseX = 0;
    let mouseY = 0;

    const STAR_COUNT = 220;
    const stars = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function initStars() {
      stars.length = 0;
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.4 + 0.2,
          opacity: Math.random() * 0.7 + 0.15,
          speed: Math.random() * 0.3 + 0.05,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinkleOffset: Math.random() * Math.PI * 2,
          parallaxFactor: Math.random() * 0.04 + 0.005,
          hue: Math.random() > 0.88 ? Math.floor(Math.random() * 60) + 180 : 0, // some blue/cyan stars
        });
      }
    }

    let frame = 0;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame += 0.016;

      // Parallax offsets from mouse
      const offsetX = (mouseX / canvas.width - 0.5) * 30;
      const offsetY = (mouseY / canvas.height - 0.5) * 20;

      stars.forEach((s) => {
        const twinkle = Math.sin(frame * s.twinkleSpeed * 60 + s.twinkleOffset);
        const alpha = s.opacity + twinkle * 0.25;
        const px = s.x + offsetX * s.parallaxFactor * 20;
        const py = s.y + offsetY * s.parallaxFactor * 20;

        ctx.save();
        ctx.globalAlpha = Math.max(0.05, Math.min(1, alpha));
        if (s.hue > 0) {
          ctx.fillStyle = `hsl(${s.hue}, 80%, 75%)`;
          // Small flare cross for colored stars
          ctx.fillRect(px - s.radius * 3, py, s.radius * 6, 0.5);
          ctx.fillRect(px, py - s.radius * 3, 0.5, s.radius * 6);
        } else {
          ctx.fillStyle = "#cde8ff";
        }
        ctx.beginPath();
        ctx.arc(px, py, s.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Slow upward drift
        s.y -= s.speed * 0.15;
        if (s.y < -2) {
          s.y = canvas.height + 2;
          s.x = Math.random() * canvas.width;
        }
      });

      animId = requestAnimationFrame(draw);
    }

    function onMouseMove(e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }

    resize();
    initStars();
    draw();

    window.addEventListener("resize", () => { resize(); initStars(); });
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="starfield-canvas" aria-hidden="true" />;
}
