import { EVENTS, FALLBACK_EVENT } from '../data/events';
import { JOBS } from '../data/jobs';
import { LOCATIONS } from '../data/locations';
import { ENDINGS } from '../data/endings';
import { META } from '../data/meta';
import { NPCS } from '../data/npcs';
import { BALANCE } from '../data/balance';
import type { SlotId, Stats } from '../data/schema';
import { SLOTS } from './engine';
import type { ContentRef, GameState, Phase } from './types';

export const SAVE_PREFIX = 'HZ1';
export const SAVE_STORAGE_KEY = 'huozhejiuxing-save-v1';

const PHASES: Phase[] = ['event', 'action', 'jobs', 'meals', 'ending'];

export function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function encodeB64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeB64Url(b64: string): string {
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const normalized = b64.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) out[key] = stable(source[key]);
    return out;
  }
  return value;
}

export function encodeSave(state: GameState): string {
  const body = encodeB64Url(JSON.stringify(stable(state)));
  const sum = fnv1a(`${SAVE_PREFIX}.${body}`);
  return `${SAVE_PREFIX}.${body}.${sum}`;
}

export function decodeSave(code: string): { ok: true; state: GameState } | { ok: false; error: string } {
  try {
    const trimmed = code.trim();
    if (!trimmed) return fail('存档码是空的。');
    if (trimmed.length > 100_000) return fail('存档码太长了，看下是不是多复制了。');
    const parts = trimmed.split('.');
    if (parts.length !== 3 || parts[0] !== SAVE_PREFIX) return fail('存档码格式不对，请检查是否复制完整。');
    const [prefix, body, sum] = parts as [string, string, string];
    if (!/^[0-9a-f]{8}$/.test(sum) || fnv1a(`${prefix}.${body}`) !== sum) {
      return fail('存档码校验失败，可能复制漏了。');
    }
    const parsed: unknown = JSON.parse(decodeB64Url(body));
    const state = normalizeState(parsed);
    if (!state) return fail('存档码内容无效，没法读取。');
    return { ok: true, state };
  } catch {
    return fail('存档码读不了，请检查后再试。');
  }
}

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isUint32(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 0xffffffff;
}

function isSlot(value: unknown): value is SlotId {
  return typeof value === 'string' && (SLOTS as string[]).includes(value);
}

function normalizeStats(value: unknown): Stats | null {
  if (!isRecord(value)) return null;
  const stats = { money: 0, hunger: 0, mood: 0, stamina: 0 };
  for (const key of ['money', 'hunger', 'mood', 'stamina'] as const) {
    const raw = value[key];
    if (typeof raw !== 'number' || !Number.isInteger(raw)) return null;
    if (key === 'money') {
      if (raw < 0 || raw > 100_000_000) return null;
    } else if (raw < 0 || raw > BALANCE.statMax) return null;
    stats[key] = raw;
  }
  return stats;
}

