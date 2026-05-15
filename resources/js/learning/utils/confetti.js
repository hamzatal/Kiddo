/**
 * Lightweight confetti/celebration effect using pure canvas.
 * No external dependencies needed.
 */

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F1948A', '#82E0AA',
  '#F8C471', '#AED6F1', '#D2B4DE', '#A3E4D7'
];

class Particle {
  constructor(canvas) {
    this.canvas = canvas;
    this.x = Math.random() * canvas.width;
    this.y = -10 - Math.random() * 100;
    this.size = Math.random() * 12 + 6;
    this.speedY = Math.random() * 3 + 2;
    this.speedX = (Math.random() - 0.5) * 4;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 10;
    this.opacity = 1;
    this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
    this.wobble = Math.random() * 10;
    this.wobbleSpeed = Math.random() * 0.1 + 0.05;
  }

  update() {
    this.y += this.speedY;
    this.x += this.speedX + Math.sin(this.wobble) * 0.5;
    this.wobble += this.wobbleSpeed;
    this.rotation += this.rotationSpeed;
    this.speedY += 0.05; // gravity
    this.opacity -= 0.003;
    return this.y < this.canvas.height + 20 && this.opacity > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.fillStyle = this.color;

    if (this.shape === 'rect') {
      ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

export function launchConfetti(duration = 4000) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:99999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let particles = [];
  const startTime = Date.now();
  let animId;

  const spawnBatch = () => {
    for (let i = 0; i < 15; i++) {
      particles.push(new Particle(canvas));
    }
  };

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const elapsed = Date.now() - startTime;
    if (elapsed < duration * 0.7) {
      if (Math.random() > 0.3) spawnBatch();
    }

    particles = particles.filter(p => {
      const alive = p.update();
      if (alive) p.draw(ctx);
      return alive;
    });

    if (elapsed < duration || particles.length > 0) {
      animId = requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  };

  spawnBatch();
  spawnBatch();
  spawnBatch();
  animate();

  // Safety cleanup
  setTimeout(() => {
    if (canvas.parentNode) {
      cancelAnimationFrame(animId);
      canvas.remove();
    }
  }, duration + 2000);
}

export function launchStars(x, y, count = 12) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:99999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const stars = [];

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    stars.push({
      x, y,
      vx: Math.cos(angle) * (3 + Math.random() * 4),
      vy: Math.sin(angle) * (3 + Math.random() * 4),
      size: 10 + Math.random() * 15,
      opacity: 1,
      rotation: Math.random() * 360,
    });
  }

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    stars.forEach(s => {
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.15;
      s.opacity -= 0.02;
      s.rotation += 5;
      s.size *= 0.98;

      if (s.opacity > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = s.opacity;
        ctx.translate(s.x, s.y);
        ctx.rotate((s.rotation * Math.PI) / 180);
        ctx.font = `${s.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', 0, 0);
        ctx.restore();
      }
    });

    if (alive) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  };

  animate();
}

export default { launchConfetti, launchStars };
