/**
 * Lightweight confetti / celebration effects on a SHARED canvas.
 *
 * Calling launchConfetti() / launchStars() multiple times in quick
 * succession used to spawn a new <canvas> for every burst. Three
 * back-to-back bursts (e.g. the quiz finish: cheer + 3x stars) would
 * stack three full-screen canvases and three independent rAF loops,
 * which on lower-end laptops manifested as a 1-2 second freeze and
 * a flash of overlapping confetti as the celebration overlay tried
 * to mount.
 *
 * The fix is straightforward: keep one global canvas and one rAF
 * loop alive while particles exist, push new particles into the
 * existing pool when a new burst is requested, and tear the canvas
 * down once the pool is empty. Two-canvas trick (one for the burst,
 * one for the rAF state) avoids the polish-flash of removing+
 * re-creating the DOM node.
 */

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F1948A', '#82E0AA',
  '#F8C471', '#AED6F1', '#D2B4DE', '#A3E4D7'
];

// ──────────────────────────────────────────────────────────
// Shared canvas state — one for the whole page, ever.
// ──────────────────────────────────────────────────────────
let stage = null; // { canvas, ctx, particles, animId, raining, rainUntil }

function ensureStage() {
  if (stage && stage.canvas.isConnected) return stage;

  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:99999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  stage = {
    canvas,
    ctx,
    particles: [],
    animId: null,
    raining: false,
    rainUntil: 0,
  };

  // Resize handler — only attached once (when the stage first
  // appears). Removed on tearDown so we don't leak.
  stage.onResize = () => {
    if (!stage) return;
    stage.canvas.width = window.innerWidth;
    stage.canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', stage.onResize);

  return stage;
}

function tearStageDown() {
  if (!stage) return;
  if (stage.animId) cancelAnimationFrame(stage.animId);
  if (stage.onResize) window.removeEventListener('resize', stage.onResize);
  if (stage.canvas.parentNode) stage.canvas.remove();
  stage = null;
}

function pump() {
  if (!stage) return;
  const { ctx, canvas } = stage;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // While we're "raining" (during a confetti burst's spawn window)
  // keep adding fresh particles from the top of the screen.
  if (stage.raining) {
    if (Date.now() >= stage.rainUntil) {
      stage.raining = false;
    } else if (Math.random() > 0.25) {
      for (let i = 0; i < 12; i++) {
        stage.particles.push(makeConfettiParticle(canvas));
      }
    }
  }

  // Update + draw every particle.
  stage.particles = stage.particles.filter((p) => {
    const alive = p.update(canvas);
    if (alive) p.draw(ctx);
    return alive;
  });

  if (stage.particles.length > 0 || stage.raining) {
    stage.animId = requestAnimationFrame(pump);
  } else {
    tearStageDown();
  }
}

// ──────────────────────────────────────────────────────────
// Particle factories
// ──────────────────────────────────────────────────────────

function makeConfettiParticle(canvas) {
  const x = Math.random() * canvas.width;
  const y = -10 - Math.random() * 100;
  const size = Math.random() * 12 + 6;
  const speedY = Math.random() * 3 + 2;
  const speedX = (Math.random() - 0.5) * 4;
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const rotation = Math.random() * 360;
  const rotationSpeed = (Math.random() - 0.5) * 10;
  const shape = Math.random() > 0.5 ? 'rect' : 'circle';
  let wobble = Math.random() * 10;
  const wobbleSpeed = Math.random() * 0.1 + 0.05;
  let opacity = 1;
  let cx = x, cy = y, sX = speedX, sY = speedY, rot = rotation;

  return {
    update(c) {
      cy += sY;
      cx += sX + Math.sin(wobble) * 0.5;
      wobble += wobbleSpeed;
      rot += rotationSpeed;
      sY += 0.05; // gravity
      opacity -= 0.003;
      return cy < c.height + 20 && opacity > 0;
    },
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(cx, cy);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.fillStyle = color;
      if (shape === 'rect') {
        ctx.fillRect(-size / 2, -size / 4, size, size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
  };
}

function makeStarParticle(originX, originY, angle, speed) {
  let x = originX, y = originY;
  let vx = Math.cos(angle) * speed;
  let vy = Math.sin(angle) * speed;
  let size = 10 + Math.random() * 15;
  let opacity = 1;
  let rotation = Math.random() * 360;

  return {
    update() {
      x += vx;
      y += vy;
      vy += 0.15;
      opacity -= 0.02;
      rotation += 5;
      size *= 0.98;
      return opacity > 0;
    },
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, opacity);
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.font = `${size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', 0, 0);
      ctx.restore();
    },
  };
}

// ──────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────

/**
 * Trigger a confetti burst that rains for `duration` ms and lets
 * gravity carry the particles off-screen afterwards. Safe to call
 * multiple times — overlapping bursts merge onto the shared canvas
 * instead of stacking new ones.
 */
export function launchConfetti(duration = 4000) {
  const s = ensureStage();
  // Extend (not reset) the rain window so overlapping bursts stay
  // active until the LAST burst's window closes.
  s.rainUntil = Math.max(s.rainUntil, Date.now() + Math.round(duration * 0.7));
  s.raining = true;

  // Seed with a couple of batches so the first frame already looks
  // populated (otherwise rain takes ~200ms to feel "alive").
  for (let i = 0; i < 36; i++) {
    s.particles.push(makeConfettiParticle(s.canvas));
  }
  if (!s.animId) {
    s.animId = requestAnimationFrame(pump);
  }
}

/**
 * Burst of stars from a point (px from top-left of the viewport).
 * Used for "correct answer" sparkles. Also reuses the shared canvas.
 */
export function launchStars(x, y, count = 12) {
  const s = ensureStage();
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 3 + Math.random() * 4;
    s.particles.push(makeStarParticle(x, y, angle, speed));
  }
  if (!s.animId) {
    s.animId = requestAnimationFrame(pump);
  }
}

export default { launchConfetti, launchStars };
