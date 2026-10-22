import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ACTIONS } from '../src/data/actions';
import { BALANCE } from '../src/data/balance';
import { ENDINGS } from '../src/data/endings';
import { EVENTS, FALLBACK_EVENT } from '../src/data/events';
import { JOBS } from '../src/data/jobs';
import { META } from '../src/data/meta';
import { NPCS } from '../src/data/npcs';
import type { ChoiceDef } from '../src/data/schema';
import { moneyDelta } from '../src/game/content';
import { applyDebug } from '../src/game/debug';
import { chooseAction, chooseEvent, createGame } from '../src/game/engine';
import { isJobUnlocked, jobPay, listJobs } from '../src/game/jobs';
import { isLowStat } from '../src/game/stats';
import type { GameState } from '../src/game/types';
import { carefulStep, recklessStep, runPolicy } from './sim';

const DEBUG = '?debug=1';

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}

function prep(patch?: Partial<GameState['stats']>): GameState {
  let state = createGame(1);
  const jumped = applyDebug(state, { type: 'jump-day', day: 3, slot: 'morning', skipContent: true }, DEBUG);
  expect(jumped.ok).toBe(true);
  if (!jumped.ok) return state;
  state = jumped.state;
  const stats = applyDebug(
    state,
    { type: 'set-stats', stats: { hunger: 80, mood: 80, stamina: 80, money: 5000, ...patch } },
    DEBUG,
  );
  expect(stats.ok).toBe(true);
  if (!stats.ok) return state;
  return stats.state;
}

describe('stat rules', () => {
  it('decays hunger, mood, and stamina at the end of a slot', () => {
    const state = prep({ hunger: 40, mood: 40, stamina: 40 });
    const rest = ACTIONS.find((action) => action.id === 'rest')!;
    const next = chooseAction(state, 'rest');
    expect(next.stats.hunger).toBe(state.stats.hunger + (rest.effects.hunger ?? 0) + BALANCE.decay.hunger);
    expect(next.stats.mood).toBe(state.stats.mood + (rest.effects.mood ?? 0) + BALANCE.decay.mood);
    expect(next.stats.stamina).toBe(state.stats.stamina + (rest.effects.stamina ?? 0) + BALANCE.decay.stamina);
    expect(next.stats.money).toBe(state.stats.money + (rest.effects.money ?? 0) + (BALANCE.decay.money ?? 0));
    expect(next.day).toBe(3);
    expect(next.slot).toBe('afternoon');
  });

  it('warns at or below 20% of the stat cap', () => {
    expect(BALANCE.lowStatAt / BALANCE.statMax).toBe(0.2);
    expect(isLowStat(20)).toBe(true);
    expect(isLowStat(21)).toBe(false);
  });

  it('does not mutate the previous state', () => {
    const state = deepFreeze(prep());
    const next = chooseAction(state, 'rest');
    expect(next).not.toBe(state);
    expect(state.stats.hunger).toBe(80);
  });
});

describe('endings from the core loop', () => {
  it('ends immediately when hunger hits zero', () => {
    const next = chooseAction(prep({ hunger: 1 }), 'rest');
    expect(next.endingId).toBe('starve');
    expect(next.phase).toBe('ending');
  });

  it('ends immediately when mood hits zero', () => {
    const next = chooseAction(prep({ mood: 1 }), 'work', 'flyer');
    expect(next.endingId).toBe('breakdown');
  });

  it('ends immediately when stamina hits zero', () => {
    const next = chooseAction(prep({ stamina: 1 }), 'work', 'brick');
    expect(next.endingId).toBe('collapse');
  });

  it('prefers hunger if a debug edit zeroes it', () => {
    const result = applyDebug(prep(), { type: 'set-stats', stats: { hunger: 0, mood: 0 } }, DEBUG);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.endingId).toBe('starve');
  });

  it('wins on day 30 when the debt is covered, including an exact amount', () => {
    let state = createGame(2);
    const jumped = applyDebug(state, { type: 'jump-day', day: 30, slot: 'evening', skipContent: true }, DEBUG);
    expect(jumped.ok).toBe(true);
    if (!jumped.ok) return;
    state = jumped.state;
    const upkeep = -(BALANCE.decay.money ?? 0);
    const paid = applyDebug(state, { type: 'set-stats', stats: { money: state.debt + upkeep, hunger: 50, mood: 50, stamina: 50 } }, DEBUG);
    expect(paid.ok).toBe(true);
    if (!paid.ok) return;
    expect(chooseAction(paid.state, 'rest').stats.money).toBe(state.debt);
    expect(chooseAction(paid.state, 'rest').endingId).toBe('paid');
    const short = applyDebug(state, { type: 'set-stats', stats: { money: state.debt + upkeep - 1, hunger: 50, mood: 50, stamina: 50 } }, DEBUG);
    expect(short.ok).toBe(true);
    if (!short.ok) return;
    expect(chooseAction(short.state, 'rest').endingId).toBe('unpaid');
  });

  it('lets a death on the last evening beat the debt check', () => {
    let state = createGame(2);
    const jumped = applyDebug(state, { type: 'jump-day', day: 30, slot: 'evening', skipContent: true }, DEBUG);
    if (!jumped.ok) throw new Error('jump');
    const stats = applyDebug(jumped.state, { type: 'set-stats', stats: { hunger: 1, mood: 50, stamina: 50, money: 999999 } }, DEBUG);
    if (!stats.ok) throw new Error('stats');
    expect(chooseAction(stats.state, 'rest').endingId).toBe('starve');
  });
});

