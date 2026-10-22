import { ACTIONS, MEALS, STROLL_HOOKS } from '../data/actions';
import { BALANCE } from '../data/balance';
import { ENDING } from '../data/endings';
import { JOBS, jobById } from '../data/jobs';
import { META } from '../data/meta';
import { NPCS } from '../data/npcs';
import type { SlotId, Stats } from '../data/schema';
import {
  canAffordChoice,
  choiceEffects,
  findContent,
  pickContent,
} from './content';
import { isJobUnlocked, jobPay } from './jobs';
import { roll } from './rng';
import { applyStatEffects, combineDeltas, deathEnding, formatDeltas, mergeEffects } from './stats';
import type { ContentRef, GameState } from './types';

export const SLOTS: SlotId[] = ['morning', 'afternoon', 'evening'];

export const SLOT_LABEL: Record<SlotId, string> = {
  morning: '上午',
  afternoon: '下午',
  evening: '晚上',
};

function blankNpc(): GameState['npc'] {
  return Object.fromEntries(NPCS.map((npc) => [npc.id, { beat: 0, affinity: 0 }]));
}

function pushLog(state: GameState, line: string): GameState {
  if (!line) return state;
  return { ...state, log: [line, ...state.log].slice(0, 8) };
}

function addFlags(flags: string[], extra?: string[]): string[] {
  if (!extra?.length) return flags;
  let next = flags;
  for (const flag of extra) if (!next.includes(flag)) next = [...next, flag];
  return next;
}

function toEnding(state: GameState, endingId: string): GameState {
  return { ...state, endingId, phase: 'ending', pending: null };
}

export function enterSlot(state: GameState): GameState {
  if (state.endingId) return { ...state, phase: 'ending' };
  if (!state.contentResolvedToday && (state.slot === state.planSlot || state.slot === 'evening')) {
    return openContent(state);
  }
  return { ...state, phase: 'action', pending: null };
}

function openContent(state: GameState): GameState {
  const picked = pickContent(state);
  return {
    ...picked.state,
    phase: 'event',
    pending: picked.ref,
    contentResolvedToday: true,
    contentLog: [...picked.state.contentLog, { day: picked.state.day, id: picked.ref.id }],
  };
}

export function createGame(seed: number): GameState {
  const base: GameState = {
    version: 1,
    seed: seed >>> 0,
    rng: seed >>> 0,
    day: 1,
    slot: 'morning',
    phase: 'action',
    stats: { ...BALANCE.start },
    debt: META.debt,
    proficiency: Object.fromEntries(JOBS.map((job) => [job.id, 0])),
    npc: blankNpc(),
    flags: [],
    eventCounts: {},
    contentResolvedToday: false,
    planSlot: 'morning',
    pending: null,
    contentLog: [],
    locationId: 'room',
    endingId: null,
    banner: '三十天。手头的钱要在最后一晚够还那笔债。',
    lastDeltas: {},
    log: [],
  };
  const rolled = roll(base);
  const planSlot = SLOTS[Math.floor(rolled.value * SLOTS.length)]!;
  return enterSlot({ ...rolled.state, planSlot });
}

function applyStroll(state: GameState): GameState {
  let next = state;
  const notes: string[] = [];
  for (const hook of STROLL_HOOKS) {
    const progress = next.npc[hook.npcId];
    if (!progress || progress.beat < hook.minBeat) continue;
    const flag = `hook_${hook.npcId}_${next.day}`;
    if (hook.oncePerDay && next.flags.includes(flag)) continue;
    next = {
      ...next,
      npc: {
        ...next.npc,
        [hook.npcId]: { ...progress, affinity: progress.affinity + hook.affinity },
      },
      flags: hook.oncePerDay ? addFlags(next.flags, [flag]) : next.flags,
    };
    if (hook.log) notes.push(hook.log);
  }
  if (!notes.length) return next;
  return { ...next, banner: `${next.banner}${notes.join('')}` };
}

function finishSlot(
  state: GameState,
  spec: {
    effects: Partial<Stats>;
    locationId: string;
    banner: string;
    flagsAdd?: string[];
    stroll?: boolean;
  },
): GameState {
  const applied = applyStatEffects(state.stats, spec.effects);
  const closing = state.day === META.maxDays && state.slot === 'evening';
  // The closing slot is judged before end-of-slot upkeep, so money that
  // already covers the debt is not spent away into a loss. Body drain still
  // applies, and a stat hitting zero still ends the run first.
  const slotDecay = closing
    ? { hunger: BALANCE.decay.hunger, mood: BALANCE.decay.mood, stamina: BALANCE.decay.stamina }
    : BALANCE.decay;
  const decayed = applyStatEffects(applied.stats, slotDecay);
  const deltas = combineDeltas(applied.deltas, decayed.deltas);
  let next: GameState = {
    ...state,
    stats: decayed.stats,
    lastDeltas: deltas,
    locationId: spec.locationId,
    banner: spec.banner,
    flags: addFlags(state.flags, spec.flagsAdd),
    phase: 'action',
    pending: null,
  };
  if (spec.stroll) next = applyStroll(next);
  const detail = formatDeltas(deltas);
  next = pushLog(next, [next.banner, detail].filter(Boolean).join(''));
  const death = deathEnding(next.stats);
  if (death) return toEnding(next, ENDING[death]);
  if (closing) {
    return toEnding(next, applied.stats.money >= next.debt ? ENDING.paid : ENDING.unpaid);
  }
  return advance(next);
}

