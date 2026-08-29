/** Client networking + offline degrade. No WebSocket. */

import { generateOfficial } from './generate.js';

export const NICK_WORDS = Object.freeze([
  '夜班',
  '封蜡',
  '秤砣',
  '邮差',
  '油灯',
  '铜钮',
  '旧秤',
  '墨匣',
]);

const FETCH_MS = 1500;
const OUTBOX_KEY = 'outbox';

const memStore = Object.create(null);
let memDid = null;
let memNick = null;
let poolCache = null;
let dealSeq = 0;
let testFetch = null;

function hasLocalStorage() {
  try {
    const ls = globalThis.localStorage;
    return !!(ls && typeof ls.getItem === 'function' && typeof ls.setItem === 'function');
  } catch {
    return false;
  }
}

function storage() {
  if (hasLocalStorage()) return globalThis.localStorage;
  return {
    getItem: (k) => (k in memStore ? memStore[k] : null),
    setItem: (k, v) => {
      memStore[k] = String(v);
    },
    removeItem: (k) => {
      delete memStore[k];
    },
  };
}

function storeGet(key) {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function storeSet(key, value) {
  try {
    storage().setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function randomString() {
  const a = Math.random().toString(36).slice(2, 12);
  const b = Math.random().toString(36).slice(2, 12);
  const t = Date.now().toString(36);
  return `${t}${a}${b}`;
}

export function getDeviceId() {
  const saved = storeGet('device_id');
  if (saved) {
    memDid = saved;
    return saved;
  }
  if (memDid) return memDid;
  const id = randomString();
  memDid = id;
  storeSet('device_id', id);
  return id;
}

export function getNickname() {
  const saved = storeGet('nickname');
  if (saved) {
    memNick = saved;
    return saved;
  }
  if (memNick) return memNick;
  const n = NICK_WORDS.length;
  const i = Math.floor(Math.random() * n);
  let j = Math.floor(Math.random() * n);
  if (j === i) j = (j + 1) % n;
  const nick = `${NICK_WORDS[i]}${NICK_WORDS[j]}`;
  memNick = nick;
  storeSet('nickname', nick);
  return nick;
}

export function apiBases() {
  const list = ['', 'http://127.0.0.1:8787'];
  return list.filter((b) => b != null && typeof b === 'string');
}

function currentFetch() {
  if (typeof testFetch === 'function') return testFetch;
  if (typeof fetch === 'function') return fetch;
  throw new Error('no fetch');
}

export function __setFetchForTest(fn) {
  testFetch = typeof fn === 'function' ? fn : null;
}

export function __setPoolForTest(arr) {
  poolCache = Array.isArray(arr) ? arr.slice() : null;
}

export function __resetForTest() {
  testFetch = null;
  poolCache = null;
  dealSeq = 0;
}

export async function fetchJson(url, opts = {}) {
  const ac = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => {
    try {
      ac?.abort();
    } catch {
      /* ignore */
    }
  }, FETCH_MS);
  try {
    const init = { ...opts };
    if (ac) init.signal = ac.signal;
    const res = await currentFetch()(url, init);
    if (!res || res.ok === false) throw new Error(`http ${res && res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const POOL_URLS = [
  '/pools/official-pool.json',
  '/official-pool.json',
  'official-pool.json',
  './official-pool.json',
  'pools/official-pool.json',
  './pools/official-pool.json',
];

export async function loadOfficialPool() {
  if (Array.isArray(poolCache) && poolCache.length) return poolCache;
  for (const url of POOL_URLS) {
    try {
      const data = await fetchJson(url);
      if (Array.isArray(data) && data.length) {
        poolCache = data;
        return poolCache;
      }
    } catch {
      /* try next */
    }
  }
  if (Array.isArray(poolCache)) return poolCache;
  return [];
}

function hashDid(did) {
  let h = 0;
  const s = String(did || 'anon');
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  return h;
}

export function pickFromPool(pool, did, id) {
  const list = Array.isArray(pool) ? pool.filter(Boolean) : [];
  if (!list.length) return null;
  if (id) {
    const found = list.find((p) => p.id === id);
    if (found) return found;
    return list.find((p) => p.solvable) || list[0];
  }
  const idx = (hashDid(did) + dealSeq) % list.length;
  dealSeq += 1;
  return list[idx];
}

function isParcel(p) {
  return !!(p && typeof p === 'object' && Array.isArray(p.tiles));
}

function readOutbox() {
  try {
    const raw = storeGet(OUTBOX_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeOutbox(arr) {
  storeSet(OUTBOX_KEY, JSON.stringify(arr));
}

function pushOutbox(item) {
  const box = readOutbox();
  box.push(item);
  writeOutbox(box);
}

function outboxPath(item) {
  return item && item.type === 'clear' ? '/api/clear' : '/api/parcel';
}

export async function flushOutbox() {
  const box = readOutbox();
  if (!box.length) return { flushed: 0 };
  const bases = apiBases();
  let flushed = 0;
  while (box.length) {
    const item = box[0];
    let sent = false;
    for (const base of bases) {
      try {
        await fetchJson(`${base}${outboxPath(item)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.body || {}),
        });
        sent = true;
        break;
      } catch {
        /* try next base */
      }
    }
    if (!sent) break;
    box.shift();
    writeOutbox(box);
    flushed += 1;
  }
  return { flushed };
}