describe('jobs', () => {
  it('raises pay after repeated shifts and caps the bonus', () => {
    const brick = JOBS.find((job) => job.id === 'brick')!;
    expect(jobPay(brick, 0)).toBe(brick.basePay);
    expect(jobPay(brick, brick.stepEvery)).toBe(brick.basePay + brick.payPerStep);
    expect(jobPay(brick, brick.stepEvery * 100)).toBe(brick.basePay + brick.payPerStep * brick.maxSteps);
  });

  it('pays more on the next shift after enough practice', () => {
    let state = prep({ stamina: 90, hunger: 90, mood: 90 });
    const first = listJobs(state).find((job) => job.id === 'brick')!.pay;
    for (let i = 0; i < 2; i++) {
      if (state.phase === 'event') state = chooseEvent(state, 0);
      state = applyDebug(state, { type: 'set-stats', stats: { stamina: 90, hunger: 90, mood: 90, money: 100 } }, DEBUG).state;
      state = chooseAction(state, 'work', 'brick');
    }
    expect(state.proficiency.brick).toBeGreaterThanOrEqual(2);
    const later = listJobs(state).find((job) => job.id === 'brick')!.pay;
    expect(later).toBeGreaterThan(first);
  });

  it('shows better jobs as locked until proficiency is high enough', () => {
    const state = createGame(1);
    const foreman = listJobs(state).find((job) => job.id === 'foreman')!;
    const clerk = listJobs(state).find((job) => job.id === 'clerk')!;
    expect(foreman.locked).toBe(true);
    expect(foreman.lockText).toContain('搬砖');
    expect(clerk.locked).toBe(true);
    expect(isJobUnlocked(state, JOBS.find((job) => job.id === 'foreman')!)).toBe(false);
    const unlocked = applyDebug(state, { type: 'set-proficiency', jobId: 'brick', value: 12 }, DEBUG);
    expect(unlocked.ok).toBe(true);
    if (!unlocked.ok) return;
    expect(listJobs(unlocked.state).find((job) => job.id === 'foreman')!.locked).toBe(false);
    const viaFlyer = applyDebug(state, { type: 'set-proficiency', jobId: 'flyer', value: 8 }, DEBUG);
    expect(viaFlyer.ok).toBe(true);
    if (!viaFlyer.ok) return;
    expect(listJobs(viaFlyer.state).find((job) => job.id === 'clerk')!.locked).toBe(false);
  });
});

