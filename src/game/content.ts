import { BALANCE } from '../data/balance';
import { EVENTS, FALLBACK_EVENT } from '../data/events';
import { META } from '../data/meta';
import { NPCS, npcById } from '../data/npcs';
import type { BeatDef, ChoiceDef, EventDef } from '../data/schema';
import { roll } from './rng';
import type { ContentRef, GameState } from './types';

export interface ResolvedContent {
  title: string;
  text: string;
  choices: ChoiceDef[];
  speaker?: string;
  locationId?: string;
}

export function findContent(ref: ContentRef): ResolvedContent | null {
  if (ref.kind === 'fallback') {
    return {
      title: FALLBACK_EVENT.title,
      text: FALLBACK_EVENT.text,
      choices: FALLBACK_EVENT.choices,
      speaker: FALLBACK_EVENT.speaker,
      locationId: FALLBACK_EVENT.locationId,
    };
  }
  if (ref.kind === 'npc') {
    const npc = ref.npcId ? npcById(ref.npcId) : undefined;
    const beat = npc?.beats.find((item) => item.id === ref.id);
    if (!npc || !beat) return null;
    return {
      title: beat.title,
      text: beat.text,
      choices: beat.choices,
      speaker: npc.name,
      locationId: beat.locationId,
    };
  }
  const event = EVENTS.find((item) => item.id === ref.id);
  if (!event) return null;
  return {
    title: event.title,
    text: event.text,
    choices: event.choices,
    speaker: event.speaker,
    locationId: event.locationId,
  };
}

export function moneyDelta(choice: ChoiceDef, flags: string[]): number {
  let money = choice.effects?.money ?? 0;
  for (const extra of choice.effectsIf ?? []) {
    if (flags.includes(extra.flag)) money += extra.effects.money ?? 0;
  }
  return money;
}

export function canAffordChoice(state: GameState, choice: ChoiceDef): boolean {
  const money = moneyDelta(choice, state.flags);
  return money >= 0 || state.stats.money + money >= 0;
}

export function choiceEffects(choice: ChoiceDef, flags: string[]): Partial<GameState['stats']> {
  const effects: Partial<GameState['stats']> = { ...choice.effects };
  for (const extra of choice.effectsIf ?? []) {
    if (!flags.includes(extra.flag)) continue;
    for (const key of ['money', 'hunger', 'mood', 'stamina'] as const) {
      const value = extra.effects[key];
      if (!value) continue;
      effects[key] = (effects[key] ?? 0) + value;
    }
  }
  return effects;
}

export interface BeatAvailability {
  ok: boolean;
  beat?: BeatDef;
  reason: string;
}

export function beatAvailability(state: GameState, npcId: string): BeatAvailability {
  const npc = npcById(npcId);
  if (!npc) return { ok: false, reason: '没有这个人' };
  const progress = state.npc[npcId] ?? { beat: 0, affinity: 0 };
  const beat = npc.beats[progress.beat];
  if (!beat) return { ok: false, reason: '故事已完' };
  const reasons: string[] = [];
  if (state.day < beat.minDay) reasons.push(`要到第 ${beat.minDay} 天`);
  if (progress.affinity < beat.minAffinity) reasons.push(`好感 ${progress.affinity}/${beat.minAffinity}`);
  if (beat.requiresFlag && !state.flags.includes(beat.requiresFlag)) reasons.push('还没遇到');
  if (reasons.length) return { ok: false, beat, reason: reasons.join('，') };
  return { ok: true, beat, reason: `可触发：${beat.title}` };
}

interface AvailableBeat {
  npcId: string;
  beat: BeatDef;
}

function availableBeats(state: GameState): AvailableBeat[] {
  const list: AvailableBeat[] = [];
  for (const npc of NPCS) {
    const availability = beatAvailability(state, npc.id);
    if (availability.ok && availability.beat) list.push({ npcId: npc.id, beat: availability.beat });
  }
  return list;
}

export function pickContent(state: GameState): { state: GameState; ref: ContentRef } {
  const beats = availableBeats(state);
  const scheduled = beats
    .filter((item) => item.beat.scheduleDay === state.day)
    .sort((a, b) => a.npcId.localeCompare(b.npcId));
  if (scheduled.length > 0) {
    const chosen = scheduled[0]!;
    return { state, ref: { kind: 'npc', id: chosen.beat.id, npcId: chosen.npcId } };
  }

  const overdue = beats
    .filter((item) => state.day >= item.beat.minDay + BALANCE.npcOverdueDays)
    .sort((a, b) => a.beat.minDay - b.beat.minDay || a.npcId.localeCompare(b.npcId));
  if (overdue.length > 0) {
    const chosen = overdue[0]!;
    return { state, ref: { kind: 'npc', id: chosen.beat.id, npcId: chosen.npcId } };
  }

  const chance = roll(state);
  if (beats.length > 0 && chance.value < BALANCE.npcPreferChance) {
    const indexed = roll(chance.state);
    const chosen = beats[Math.floor(indexed.value * beats.length)]!;
    return { state: indexed.state, ref: { kind: 'npc', id: chosen.beat.id, npcId: chosen.npcId } };
  }
  return pickEvent(chance.state);
}

function pickEvent(state: GameState): { state: GameState; ref: ContentRef } {
  const pool = EVENTS.filter((event) => !event.uncapped && (state.eventCounts[event.id] ?? 0) < META.maxEventRepeats);
  if (pool.length === 0) return { state, ref: { kind: 'fallback', id: FALLBACK_EVENT.id } };
  const rolled = roll(state);
  const event = pool[Math.floor(rolled.value * pool.length)]!;
  const count = (rolled.state.eventCounts[event.id] ?? 0) + 1;
  return {
    state: {
      ...rolled.state,
      eventCounts: { ...rolled.state.eventCounts, [event.id]: count },
    },
    ref: { kind: 'event', id: event.id },
  };
}

export interface ContentView {
  title: string;
  text: string;
  speaker?: string;
  choices: { index: number; text: string; disabled: boolean; confirm?: string }[];
}

export function contentView(state: GameState): ContentView | null {
  if (!state.pending) return null;
  const found = findContent(state.pending);
  if (!found) return null;
  return {
    title: found.title,
    text: found.text,
    speaker: found.speaker,
    choices: found.choices.map((choice, index) => ({
      index,
      text: choice.text,
      disabled: !canAffordChoice(state, choice),
      confirm: choice.confirm,
    })),
  };
}

export function eventDef(id: string): EventDef | undefined {
  return EVENTS.find((event) => event.id === id);
}