function advance(state: GameState): GameState {
  if (state.slot === 'evening') {
    const rolled = roll({
      ...state,
      day: state.day + 1,
      slot: 'morning',
      contentResolvedToday: false,
      pending: null,
    });
    const planSlot = SLOTS[Math.floor(rolled.value * SLOTS.length)]!;
    return enterSlot({ ...rolled.state, planSlot });
  }
  const index = SLOTS.indexOf(state.slot);
  return enterSlot({ ...state, slot: SLOTS[index + 1]!, pending: null });
}

export function chooseAction(state: GameState, actionId: string, optionId?: string): GameState {
  if (state.endingId) return state;
  const action = ACTIONS.find((item) => item.id === actionId);
  if (!action) return state;

  if (action.optionKind === 'job') {
    if (state.phase !== 'action' && state.phase !== 'jobs') return state;
    if (!optionId) return { ...state, phase: 'jobs' };
    const job = jobById(optionId);
    if (!job || !isJobUnlocked(state, job)) return state;
    const pay = jobPay(job, state.proficiency[job.id] ?? 0);
    const proficiency = { ...state.proficiency, [job.id]: (state.proficiency[job.id] ?? 0) + 1 };
    return finishSlot(
      { ...state, proficiency },
      {
        effects: mergeEffects(job.effects, { money: pay }),
        locationId: job.locationId,
        banner: `${job.name}，进账 ${pay} 元。`,
        flagsAdd: job.flagsAdd,
      },
    );
  }

  if (action.optionKind === 'meal') {
    if (state.phase !== 'action' && state.phase !== 'meals') return state;
    if (!optionId) return { ...state, phase: 'meals' };
    const meal = MEALS.find((item) => item.id === optionId);
    if (!meal || state.stats.money < meal.cost) return state;
    return finishSlot(state, {
      effects: { money: -meal.cost, hunger: meal.hunger, mood: meal.mood, stamina: meal.stamina ?? 0 },
      locationId: 'eatery',
      banner: meal.result,
    });
  }

  if (state.phase !== 'action') return state;
  const cost = -(action.effects.money ?? 0);
  if (cost > 0 && state.stats.money < cost) return state;
  return finishSlot(state, {
    effects: mergeEffects(action.effects, action.slotBonus?.[state.slot]),
    locationId: action.locationId,
    banner: action.slotResult?.[state.slot] ?? action.result,
    stroll: action.id === 'stroll',
  });
}

export function backToActions(state: GameState): GameState {
  if (state.phase === 'jobs' || state.phase === 'meals') return { ...state, phase: 'action' };
  return state;
}

export function chooseEvent(state: GameState, choiceIndex: number): GameState {
  if (state.phase !== 'event' || !state.pending || state.endingId) return state;
  const found = findContent(state.pending);
  const choice = found?.choices[choiceIndex];
  if (!found || !choice || !canAffordChoice(state, choice)) return state;

  const applied = applyStatEffects(state.stats, choiceEffects(choice, state.flags));
  let next: GameState = {
    ...state,
    stats: applied.stats,
    lastDeltas: applied.deltas,
    flags: addFlags(state.flags, choice.flagsAdd),
    banner: choice.result ?? found.title,
    locationId: found.locationId ?? state.locationId,
  };
  next = applyStoryProgress(next, state.pending, choice.affinity ?? 0, choice.npcAffinity);
  const detail = formatDeltas(applied.deltas);
  next = pushLog(next, [next.banner, detail].filter(Boolean).join(''));
  if (choice.endingId) return toEnding(next, choice.endingId);
  const death = deathEnding(next.stats);
  if (death) return toEnding(next, ENDING[death]);
  return { ...next, phase: 'action', pending: null };
}

function applyStoryProgress(
  state: GameState,
  pending: ContentRef,
  affinity: number,
  extras: { npcId: string; delta: number }[] | undefined,
): GameState {
  const deltas = new Map<string, number>();
  if (pending.kind === 'npc' && pending.npcId) {
    deltas.set(pending.npcId, (deltas.get(pending.npcId) ?? 0) + affinity);
  }
  for (const extra of extras ?? []) {
    deltas.set(extra.npcId, (deltas.get(extra.npcId) ?? 0) + extra.delta);
  }
  let npc = state.npc;
  let changed = false;
  for (const [npcId, delta] of deltas) {
    const current = npc[npcId];
    if (!current || !delta) continue;
    if (!changed) {
      npc = { ...npc };
      changed = true;
    }
    npc[npcId] = { ...current, affinity: current.affinity + delta };
  }
  if (pending.kind === 'npc' && pending.npcId && npc[pending.npcId]) {
    if (!changed) npc = { ...npc };
    const current = npc[pending.npcId]!;
    npc[pending.npcId] = { ...current, beat: current.beat + 1 };
    changed = true;
  }
  return changed ? { ...state, npc } : state;
}

export function displayLocationId(state: GameState): string {
  if (state.phase === 'jobs') return 'street';
  if (state.phase === 'meals') return 'eatery';
  if (state.phase === 'event' && state.pending) {
    return findContent(state.pending)?.locationId ?? state.locationId;
  }
  return state.locationId;
}

export function mealViews(state: GameState) {
  return MEALS.map((meal) => ({
    id: meal.id,
    name: meal.name,
    cost: meal.cost,
    blurb: meal.blurb,
    hunger: meal.hunger,
    mood: meal.mood,
    disabled: state.stats.money < meal.cost,
  }));
}

export function actionViews(state: GameState) {
  return ACTIONS.map((action) => {
    const cost = -(action.effects.money ?? 0);
    const disabled = !action.optionKind && cost > 0 && state.stats.money < cost;
    return {
      id: action.id,
      name: action.name,
      hint: disabled ? '钱不够' : action.hint,
      disabled,
    };
  });
}