describe('content rules', () => {
  it('ships the required cast, events, and endings in data files', () => {
    expect(NPCS.length).toBeGreaterThanOrEqual(3);
    expect(NPCS.length).toBeLessThanOrEqual(5);
    for (const npc of NPCS) {
      expect(npc.beats.length).toBeGreaterThanOrEqual(3);
      expect(npc.beats.length).toBeLessThanOrEqual(5);
    }
    expect(EVENTS.length).toBeGreaterThanOrEqual(30);
    expect(ENDINGS.length).toBeGreaterThanOrEqual(6);
    expect(ENDINGS.filter((ending) => ending.npcId).length).toBeGreaterThanOrEqual(2);
    const ids = new Set<string>();
    for (const event of [...EVENTS, FALLBACK_EVENT, ...NPCS.flatMap((npc) => npc.beats)]) {
      expect(ids.has(event.id)).toBe(false);
      ids.add(event.id);
      expect(event.choices.length).toBeGreaterThanOrEqual(1);
      expect(event.choices.length).toBeLessThanOrEqual(3);
      expect(hasFreeChoice(event.choices)).toBe(true);
    }
  });

  it('can advance every NPC story to the last beat', () => {
    for (const npc of NPCS) {
      let state = createGame(1);
      for (let index = 0; index < npc.beats.length; index++) {
        const beat = npc.beats[index]!;
        const jumped = applyDebug(state, { type: 'jump-day', day: beat.minDay, slot: 'afternoon', skipContent: true }, DEBUG);
        expect(jumped.ok).toBe(true);
        if (!jumped.ok) return;
        state = jumped.state;
        const progressed = applyDebug(state, { type: 'set-npc', npcId: npc.id, beat: index, affinity: beat.minAffinity }, DEBUG);
        expect(progressed.ok).toBe(true);
        if (!progressed.ok) return;
        state = progressed.state;
        const healed = applyDebug(state, { type: 'set-stats', stats: { hunger: 80, mood: 80, stamina: 80, money: 50000 } }, DEBUG);
        if (!healed.ok) throw new Error(healed.error);
        state = healed.state;
        if (beat.requiresFlag) {
          const flagged = applyDebug(state, { type: 'add-flag', flag: beat.requiresFlag }, DEBUG);
          expect(flagged.ok).toBe(true);
          if (!flagged.ok) return;
          state = flagged.state;
        }
        const queued = applyDebug(state, { type: 'queue-npc', npcId: npc.id }, DEBUG);
        expect(queued.ok, `${npc.id} ${beat.id}`).toBe(true);
        if (!queued.ok) return;
        state = queued.state;
        expect(state.pending?.id).toBe(beat.id);
        const choiceIndex = beat.choices.findIndex((choice) => !choice.endingId);
        const indexToPlay = choiceIndex === -1 ? 0 : choiceIndex;
        state = chooseEvent(state, indexToPlay);
        if (beat.choices[indexToPlay]?.endingId) expect(state.endingId).toBe(beat.choices[indexToPlay]?.endingId);
        else expect(state.npc[npc.id]?.beat).toBe(index + 1);
      }
    }
  });
});

describe('balance shape', () => {
  it('lets an all-work run collapse quickly', () => {
    const ended = runPolicy(recklessStep, createGame(3));
    expect(ended.endingId === 'starve' || ended.endingId === 'breakdown' || ended.endingId === 'collapse').toBe(true);
    expect(ended.day).toBeLessThan(15);
  });

  it('lets a careful run reach day 30 and sometimes clear the debt', () => {
    const results = [];
    for (let seed = 1; seed <= 24; seed++) {
      const ended = runPolicy(carefulStep, createGame(seed));
      results.push({ seed, ending: ended.endingId, day: ended.day, money: ended.stats.money });
      for (const count of Object.values(ended.eventCounts)) expect(count).toBeLessThanOrEqual(META.maxEventRepeats);
      if (ended.endingId === 'paid' || ended.endingId === 'unpaid') {
        expect(new Set(ended.contentLog.map((entry) => entry.day)).size).toBe(META.maxDays);
      }
    }
    const finished = results.filter((result) => result.ending === 'paid' || result.ending === 'unpaid');
    const paid = results.filter((result) => result.ending === 'paid');
    expect(finished.length).toBeGreaterThan(0);
    expect(paid.length).toBeGreaterThan(0);
    const amounts = paid.map((result) => result.money).sort((a, b) => a - b);
    const median = amounts[Math.floor(amounts.length / 2)] ?? 0;
    expect(median).toBeLessThan(META.debt + 8000);
  });

  it('clears the debt on about 40% of runs that always take the best job', () => {
    expect(META.debt).toBe(20000);
    let paid = 0;
    const runs = 200;
    for (let seed = 1; seed <= runs; seed++) {
      const ended = runPolicy(carefulStep, createGame(seed));
      if (ended.endingId === 'paid') paid++;
    }
    const rate = paid / runs;
    expect(rate).toBeGreaterThanOrEqual(0.36);
    expect(rate).toBeLessThanOrEqual(0.45);
  });
});

function hasFreeChoice(choices: ChoiceDef[]): boolean {
  return choices.some((choice) => worstMoneyCost(choice) === 0);
}

function worstMoneyCost(choice: ChoiceDef): number {
  const flags = (choice.effectsIf ?? []).map((extra) => extra.flag);
  const money = moneyDelta(choice, flags);
  return money < 0 ? -money : 0;
}

describe('copy guard', () => {
  it('does not name the novels this game is not', () => {
    const files = walk(join(process.cwd(), 'src')).concat(join(process.cwd(), 'README.md'), join(process.cwd(), 'index.html'));
    const banned = ['余华', '大多数'];
    for (const file of files) {
      if (!/\.(ts|css|html|md|svg)$/.test(file)) continue;
      const text = readFileSync(file, 'utf8');
      for (const word of banned) expect(text.includes(word), file).toBe(false);
    }
  });
});

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'assets') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, acc);
    else acc.push(path);
  }
  return acc;
}
