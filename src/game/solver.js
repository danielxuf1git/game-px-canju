/** DFS solver: slot cap 7, NO item. Used to verify official packs. */

import { canClick } from './occlusion.js';
import { insertIntoSlot, matchSlot } from './rules.js';

function aliveList(tiles, mask) {
  const out = [];
  for (let i = 0; i < tiles.length; i++) {
    if (mask & (1 << i)) out.push(tiles[i]);
  }
  return out;
}

function clickableIndices(tiles, mask) {
  const alive = aliveList(tiles, mask);
  const idx = [];
  for (let i = 0; i < tiles.length; i++) {
    if (!(mask & (1 << i))) continue;
    if (canClick(tiles[i], alive)) idx.push(i);
  }
  return idx;
}

function slotKey(slot) {
  let s = '';
  for (const t of slot) s += t.k;
  return s;
}

function countK(slot, k) {
  let n = 0;
  for (const t of slot) if (t.k === k) n += 1;
  return n;
}

/**
 * solve(parcel) → { ok, moves }
 * moves = tile ids in click order. No item. Slot cap 7.
 */
export function solve(parcel, opts = {}) {
  const tiles = (parcel.tiles || []).map((t) => ({
    id: t.id,
    k: t.k,
    x: t.x,
    y: t.y,
    z: t.z,
    gone: false,
  }));
  const n = tiles.length;
  if (n === 0) return { ok: true, moves: [] };
  if (n > 31) return { ok: false, moves: [] };

  const startMask = n === 31 ? 0x7fffffff : (1 << n) - 1;
  const visited = new Set();
  const nodeLimit = opts.nodeLimit || 250000;
  let nodes = 0;

  const path = [];

  function dfs(mask, slot) {
    if (mask === 0 && slot.length === 0) return true;
    if (slot.length >= 7) return false;
    nodes += 1;
    if (nodes > nodeLimit) return false;

    const key = mask + ':' + slotKey(slot);
    if (visited.has(key)) return false;
    visited.add(key);

    const cand = clickableIndices(tiles, mask);
    if (cand.length === 0) return mask === 0 && slot.length === 0;

    cand.sort((a, b) => {
      const ca = countK(slot, tiles[a].k);
      const cb = countK(slot, tiles[b].k);
      if (ca !== cb) return cb - ca;
      if (tiles[b].z !== tiles[a].z) return tiles[b].z - tiles[a].z;
      return a - b;
    });

    for (const i of cand) {
      const nextSlot = slot.map((t) => ({ ...t }));
      insertIntoSlot(nextSlot, tiles[i]);
      matchSlot(nextSlot);
      const nextMask = mask ^ (1 << i);
      path.push(tiles[i].id);
      if (dfs(nextMask, nextSlot)) return true;
      path.pop();
    }
    return false;
  }

  const ok = dfs(startMask, []);
  return { ok, moves: ok ? path.slice() : [] };
}
