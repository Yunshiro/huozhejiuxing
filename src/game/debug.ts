import { jobById } from '../data/jobs';
import { META } from '../data/meta';
import { npcById } from '../data/npcs';
import { ENDING } from '../data/endings';
import type { SlotId, Stats } from '../data/schema';
import { beatAvailability } from './content';
import { createGame, enterSlot, SLOTS } from './engine';
import { clampStatInput, deathEnding, STAT_KEYS } from './stats';
import type { GameState } from './types';

export function isDebugMode(search: string): boolean {
  const query = search.startsWith('?') ? search.slice(1) : search;
  return new URLSearchParams(query).get('debug') === '1';
}

export type DebugCommand =
  | { type: 'jump-day'; day: number; slot?: SlotId; skipContent?: boolean }
  | { type: 'set-stats'; stats: Partial<Stats> }
  | { type: 'set-npc'; npcId: string; affinity?: number; beat?: number }
  | { type: 'add-flag'; flag: string }
  | { type: 'queue-npc'; npcId: string }
  | { type: 'new-seed'; seed: number }
  | { type: 'set-proficiency'; jobId: string; value: number };

export function applyDebug(
  state: GameState,
  command: DebugCommand,
  search: string,
): { ok: true; state: GameState } | { ok: false; state: GameState; error: string } {
  if (!isDebugMode(search)) return { ok: false, state, error: '测试模式未开启' };
  switch (command.type) {
    case 'jump-day':
      return jumpDay(state, command.day, command.slot ?? 'morning', Boolean(command.skipContent));
    case 'set-stats':
      return setStats(state, command.stats);
    case 'set-npc':
      return setNpc(state, command);
    case 'add-flag':
      return addFlag(state, command.flag);
    case 'queue-npc':
      return queueNpc(state, command.npcId);
    case 'new-seed':
      return { ok: true, state: createGame(command.seed >>> 0) };
    case 'set-proficiency':
      return setProficiency(state, command.jobId, command.value);
    default:
      return { ok: false, state, error: '不认识的调试指令' };
  }
}

function jumpDay(
  state: GameState,
  day: number,
  slot: SlotId,
  skipContent: boolean,
): { ok: true; state: GameState } | { ok: false; state: GameState; error: string } {
  const nextDay = Math.floor(day);
  if (!Number.isInteger(nextDay) || nextDay < 1 || nextDay > META.maxDays) {
    return { ok: false, state, error: '天数要在 1 到 30 之间' };
  }
  if (!SLOTS.includes(slot)) return { ok: false, state, error: '时段不对' };
  const next: GameState = {
    ...state,
    day: nextDay,
    slot,
    endingId: null,
    pending: null,
    contentResolvedToday: skipContent,
    phase: 'action',
    planSlot: slot,
  };
  if (skipContent) return { ok: true, state: next };
  return { ok: true, state: enterSlot(next) };
}

function setStats(
  state: GameState,
  patch: Partial<Stats>,
): { ok: true; state: GameState } | { ok: false; state: GameState; error: string } {
  const stats = { ...state.stats };
  for (const key of STAT_KEYS) {
    if (patch[key] === undefined) continue;
    stats[key] = clampStatInput(key, patch[key]!);
  }
  let next: GameState = { ...state, stats };
  if (!state.endingId) {
    const death = deathEnding(stats);
    if (death) next = { ...next, endingId: ENDING[death], phase: 'ending', pending: null };
  }
  return { ok: true, state: next };
}

function setNpc(
  state: GameState,
  command: { npcId: string; affinity?: number; beat?: number },
): { ok: true; state: GameState } | { ok: false; state: GameState; error: string } {
  const npc = npcById(command.npcId);
  const current = state.npc[command.npcId];
  if (!npc || !current) return { ok: false, state, error: '没有这个人' };
  const beat = command.beat ?? current.beat;
  const affinity = command.affinity ?? current.affinity;
  if (!Number.isInteger(beat) || beat < 0 || beat > npc.beats.length) {
    return { ok: false, state, error: '剧情进度不对' };
  }
  if (!Number.isInteger(affinity) || affinity < -50 || affinity > 99) {
    return { ok: false, state, error: '好感数值不对' };
  }
  return {
    ok: true,
    state: { ...state, npc: { ...state.npc, [npc.id]: { beat, affinity } } },
  };
}

function addFlag(
  state: GameState,
  flag: string,
): { ok: true; state: GameState } | { ok: false; state: GameState; error: string } {
  if (!flag || flag.length > 40 || !/^[\w-]+$/.test(flag)) return { ok: false, state, error: '标记不对' };
  if (state.flags.includes(flag)) return { ok: true, state };
  return { ok: true, state: { ...state, flags: [...state.flags, flag] } };
}

function queueNpc(
  state: GameState,
  npcId: string,
): { ok: true; state: GameState } | { ok: false; state: GameState; error: string } {
  const availability = beatAvailability(state, npcId);
  if (!availability.ok || !availability.beat) return { ok: false, state, error: availability.reason };
  const beat = availability.beat;
  return {
    ok: true,
    state: {
      ...state,
      phase: 'event',
      endingId: null,
      pending: { kind: 'npc', id: beat.id, npcId },
      contentResolvedToday: true,
      contentLog: state.contentResolvedToday ? state.contentLog : [...state.contentLog, { day: state.day, id: beat.id }],
    },
  };
}

function setProficiency(
  state: GameState,
  jobId: string,
  value: number,
): { ok: true; state: GameState } | { ok: false; state: GameState; error: string } {
  const job = jobById(jobId);
  if (!job || !Number.isFinite(value)) return { ok: false, state, error: '没有这份工作' };
  const proficiency = Math.max(0, Math.min(999, Math.floor(value)));
  return { ok: true, state: { ...state, proficiency: { ...state.proficiency, [job.id]: proficiency } } };
}
