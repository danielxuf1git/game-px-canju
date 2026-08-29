import { drawTile } from "./emblems.js";

function easeOutCubic(t) {
  const u = t < 0 ? 0 : t > 1 ? 1 : t;
  return 1 - Math.pow(1 - u, 3);
}

export function createFlyer(host) {
  const layer = document.createElement("div");
  layer.className = "px-fly-layer";
  host.appendChild(layer);

  function origin() {
    return host.getBoundingClientRect();
  }

  return {
    layer,
    play(k, from, to, assets) {
      const el = document.createElement("canvas");
      el.className = "px-fly";
      el.width = 80;
      el.height = 104;
      drawTile(el.getContext("2d"), 0, 0, 80, 104, k, {
        asset: assets && assets.tiles && assets.tiles[k],
      });
      layer.appendChild(el);
      const t0 = performance.now();
      const dur = 140;
      const put = (x, y, w, h) => {
        el.style.transform = "translate(" + x + "px," + y + "px)";
        el.style.width = w + "px";
        el.style.height = h + "px";
      };
      put(from.x, from.y, from.w, from.h);
      const step = (now) => {
        const raw = Math.min(1, (now - t0) / dur);
        const u = easeOutCubic(raw);
        const x = from.x + (to.x - from.x) * u;
        const y = from.y + (to.y - from.y) * u - Math.sin(raw * Math.PI) * 48;
        const w = from.w + (to.w - from.w) * u;
        const h = from.h + (to.h - from.h) * u;
        put(x, y, w, h);
        if (raw < 1) requestAnimationFrame(step);
        else if (el.parentNode) el.parentNode.removeChild(el);
      };
      requestAnimationFrame(step);
    },
    localRect(el) {
      const a = origin();
      const r = el.getBoundingClientRect();
      return { x: r.left - a.left, y: r.top - a.top, w: r.width, h: r.height };
    },
    localPoint(clientX, clientY, w, h) {
      const a = origin();
      return { x: clientX - a.left, y: clientY - a.top, w: w, h: h };
    },
    destroy() {
      if (layer.parentNode) layer.parentNode.removeChild(layer);
    },
  };
}
