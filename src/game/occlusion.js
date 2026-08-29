/** Occlusion: a tile is blocked if any remaining higher-z tile
 *  covers its center, or covers ≥45% of its unit area.
 *  Tile rect: [x, x+1] × [y, y+1]. Center (x+0.5, y+0.5). Area = 1.
 */

export const AREA_BLOCK = 0.45;

export function tileRect(t) {
  return { x0: t.x, y0: t.y, x1: t.x + 1, y1: t.y + 1 };
}

export function overlapArea(a, b) {
  const ox = Math.max(0, Math.min(a.x + 1, b.x + 1) - Math.max(a.x, b.x));
  const oy = Math.max(0, Math.min(a.y + 1, b.y + 1) - Math.max(a.y, b.y));
  return ox * oy;
}

export function coversCenter(upper, lower) {
  const cx = lower.x + 0.5;
  const cy = lower.y + 0.5;
  return (
    cx >= upper.x &&
    cx < upper.x + 1 &&
    cy >= upper.y &&
    cy < upper.y + 1
  );
}

export function isBlockedBy(lower, upper) {
  if (upper.z <= lower.z) return false;
  if (coversCenter(upper, lower)) return true;
  return overlapArea(lower, upper) + 1e-9 >= AREA_BLOCK;
}

export function remainingTiles(tiles) {
  return tiles.filter((t) => t && !t.gone);
}

/** canClick(tile, tiles) — tile is clickable iff not gone and not blocked. */
export function canClick(tile, tiles) {
  if (!tile || tile.gone) return false;
  const rest = remainingTiles(tiles);
  for (const other of rest) {
    if (other.id === tile.id) continue;
    if (isBlockedBy(tile, other)) return false;
  }
  return true;
}

export function deadCorners(tiles) {
  const rest = remainingTiles(tiles);
  return rest.filter((t) => !canClick(t, rest));
}
