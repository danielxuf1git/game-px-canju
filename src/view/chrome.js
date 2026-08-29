import { PALETTE } from "./palette.js";

export function buildChrome(root) {
  root.innerHTML = "";
  root.className = "px-app";
  root.innerHTML =
    '<header class="px-top">' +
    '<div class="px-brand">残局快递</div>' +
    '<div class="px-tag" data-hate>官方包</div>' +
    "</header>" +
    '<div class="px-stage" data-stage>' +
    '<div class="px-hud"><span data-from>来自 夜班</span><span data-stat>0 / 7</span></div>' +
    '<canvas data-cv></canvas>' +
    "</div>" +
    '<footer class="px-foot">' +
    '<div class="px-slots" data-slots></div>' +
    '<div class="px-tools">' +
    '<span data-tip>点开能看见的牌</span>' +
    '<button type="button" class="px-btn" data-item>抽走最左</button>' +
    '<button type="button" class="px-btn px-mute" data-mute aria-label="静音">静</button>' +
    "</div>" +
    "</footer>" +
    '<div class="px-over" data-over>' +
    '<div class="px-card">' +
    '<div class="px-stamp" data-ostamp>已寄出</div>' +
    "<h1 data-otitle>残局已发出</h1>" +
    "<p data-odesc></p>" +
    '<button type="button" class="px-btn px-go" data-next>拆下一包</button>' +
    "</div></div>" +
    '<div class="px-land" data-land>请竖过来</div>';

  const slots = root.querySelector("[data-slots]");
  const slotEls = [];
  for (let i = 0; i < 7; i++) {
    const d = document.createElement("div");
    d.className = "px-slot";
    slots.appendChild(d);
    slotEls.push(d);
  }

  return {
    stage: root.querySelector("[data-stage]"),
    canvas: root.querySelector("[data-cv]"),
    hate: root.querySelector("[data-hate]"),
    from: root.querySelector("[data-from]"),
    stat: root.querySelector("[data-stat]"),
    tip: root.querySelector("[data-tip]"),
    item: root.querySelector("[data-item]"),
    mute: root.querySelector("[data-mute]"),
    over: root.querySelector("[data-over]"),
    ostamp: root.querySelector("[data-ostamp]"),
    otitle: root.querySelector("[data-otitle]"),
    odesc: root.querySelector("[data-odesc]"),
    next: root.querySelector("[data-next]"),
    land: root.querySelector("[data-land]"),
    slotEls,
    paintSlots(slot, assets, drawTile) {
      slotEls.forEach((el, i) => {
        el.innerHTML = "";
        const t = slot[i];
        if (!t) return;
        const c = document.createElement("canvas");
        c.width = 80;
        c.height = 104;
        c.style.width = "100%";
        c.style.height = "100%";
        drawTile(c.getContext("2d"), 8, 8, 64, 88, t.k, {
          asset: assets.tiles && assets.tiles[t.k],
        });
        el.appendChild(c);
      });
    },
    showOver(win, desc) {
      this.ostamp.textContent = win ? "拆弹" : "已寄出";
      this.ostamp.style.color = win ? PALETTE.WaxGreen : PALETTE.WaxRed;
      this.otitle.textContent = win ? "这包拆开了" : "残局已发出";
      this.odesc.textContent = desc || "";
      this.over.classList.add("show");
    },
    hideOver() {
      this.over.classList.remove("show");
    },
  };
}
