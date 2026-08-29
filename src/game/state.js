/** Game state factory, explode, item, cleared, FEEL constants. */

export const PRESS_TO_MOVE_MAX = 32;
export const FLY_MS = [120, 160];
export const MATCH_TO_POP_MAX = 50;
export const POP_MS = [180, 220];
export const SLOT_COMPACT_MS = 100;
export const HIT = 44;

export const FEEL = {
  PRESS_TO_MOVE_MAX,
  FLY_MS,
  MATCH_TO_POP_MAX,
  POP_MS,
  SLOT_COMPACT_MS,
  HIT,
};

function copyTile(t) {
  return {
    id: t.id,
    k: t.k,
    x: t.x,
    y: t.y,
    z: t.z,
    gone: !!t.gone,
  };
}

export function createGame(parcel) {
  const tiles = (parcel.tiles || []).map((t) => ({
    id: t.id,
    k: t.k,
    x: t.x,
    y: t.y,
    z: t.z,
    gone: false,
  }));
  return {
    parcel: structuredClone(parcel),
    tiles,
    slot: [],
    itemUsed: false,
    status: 'playing',
    rejected: null,
    lastFeedback: null,
  };
}

export function isCleared(state) {
  if (!state) return false;
  const boardLeft = (state.tiles || []).some((t) => !t.gone);
  return !boardLeft && (state.slot || []).length === 0;
}

export function explode(state) {
  const next = structuredClone(state);
  next.status = 'exploded';
  next.lastFeedback = 'exploded';
  return next;
}

/** useItem: destroy leftmost slot tile. Once per game. Pure. */
export function useItem(state) {
  const next = structuredClone(state);
  if (
    !next ||
    next.status !== 'playing' ||
    next.itemUsed ||
    !next.slot ||
    next.slot.length === 0
  ) {
    return { state: next, ok: false, removed: null };
  }
  const removed = next.slot.shift();
  next.itemUsed = true;
  next.lastFeedback = 'item';
  if (isCleared(next)) {
    next.status = 'cleared';
  }
  return { state: next, ok: true, removed };
}

export { copyTile };
