import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  rotation: number;
  vr: number;
  size: number;
}

const COLORS = ['#e8b84b', '#4bc5e8', '#2ecc71', '#e84b8a', '#9b59b6'];

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: 50 + (Math.random() - 0.5) * 30,
    y: 50,
    vx: (Math.random() - 0.5) * 8,
    vy: -Math.random() * 12 - 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * 360,
    vr: (Math.random() - 0.5) * 20,
    size: 6 + Math.random() * 6,
  }));
}

interface ConfettiProps {
  active: boolean;
}

export default function Confetti({ active }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    particles.current = createParticles(40);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current = particles.current.filter(p => p.y < 110);

      for (const p of particles.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4; // gravity
        p.rotation += p.vr;

        ctx.save();
        ctx.translate((p.x / 100) * canvas.width, (p.y / 100) * canvas.height);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }

      if (particles.current.length > 0) {
        animRef.current = requestAnimationFrame(draw);
      }
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  if (!active) return null;

  return (
    <motion.canvas
      ref={canvasRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      width={300}
      height={200}
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        height: '50%',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    />
  );
}
