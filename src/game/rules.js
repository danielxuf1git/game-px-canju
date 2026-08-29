/** Click / slot / match-3 rules. Pure: clone input, never mutate. */

import { canClick } from './occlusion.js';
import { explode, isCleared } from './state.js';

/** Insert tile after the last same-k already in the slot; else append. */
export function insertIntoSlot(slot, tile) {
  let last = -1;
  for (let i = 0; i < slot.length; i++) {
    if (slot[i].k === tile.k) last = i;
  }
  const copy = { id: tile.id, k: tile.k, x: tile.x, y: tile.y, z: tile.z };
  if (last === -1) slot.push(copy);
  else slot.splice(last + 1, 0, copy);
}

/** When any k reaches 3, remove those 3 and compact (keep relative order). */
export function matchSlot(slot) {
  const counts = new Map();
  for (const t of slot) counts.set(t.k, (counts.get(t.k) || 0) + 1);
  let hitK = null;
  for (const [k, n] of counts) {
    if (n >= 3) {
      hitK = k;
      break;
    }
  }
  if (hitK == null) return { matched: null, removed: [] };
  const removed = [];
  const next = [];
  let left = 3;
  for (const t of slot) {
    if (t.k === hitK && left > 0) {
      removed.push(t);
      left -= 1;
    } else {
      next.push(t);
    }
  }
  slot.length = 0;
  for (const t of next) slot.push(t);
  return { matched: hitK, removed };
}

function emptyResult(state, extra = {}) {
  return {
    state,
    ok: false,
    blocked: false,
    matched: null,
    exploded: false,
    cleared: false,
    events: [],
    ...extra,
  };
}

/**
 * applyClick(state, tileId)
 *  - missing / gone: ok false
 *  - blocked: ok false, blocked true (may set lastFeedback)
 *  - slot already 7: exploded, rejected = that tile
 *  - else enter slot; match-3 if any k hits 3
 *  - board+slot empty: cleared
 */
export function applyClick(state, tileId) {
  const next = structuredClone(state);
  if (!next || next.status !== 'playing') {
    return emptyResult(next);
  }

  const tile = (next.tiles || []).find((t) => t.id === tileId);
  if (!tile || tile.gone) {
    return emptyResult(next);
  }

  const alive = next.tiles.filter((t) => !t.gone);
  if (!canClick(tile, alive)) {
    next.lastFeedback = 'blocked';
    return emptyResult(next, {
      blocked: true,
      events: [{ type: 'blocked', tileId }],
    });
  }

  if (next.slot.length >= 7) {
    tile.gone = true;
    next.rejected = {
      id: tile.id,
      k: tile.k,
      x: tile.x,
      y: tile.y,
      z: tile.z,
    };
    const exploded = explode(next);
    exploded.rejected = next.rejected;
    exploded.lastFeedback = 'exploded';
    return {
      state: exploded,
      ok: false,
      blocked: false,
      matched: null,
      exploded: true,
      cleared: false,
      events: [{ type: 'exploded', tileId, rejected: next.rejected }],
    };
  }

  tile.gone = true;
  insertIntoSlot(next.slot, tile);
  const events = [{ type: 'enter', tileId, k: tile.k }];

  const { matched, removed } = matchSlot(next.slot);
  let matchedOut = null;
  if (matched != null) {
    matchedOut = removed;
    events.push({ type: 'match', k: matched, tiles: removed });
  }

  let cleared = false;
  if (isCleared(next)) {
    next.status = 'cleared';
    next.lastFeedback = 'cleared';
    cleared = true;
    events.push({ type: 'cleared' });
  } else {
    next.lastFeedback = matched != null ? 'match' : 'enter';
  }

  return {
    state: next,
    ok: true,
    blocked: false,
    matched: matchedOut,
    exploded: false,
    cleared,
    events,
  };
}
