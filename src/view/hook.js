import {
  createGame,
  applyClick,
  useItem,
  canClick,
  serializeLeftover,
  isCleared,
  dealParcel,
  shipLeftover,
  ackClear,
} from "../game/index.js";
import { mountView } from "./mount.js";
import { KINDS } from "./palette.js";

async function takeDeal() {
  const { parcel } = await dealParcel({ search: location.search });
  return createGame(parcel);
}

export function bootTable(root) {
  let game = null;
  let view = null;
  let ready = false;

  function mapState() {
    if (!game) {
      return {
        tiles: [],
        slot: [],
        itemAvailable: false,
        from: "夜班",
        hate: "官方包",
        over: false,
        win: false,
        leftoverLabel: "",
        muted: true,
      };
    }
    const alive = (game.tiles || []).filter((t) => !t.gone);
    const tiles = (game.tiles || []).map((t) => {
      t.dim = !t.gone && !canClick(t, alive);
      return t;
    });
    const over = game.status === "cleared" || game.status === "exploded";
    const win = game.status === "cleared";
    const left = over && !win ? serializeLeftover(game) : null;
    const solvable = game.parcel && game.parcel.solvable !== false;
    return {
      tiles,
      slot: game.slot || [],
      itemAvailable: !game.itemUsed && (game.slot || []).length > 0,
      from: (game.parcel && game.parcel.from) || "夜班",
      hate: over && !win ? "不解包" : solvable ? "官方包" : "不解包",
      over,
      win,
      leftoverLabel: left
        ? left.tiles.length + " 张 · 来自 " + (left.from || "你")
        : win
          ? "拆自 " + ((game.parcel && game.parcel.from) || "夜班")
          : "",
      muted: true,
    };
  }

  view = mountView(root, {
    assetBase: "/public/assets/",
    getState: mapState,
    onTilePointer({ id, blocked }) {
      if (!ready || !game) return;
      if (blocked) {
        const t = game.tiles.find((x) => x.id === id);
        if (t) view.playBlocked(t);
        return;
      }
      const tile = game.tiles.find((x) => x.id === id);
      const fromX = tile && tile.px != null ? tile.px : 40;
      const fromY = tile && tile.py != null ? tile.py : 40;
      const r = applyClick(game, id);
      if (r.blocked) {
        if (tile) view.playBlocked(tile);
        game = r.state;
        return;
      }
      if (r.exploded) {
        game = r.state;
        view.playBurst();
        view.audio.burst();
        Promise.resolve(shipLeftover(serializeLeftover(game))).catch(() => {});
        return;
      }
      if (!r.ok) return;
      game = r.state;
      if (tile && view) {
        const idx = Math.max(
          0,
          game.slot.findIndex((s) => s.id === tile.id)
        );
        if (view.playFlyToSlot) view.playFlyToSlot(tile.k, tile, idx);
        else {
          const dest = view.slotPoint(idx);
          view.playFly(tile.k, fromX, fromY, dest.x, dest.y, tile.id);
        }
        view.audio.slot();
      }
      if (r.matched && r.matched.length) {
        view.playMatch(195, 520, KINDS[tile ? tile.k : 0].fill, performance.now());
        view.audio.match();
      }
      if (isCleared(game) || game.status === "cleared") {
        game = { ...game, status: "cleared" };
        view.playClear();
        const pid = game.parcel && game.parcel.id;
        if (pid) Promise.resolve(ackClear(pid)).catch(() => {});
      }
    },
    onItem() {
      if (!ready || !game) return;
      const r = useItem(game);
      if (!r.ok) return;
      game = r.state;
      if (isCleared(game) || game.status === "cleared") {
        game = { ...game, status: "cleared" };
        view.playClear();
        const pid = game.parcel && game.parcel.id;
        if (pid) Promise.resolve(ackClear(pid)).catch(() => {});
      }
    },
    onNext() {
      takeDeal()
        .then((g) => {
          game = g;
          ready = true;
        })
        .catch(() => {});
    },
  });

  takeDeal()
    .then((g) => {
      game = g;
      ready = true;
    })
    .catch(() => {});

  return view;
}
