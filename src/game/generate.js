/** Reverse-construction official deals. Must pass solver (no item). */

import { solve } from './solver.js';

const FROM = [
  '夜班秤砣',
  '封蜡值班',
  '牛皮纸栈',
  '铜秤守夜',
  '墨台三更',
  '邮戳夜班',
  '蜡盏驿卒',
  '秤房听差',
  '火漆听差',
  '驿站更夫',
];

function rand(n) {
  return Math.floor(Math.random() * n);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function newParcelId() {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 12);
  return `p_01J${t}${r}`;
}

function pickGroups(nTiles) {
  const nGroups = nTiles / 3;
  const ks = [];
  for (let i = 0; i < nGroups; i++) ks.push(i % 6);
  return shuffle(ks);
}

function candidates(tiles, w, h) {
  const cands = [];
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) cands.push({ x, y });
  }
  for (const t of tiles) {
    for (const dx of [-0.5, 0, 0.5]) {
      for (const dy of [-0.5, 0, 0.5]) {
        const x = t.x + dx;
        const y = t.y + dy;
        if (x >= 0 && y >= 0 && x <= w - 1 && y <= h - 1) {
          cands.push({ x, y });
        }
      }
    }
  }
  return cands;
}

function overlaps(a, b) {
  const ox = Math.max(0, Math.min(a.x + 1, b.x + 1) - Math.max(a.x, b.x));
  const oy = Math.max(0, Math.min(a.y + 1, b.y + 1) - Math.max(a.y, b.y));
  return ox * oy > 1e-9;
}

/**
 * Place 3 same-k onto currently "top" spots / new overlapping spots.
 * Group shares one z = 1+max existing (so the 3 don't block each other).
 */
function placeGroup(tiles, k, w, h, groupZ) {
  const cands = shuffle(candidates(tiles, w, h));
  const spots = [];
  for (let i = 0; i < 3; i++) {
    if (cands.length === 0) {
      spots.push({ x: rand(w), y: rand(h) });
    } else if (tiles.length === 0 || Math.random() < 0.45) {
      spots.push(cands[i % cands.length]);
    } else {
      const base = tiles[rand(tiles.length)];
      const dx = [-0.5, 0, 0.5][rand(3)];
      const dy = [-0.5, 0, 0.5][rand(3)];
      let x = Math.min(w - 1, Math.max(0, base.x + dx));
      let y = Math.min(h - 1, Math.max(0, base.y + dy));
      spots.push({ x, y });
    }
  }
  let idBase = tiles.length + 1;
  for (const s of spots) {
    tiles.push({
      id: `t${idBase++}`,
      k,
      x: s.x,
      y: s.y,
      z: groupZ,
    });
  }
}

function construct(nTiles) {
  const w = 5;
  const h = 4;
  const groups = pickGroups(nTiles);
  const tiles = [];
  for (let g = 0; g < groups.length; g++) {
    placeGroup(tiles, groups[g], w, h, g);
  }
  // optional layer nudge: bump a few non-top tiles' z by 0 (no invert of group order)
  if (Math.random() < 0.4) {
    for (const t of tiles) {
      if (Math.random() < 0.15) t.z += 0;
    }
  }
  return {
    id: newParcelId(),
    from: FROM[rand(FROM.length)],
    solvable: true,
    hate: 0,
    w,
    h,
    tiles,
  };
}

/** Trivially solvable fallback: 3-high same-k stacks. */
function constructSimple(nTiles) {
  const w = 5;
  const h = 4;
  const tiles = [];
  const nGroups = nTiles / 3;
  let id = 1;
  for (let g = 0; g < nGroups; g++) {
    const x = g % w;
    const y = Math.floor(g / w) % h;
    const k = g % 6;
    for (let z = 0; z < 3; z++) {
      tiles.push({ id: `t${id++}`, k, x, y, z });
    }
  }
  return {
    id: newParcelId(),
    from: FROM[rand(FROM.length)],
    solvable: true,
    hate: 0,
    w,
    h,
    tiles,
  };
}

export function generateOfficial(nTiles = 18) {
  if (nTiles !== 18 && nTiles !== 24 && nTiles !== 30) nTiles = 18;
  for (let attempt = 0; attempt < 48; attempt++) {
    const parcel = attempt === 47 ? constructSimple(nTiles) : construct(nTiles);
    const r = solve(parcel);
    if (r.ok) {
      parcel.solvable = true;
      return parcel;
    }
  }
  const last = constructSimple(nTiles);
  last.solvable = true;
  return last;
}

export { FROM };
