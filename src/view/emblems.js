import { PALETTE, KINDS, LAYOUT } from "./palette.js";

export function drawEmblem(g, k, cx, cy, s, ink) {
  g.strokeStyle = ink;
  g.fillStyle = ink;
  g.lineWidth = Math.max(1.5, s * 0.034);
  g.lineCap = "round";
  g.lineJoin = "round";
  g.beginPath();
  if (k === 0) {
    g.arc(cx, cy, s * 0.28, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = PALETTE.Ink;
    g.stroke();
  } else if (k === 1) {
    g.moveTo(cx, cy - s * 0.3);
    g.lineTo(cx + s * 0.28, cy + s * 0.24);
    g.lineTo(cx - s * 0.28, cy + s * 0.24);
    g.closePath();
    g.stroke();
  } else if (k === 2) {
    g.moveTo(cx - s * 0.24, cy - s * 0.1);
    g.lineTo(cx + s * 0.24, cy - s * 0.1);
    g.moveTo(cx - s * 0.24, cy + s * 0.1);
    g.lineTo(cx + s * 0.24, cy + s * 0.1);
    g.stroke();
  } else if (k === 3) {
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
      const fn = i ? g.lineTo.bind(g) : g.moveTo.bind(g);
      fn(cx + Math.cos(a) * s * 0.3, cy + Math.sin(a) * s * 0.3);
    }
    g.closePath();
    g.stroke();
  } else if (k === 4) {
    const rw = s * 0.56, rh = s * 0.22;
    roundPath(g, cx - rw / 2, cy - rh / 2, rw, rh, 4);
    g.fill();
    g.strokeStyle = PALETTE.Ink;
    g.stroke();
  } else {
    g.arc(cx, cy, s * 0.28, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.arc(cx, cy, s * 0.13, 0, Math.PI * 2);
    g.stroke();
  }
}

function roundPath(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export function drawTile(g, x, y, w, h, k, opt) {
  const o = opt || {};
  const kind = KINDS[k] || KINDS[0];
  const dim = !!o.dim;
  const scale = o.scale == null ? 1 : o.scale;
  const img = o.asset;
  g.save();
  const cx = x + w / 2, cy = y + h / 2;
  g.translate(cx, cy);
  g.scale(scale, scale);
  g.translate(-cx, -cy);
  g.globalAlpha = dim ? 0.38 : 1;
  if (img && img.complete && img.naturalWidth) {
    g.drawImage(img, x, y, w, h);
  } else {
    g.fillStyle = PALETTE.Kraft;
    roundPath(g, x, y, w, h, LAYOUT.tileR);
    g.fill();
    g.strokeStyle = PALETTE.Ink;
    g.globalAlpha = dim ? 0.38 : 0.72;
    g.lineWidth = 1.5;
    g.stroke();
    g.globalAlpha = dim ? 0.38 : 1;
    g.fillStyle = kind.fill;
    roundPath(g, x + 7, y + 8, w - 14, h - 22, 5);
    g.fill();
    drawEmblem(g, k, x + w / 2, y + h / 2 - 4, w, kind.ink);
    g.fillStyle = "#1A141055";
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.arc(x + 8 + i * ((w - 16) / 5), y + h - 7, 2, 0, Math.PI * 2);
      g.fill();
    }
  }
  if (dim) {
    g.globalAlpha = 0.45;
    g.fillStyle = PALETTE.Soot;
    roundPath(g, x, y, w, h, LAYOUT.tileR);
    g.fill();
  }
  g.restore();
}

export { roundPath };
