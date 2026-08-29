import { PALETTE, KINDS, LAYOUT } from "./palette.js";
import { drawTile, roundPath } from "./emblems.js";

export function createRenderer(canvas, assets, feel) {
  const ctx = canvas.getContext("2d");
  let W = LAYOUT.W;
  let H = 500;
  let dpr = 1;

  function resize(stage) {
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    W = stage.clientWidth;
    H = stage.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function paint(state) {
    ctx.clearRect(0, 0, W, H);
    const bg = assets.bg;
    if (bg && bg.complete && bg.naturalWidth) {
      ctx.globalAlpha = 0.88;
      ctx.drawImage(bg, 0, 0, W, H);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = PALETTE.Soot;
      ctx.fillRect(16, 24, W - 32, H - 36);
    }
    ctx.strokeStyle = "#C4A57433";
    ctx.strokeRect(16.5, 24.5, W - 33, H - 37);

    const live = (state.tiles || []).filter((t) => !t.gone).sort((a, b) => a.z - b.z || a.y - b.y);
    const TW = state._tw || LAYOUT.tileW;
    const TH = state._th || LAYOUT.tileH;
    for (const t of live) {
      const dim = !!t.dim;
      const jx = t.shake ? Math.sin(performance.now() / 20) * t.shake : 0;
      const sc = feel.pressScale(t.id);
      const a = t.flashA ? 0.55 + 0.45 * (1 - t.flashA) : 1;
      const tw = t.tw || TW;
      const th = t.th || TH;
      ctx.save();
      ctx.globalAlpha = a;
      drawTile(ctx, t.px + jx, t.py, tw, th, t.k, {
        dim,
        scale: sc,
        asset: assets.tiles && assets.tiles[t.k],
      });
      ctx.restore();
      if (t.shake) t.shake *= 0.7;
      if (t.flashA) t.flashA *= 0.7;
    }

    if (feel.particlesOn()) {
      for (const p of feel.parts) {
        if (p.life <= 0) continue;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
      }
      ctx.globalAlpha = 1;
    }

    for (const fl of feel.flashes) {
      const u = 1 - fl.t / fl.dur;
      ctx.globalAlpha = 0.35 * u;
      ctx.fillStyle = fl.kind === "gold" ? PALETTE.Gold : PALETTE.WaxRed;
      ctx.fillRect(8, 16, W - 16, H - 24);
      ctx.globalAlpha = 1;
    }

    for (const st of feel.stamps) {
      const u = Math.min(1, st.t / 180);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-0.14);
      ctx.scale(0.7 + 0.3 * u, 0.7 + 0.3 * u);
      ctx.globalAlpha = 0.85 * (1 - st.t / st.dur);
      ctx.strokeStyle = PALETTE.WaxGreen;
      ctx.lineWidth = 4;
      roundPath(ctx, -70, -36, 140, 72, 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  return { resize, paint, size: () => ({ W, H }) };
}
