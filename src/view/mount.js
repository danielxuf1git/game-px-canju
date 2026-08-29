import { LAYOUT, KINDS, NAMES, PALETTE } from "./palette.js";
import { drawTile } from "./emblems.js";
import { createFeel } from "./feel.js";
import { createAudio } from "./audio.js";
import { createRenderer } from "./renderer.js";
import { buildChrome } from "./chrome.js";
import { createFlyer } from "./flyer.js";

function loadImg(src) {
  const im = new Image();
  im.src = src;
  return im;
}

function assetBase() {
  return new URL("../../public/assets/", import.meta.url).href;
}

export function mountView(root, hooks) {
  hooks = hooks || {};
  const ui = buildChrome(root);
  const feel = createFeel();
  const audio = createAudio();
  const base = (hooks.assetBase || assetBase());
  const assets = {
    bg: loadImg(base + "bg_paper.png"),
    slot: loadImg(base + "slot_frame.png"),
    tiles: [1, 2, 3, 4, 5, 6].map((n) => loadImg(base + "tiles/tile_" + n + ".png")),
  };
  const renderer = createRenderer(ui.canvas, assets, feel);
  const flyer = createFlyer(root);

  let last = 0;
  let demo = !hooks.getState;
  let demoState = demo ? makeDemo() : null;

  function state() {
    return hooks.getState ? hooks.getState() : demoState;
  }

  function resize() {
    renderer.resize(ui.stage);
    layout(state());
  }

  function layout(s) {
    const { W, H } = renderer.size();
    const live = (s.tiles || []).filter((t) => !t.gone);
    let minX = 0, minY = 0, maxX = 5, maxY = 4;
    if (live.length) {
      minX = Infinity; minY = Infinity; maxX = -Infinity; maxY = -Infinity;
      for (const t of live) {
        minX = Math.min(minX, t.x);
        minY = Math.min(minY, t.y);
        maxX = Math.max(maxX, t.x + 1);
        maxY = Math.max(maxY, t.y + 1);
      }
    }
    const pad = 16;
    const availW = Math.max(80, W - pad * 2);
    const availH = Math.max(80, H - pad * 2);
    const spanX = Math.max(1, maxX - minX);
    const spanY = Math.max(1, maxY - minY);
    let tw = availW / spanX;
    let th = tw * 1.28;
    if (th * spanY > availH) {
      th = availH / spanY;
      tw = th / 1.28;
    }
    tw = Math.min(LAYOUT.tileW, tw);
    th = tw * 1.28;
    const ox = pad + (availW - tw * spanX) / 2;
    const oy = pad + (availH - th * spanY) / 2;
    s._tw = tw;
    s._th = th;
    for (const t of s.tiles || []) {
      t.px = ox + (t.x - minX) * tw;
      t.py = oy + (t.y - minY) * th;
      t.tw = tw;
      t.th = th;
    }
  }

  function slotClient(i) {
    const n = Math.max(0, Math.min(6, i | 0));
    const el = ui.slotEls[n];
    if (el) return flyer.localRect(el);
    const { W, H } = renderer.size();
    return { x: 16 + n * ((W - 32) / 7), y: H + 72, w: 44, h: 56 };
  }

  function tileClient(tile) {
    const cr = ui.canvas.getBoundingClientRect();
    const tw = tile.tw || LAYOUT.tileW;
    const th = tile.th || LAYOUT.tileH;
    return flyer.localPoint(cr.left + (tile.px || 0), cr.top + (tile.py || 0), tw, th);
  }

  function playFlyToSlot(k, tile, slotIndex) {
    const from = tileClient(tile);
    const to = slotClient(slotIndex);
    feel.playFly(k, from.x, from.y, to.x, to.y, tile && tile.id);
    flyer.play(k, from, to, assets);
  }

  function slotPoint(i) {
    const n = Math.max(0, Math.min(6, i | 0));
    const el = ui.slotEls[n];
    const cr = ui.canvas.getBoundingClientRect();
    const tw = (state()._tw || LAYOUT.tileW) * 0.85;
    const th = (state()._th || LAYOUT.tileH) * 0.85;
    if (!el || !cr.width) {
      const { W, H } = renderer.size();
      return { x: 16 + n * ((W - 32) / 7), y: H + 8 };
    }
    const sr = el.getBoundingClientRect();
    return {
      x: sr.left - cr.left + sr.width / 2 - tw / 2,
      y: sr.top - cr.top + sr.height / 2 - th / 2,
    };
  }

  function syncHud(s) {
    ui.from.textContent = "来自 " + (s.from || NAMES[0]);
    ui.hate.textContent = s.hate || "官方包";
    ui.stat.textContent = (s.slot ? s.slot.length : 0) + " / 7";
    ui.item.disabled = !s.itemAvailable;
    ui.mute.textContent = (s.muted != null ? s.muted : audio.muted()) ? "静" : "声";
    const flyingIds = new Set(feel.flying.map((f) => f.id).filter(Boolean));
    ui.paintSlots((s.slot || []).map((t) => (t && flyingIds.has(t.id) ? null : t)), assets, drawTile);
    if (s.over) {
      ui.showOver(!!s.win, s.leftoverLabel || "");
    } else ui.hideOver();
    ui.land.classList.toggle("show", window.innerWidth > window.innerHeight && window.innerWidth > 520);
  }

  function hitTile(x, y, s) {
    const live = (s.tiles || []).filter((t) => !t.gone);
    const hits = live
      .filter((t) => {
        const tw = t.tw || LAYOUT.tileW;
        const th = t.th || LAYOUT.tileH;
        return x >= t.px && x <= t.px + tw && y >= t.py && y <= t.py + th;
      })
      .sort((a, b) => b.z - a.z);
    return hits[0] || null;
  }

  ui.canvas.addEventListener("pointerdown", (e) => {
    audio.unlock();
    const r = ui.canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const s = state();
    if (s.over) return;
    const tile = hitTile(x, y, s);
    if (!tile) return;
    feel.playPress(tile.id);
    if (tile.dim || tile.blocked) {
      feel.playBlocked(tile);
      if (hooks.onTilePointer) hooks.onTilePointer({ id: tile.id, blocked: true });
      return;
    }
    audio.tap();
    if (hooks.onTilePointer) hooks.onTilePointer({ id: tile.id, blocked: false });
    if (demo) {
      const tx = 24 + (s.slot.length % 7) * 52;
      const ty = renderer.size().H + 40;
      playFlyToSlot(tile.k, tile, Math.max(0, s.slot.length - 1));
      audio.slot();
      tile.gone = true;
      s.slot.push({ k: tile.k });
      const n = s.slot.filter((t) => t.k === tile.k).length;
      if (n >= 3) {
        let rm = 0;
        s.slot = s.slot.filter((t) => (t.k === tile.k && rm < 3 ? (rm++, false) : true));
        feel.playMatch(renderer.size().W / 2, renderer.size().H - 12, KINDS[tile.k].fill, performance.now());
        audio.match();
      }
      if (s.slot.length >= 7) {
        feel.playBurst();
        audio.burst();
        s.over = true;
        s.win = false;
        s.leftoverLabel = "预览爆槽";
      }
    }
  }, { passive: true });

  ui.item.addEventListener("click", () => {
    audio.unlock();
    if (hooks.onItem) hooks.onItem();
    if (demo && demoState.itemAvailable && demoState.slot.length) {
      demoState.slot.shift();
      demoState.itemAvailable = false;
    }
  });
  ui.next.addEventListener("click", () => {
    if (hooks.onNext) hooks.onNext();
    if (demo) demoState = makeDemo();
  });
  ui.mute.addEventListener("click", () => {
    const m = audio.toggle();
    if (hooks.onMute) hooks.onMute(m);
  });

  function tick(now) {
    const dt = last ? Math.min(32, now - last) : 16;
    last = now;
    feel.markFps(now);
    feel.tick(dt);
    const s = state();
    layout(s);
    renderer.paint(s);
    syncHud(s);
    raf = requestAnimationFrame(tick);
  }

  let raf = 0;
  const ro = new ResizeObserver(resize);
  ro.observe(ui.stage);
  resize();
  raf = requestAnimationFrame(tick);

  return {
    tick: () => {},
    resize,
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      flyer.destroy();
    },
    slotPoint,
    slotClient,
    playFlyToSlot,
    playFly: feel.playFly,
    playMatch: feel.playMatch,
    playBurst: feel.playBurst,
    playClear: feel.playClear,
    playBlocked: feel.playBlocked,
    playPress: feel.playPress,
    audio,
  };
}

function makeDemo() {
  const tiles = [];
  for (let i = 0; i < 18; i++) {
    tiles.push({
      id: "d" + i,
      k: i % 6,
      x: i % 5,
      y: Math.floor(i / 5) % 4,
      z: Math.floor(i / 15),
      gone: false,
      dim: false,
      scale: 1,
      shake: 0,
    });
  }
  tiles.forEach((t, i) => {
    t.dim = t.z === 0 && tiles.some((o) => o.z > t.z && o.x === t.x && o.y === t.y);
  });
  return {
    tiles,
    slot: [],
    itemAvailable: true,
    from: NAMES[0],
    hate: "预览包",
    over: false,
    win: false,
    leftoverLabel: "",
    muted: true,
  };
}

export { PALETTE, KINDS, LAYOUT };