function searchString(search) {
  if (search != null && search !== '') return String(search);
  try {
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      return window.location.search;
    }
  } catch {
    /* no window */
  }
  try {
    if (typeof location !== 'undefined' && location && location.search) {
      return location.search;
    }
  } catch {
    /* no location */
  }
  return '';
}

export async function dealParcel({ search } = {}) {
  try {
    await flushOutbox();
  } catch {
    /* outbox stay */
  }
  const did = getDeviceId();
  const params = new URLSearchParams(searchString(search));
  const shareId = params.get('p') || '';

  const bases = apiBases();
  for (const base of bases) {
    try {
      const url = shareId
        ? `${base}/api/parcel/${encodeURIComponent(shareId)}`
        : `${base}/api/parcel?did=${encodeURIComponent(did)}`;
      const parcel = await fetchJson(url);
      if (isParcel(parcel)) return { parcel, source: 'api' };
    } catch {
      /* next base */
    }
  }

  try {
    const pool = await loadOfficialPool();
    if (pool && pool.length) {
      const parcel = pickFromPool(pool, did, shareId || undefined);
      if (isParcel(parcel)) return { parcel, source: 'pool' };
      if (parcel) return { parcel, source: 'pool' };
    }
  } catch {
    /* gen */
  }

  const parcel = generateOfficial(18);
  parcel.solvable = true;
  parcel.from = getNickname();
  return { parcel, source: 'gen' };
}

async function postFirstOk(path, body) {
  const bases = apiBases();
  let lastErr = null;
  for (const base of bases) {
    try {
      const data = await fetchJson(`${base}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('unreachable');
}

export async function shipLeftover(leftoverParcel) {
  const body = {
    did: getDeviceId(),
    from: getNickname(),
    leftover: leftoverParcel,
  };
  try {
    const data = await postFirstOk('/api/parcel', body);
    try {
      await flushOutbox();
    } catch {
      /* keep queued leftovers */
    }
    return { ok: true, id: data && data.id, queued: false };
  } catch {
    pushOutbox({ type: 'parcel', body, ts: Date.now() });
    return { ok: true, id: leftoverParcel && leftoverParcel.id, queued: true };
  }
}

export async function ackClear(parcelId) {
  const body = { did: getDeviceId(), id: parcelId };
  try {
    await postFirstOk('/api/clear', body);
    try {
      await flushOutbox();
    } catch {
      /* keep queued clears */
    }
    return { ok: true, queued: false };
  } catch {
    pushOutbox({ type: 'clear', body, ts: Date.now() });
    return { ok: true, queued: true };
  }
}
