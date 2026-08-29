const MAX_PARTS = 40;

function easeOutCubic(t) {
  const u = t < 0 ? 0 : t > 1 ? 1 : t;
  return 1 - Math.pow(1 - u, 3);
}

export function createFeel() {
  const flying = [];
  const parts = [];
  const flashes = [];
  const stamps = [];
  const press = new Map();
  let lastMatch = -1e9;
  let fps = 60;
  let frames = 0;
  let fpsAt = 0;
  let particlesOn = true;

  function allocPart() {
    for (let i = 0; i < parts.length; i++) if (parts[i].life <= 0) return parts[i];
    if (parts.length >= MAX_PARTS) return parts[0];
    const p = { x: 0, y: 0, vx: 0, vy: 0, life: 0, color: "#D4A017" };
    parts.push(p);
    return p;
  }

  function burst(x, y, color) {
    if (!particlesOn) return;
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12;
      const p = allocPart();
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * 2.2;
      p.vy = Math.sin(a) * 2.2;
      p.life = 1;
      p.color = color;
    }
  }

  return {
    flying,
    parts,
    flashes,
    stamps,
    fps: () => fps,
    particlesOn: () => particlesOn,
    markFps(now) {
      frames++;
      if (!fpsAt) fpsAt = now;
      if (now - fpsAt >= 500) {
        fps = (frames * 1000) / (now - fpsAt);
        frames = 0;
        fpsAt = now;
        particlesOn = fps >= 50;
      }
    },
    playPress(id) {
      press.set(id, { t: 0, dir: 1 });
    },
    pressScale(id) {
      const p = press.get(id);
      if (!p) return 1;
      return p.dir > 0 ? 0.96 : 0.96 + 0.04 * easeOutCubic(Math.min(1, p.t / 80));
    },
    playBlocked(tile) {
      tile.shake = 8;
      tile.flashA = 1;
    },
    playFly(k, x, y, tx, ty, id) {
      flying.push({ k, x, y, tx, ty, id, t: 0, dur: 140 });
    },
    playMatch(x, y, color, now) {
      burst(x, y, color);
      if (now - lastMatch < 1000) {
        flashes.push({ kind: "gold", t: 0, dur: 220 });
      }
      lastMatch = now;
    },
    playBurst() {
      flashes.push({ kind: "red", t: 0, dur: 280 });
    },
    playClear() {
      stamps.push({ t: 0, dur: 700 });
    },
    tick(dt) {
      for (const [id, p] of press) {
        p.t += dt;
        if (p.dir > 0 && p.t >= 16) {
          p.dir = -1;
          p.t = 0;
        }
        if (p.dir < 0 && p.t >= 80) press.delete(id);
      }
      for (let i = flying.length - 1; i >= 0; i--) {
        flying[i].t += dt;
        if (flying[i].t >= flying[i].dur + 20) flying.splice(i, 1);
      }
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (p.life <= 0) continue;
        p.x += p.vx * (dt / 16);
        p.y += p.vy * (dt / 16);
        p.vy += 0.08 * (dt / 16);
        p.life -= 0.03 * (dt / 16);
      }
      for (let i = flashes.length - 1; i >= 0; i--) {
        flashes[i].t += dt;
        if (flashes[i].t >= flashes[i].dur) flashes.splice(i, 1);
      }
      for (let i = stamps.length - 1; i >= 0; i--) {
        stamps[i].t += dt;
        if (stamps[i].t >= stamps[i].dur) stamps.splice(i, 1);
      }
    },
    flyPos(f) {
      const u = easeOutCubic(Math.min(1, f.t / f.dur));
      return {
        x: f.x + (f.tx - f.x) * u,
        y: f.y + (f.ty - f.y) * u - Math.sin(Math.min(1, f.t / f.dur) * Math.PI) * 40,
      };
    },
  };
}