function normalizeState(value: unknown): GameState | null {
  if (!isRecord(value)) return null;
  if (value.version !== 1) return null;
  if (!isUint32(value.seed) || !isUint32(value.rng)) return null;
  if (typeof value.day !== 'number' || !Number.isInteger(value.day) || value.day < 1 || value.day > META.maxDays) {
    return null;
  }
  if (!isSlot(value.slot) || !isSlot(value.planSlot)) return null;
  if (typeof value.phase !== 'string' || !PHASES.includes(value.phase as Phase)) return null;
  const stats = normalizeStats(value.stats);
  if (!stats) return null;
  if (typeof value.debt !== 'number' || !Number.isInteger(value.debt) || value.debt < 0 || value.debt > 100_000_000) {
    return null;
  }
  if (typeof value.contentResolvedToday !== 'boolean') return null;
  if (typeof value.banner !== 'string' || value.banner.length > 800) return null;
  if (value.endingId !== null && (typeof value.endingId !== 'string' || !ENDINGS.some((e) => e.id === value.endingId))) {
    return null;
  }
  if (typeof value.locationId !== 'string' || !LOCATIONS.some((item) => item.id === value.locationId)) return null;

  const proficiency: Record<string, number> = {};
  if (!isRecord(value.proficiency)) return null;
  for (const job of JOBS) {
    const raw = value.proficiency[job.id] ?? 0;
    if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0 || raw > 999) return null;
    proficiency[job.id] = raw;
  }

  const npc: GameState['npc'] = {};
  if (!isRecord(value.npc)) return null;
  for (const person of NPCS) {
    const raw = value.npc[person.id];
    const progress = raw === undefined ? { beat: 0, affinity: 0 } : raw;
    if (!isRecord(progress)) return null;
    const { beat, affinity } = progress;
    if (typeof beat !== 'number' || !Number.isInteger(beat) || beat < 0 || beat > person.beats.length) return null;
    if (typeof affinity !== 'number' || !Number.isInteger(affinity) || affinity < -50 || affinity > 99) return null;
    npc[person.id] = { beat, affinity };
  }

  if (!Array.isArray(value.flags) || value.flags.length > 80) return null;
  const flags: string[] = [];
  for (const flag of value.flags) {
    if (typeof flag !== 'string' || flag.length === 0 || flag.length > 40 || !/^[\w-]+$/.test(flag)) return null;
    if (!flags.includes(flag)) flags.push(flag);
  }

  if (!isRecord(value.eventCounts)) return null;
  const eventCounts: Record<string, number> = {};
  for (const event of EVENTS) {
    const raw = value.eventCounts[event.id];
    if (raw === undefined) continue;
    if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0 || raw > 99) return null;
    eventCounts[event.id] = raw;
  }

  const pending = normalizePending(value.pending);
  if (pending === undefined) return null;

  if (!Array.isArray(value.contentLog) || value.contentLog.length > 60) return null;
  const contentLog: GameState['contentLog'] = [];
  for (const entry of value.contentLog) {
    if (!isRecord(entry)) return null;
    if (typeof entry.day !== 'number' || !Number.isInteger(entry.day) || entry.day < 1 || entry.day > META.maxDays) {
      return null;
    }
    if (typeof entry.id !== 'string' || entry.id.length === 0 || entry.id.length > 80) return null;
    contentLog.push({ day: entry.day, id: entry.id });
  }

  if (!isRecord(value.lastDeltas)) return null;
  const lastDeltas: Partial<Stats> = {};
  for (const key of ['money', 'hunger', 'mood', 'stamina'] as const) {
    const raw = value.lastDeltas[key];
    if (raw === undefined) continue;
    if (typeof raw !== 'number' || !Number.isInteger(raw) || Math.abs(raw) > 100_000) return null;
    lastDeltas[key] = raw;
  }

  if (!Array.isArray(value.log) || value.log.length > 12) return null;
  const log: string[] = [];
  for (const line of value.log) {
    if (typeof line !== 'string' || line.length > 800) return null;
    log.push(line);
  }

  return {
    version: 1,
    seed: value.seed,
    rng: value.rng,
    day: value.day,
    slot: value.slot,
    phase: value.phase as Phase,
    stats,
    debt: value.debt,
    proficiency,
    npc,
    flags,
    eventCounts,
    contentResolvedToday: value.contentResolvedToday,
    planSlot: value.planSlot,
    pending,
    contentLog,
    locationId: value.locationId,
    endingId: value.endingId as string | null,
    banner: value.banner,
    lastDeltas,
    log,
  };
}

function normalizePending(value: unknown): ContentRef | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  if (value.kind !== 'event' && value.kind !== 'npc' && value.kind !== 'fallback') return undefined;
  if (typeof value.id !== 'string') return undefined;
  if (value.kind === 'fallback') return value.id === FALLBACK_EVENT.id ? { kind: 'fallback', id: value.id } : undefined;
  if (value.kind === 'event') {
    return EVENTS.some((event) => event.id === value.id) ? { kind: 'event', id: value.id } : undefined;
  }
  if (typeof value.npcId !== 'string') return undefined;
  const npc = NPCS.find((person) => person.id === value.npcId);
  if (!npc || !npc.beats.some((beat) => beat.id === value.id)) return undefined;
  return { kind: 'npc', id: value.id, npcId: value.npcId };
}

export function readLocal(
  storage: Pick<Storage, 'getItem'>,
): { ok: true; state: GameState | null } | { ok: false; error: string } {
  try {
    const raw = storage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return { ok: true, state: null };
    return decodeSave(raw);
  } catch {
    return fail('本地存档读不了。');
  }
}

export function writeLocal(
  storage: Pick<Storage, 'setItem' | 'removeItem'>,
  state: GameState | null,
): boolean {
  try {
    if (!state) storage.removeItem(SAVE_STORAGE_KEY);
    else storage.setItem(SAVE_STORAGE_KEY, encodeSave(state));
    return true;
  } catch {
    return false;
  }
}
