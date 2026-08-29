/** Leftover Parcel serialization. Fields match API.md only. */

import { canClick, remainingTiles } from './occlusion.js';

function newParcelId() {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 10);
  return `p_01J${t}${r}`;
}

/** hate 0–100 from leftover count + dead corners (blocked tiles). */
export function computeHate(tiles) {
  const rest = remainingTiles(tiles);
  const count = rest.length;
  let dead = 0;
  for (const t of rest) {
    if (!canClick(t, rest)) dead += 1;
  }
  return Math.max(0, Math.min(100, Math.round(count * 3 + dead * 5)));
}

function publicTile(t) {
  return { id: t.id, k: t.k, x: t.x, y: t.y, z: t.z };
}

/**
 * leftover = remaining board tiles + slot tiles + rejected 8th.
 * solvable false. Keep w/h from the deal. Compute hate.
 */
export function serializeLeftover(state) {
  const seen = new Set();
  const tiles = [];
  const push = (t) => {
    if (!t || seen.has(t.id)) return;
    seen.add(t.id);
    tiles.push(publicTile(t));
  };

  for (const t of state.tiles || []) {
    if (!t.gone) push(t);
  }
  for (const t of state.slot || []) push(t);
  if (state.rejected) push(state.rejected);

  const src = state.parcel || {};
  return {
    id: newParcelId(),
    from: src.from || '夜班秤砬',
    solvable: false,
    hate: computeHate(tiles),
    w: src.w,
    h: src.h,
    tiles,
  };
}
