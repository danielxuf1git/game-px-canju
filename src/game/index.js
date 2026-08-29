/** 残局快递 · 核心循环出口 */

export { canClick, overlapArea, coversCenter, isBlockedBy } from './occlusion.js';
export { applyClick, insertIntoSlot, matchSlot } from './rules.js';
export {
  createGame,
  explode,
  useItem,
  isCleared,
  FEEL,
  PRESS_TO_MOVE_MAX,
  FLY_MS,
  MATCH_TO_POP_MAX,
  POP_MS,
  SLOT_COMPACT_MS,
  HIT,
} from './state.js';
export { serializeLeftover, computeHate } from './leftover.js';
export { solve } from './solver.js';
export { generateOfficial } from './generate.js';

export {
  dealParcel,
  shipLeftover,
  ackClear,
  flushOutbox,
  getDeviceId,
  getNickname,
} from './net.js';
