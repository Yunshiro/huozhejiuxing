import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BALANCE } from '../src/data/balance';
import { META } from '../src/data/meta';
import { EVENTS } from '../src/data/events';
import { NPCS } from '../src/data/npcs';
import { pickContent } from '../src/game/content';
import { applyDebug, isDebugMode } from '../src/game/debug';
import { chooseAction, chooseEvent, createGame } from '../src/game/engine';
import { ENDING } from '../src/data/endings';
import { decodeSave, encodeB64Url, encodeSave, fnv1a, SAVE_PREFIX, writeLocal, readLocal } from '../src/game/save';
import { buildShareCard, sharePlan } from '../src/game/share';
import { SHARE_LAYOUT } from '../src/game/share-canvas';
import { pickEventChoice } from './sim';
import type { GameState } from '../src/game/types';

const DEBUG = '?debug=1';

describe('save codes', () => {
  it('round-trips a mid-run state', () => {
    let state = createGame(42);
    if (state.phase === 'event') state = chooseEvent(state, 0);
    state = chooseAction(state, 'rest');
    const code = encodeSave(state);
    const decoded = decodeSave(code);
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(decoded.state).toEqual(state);
    expect(encodeSave(decoded.state)).toBe(code);
  });

  it('rejects bad codes without throwing', () => {
    const samples = ['', '   ', 'HZ1', 'HZ1.abc', 'HZ1.abc.def', 'nope', `${SAVE_PREFIX}.${'a'.repeat(24)}.00000000`];
    for (const sample of samples) {
      expect(() => decodeSave(sample)).not.toThrow();
      const result = decodeSave(sample);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
    }
    const bogus = wrap({ hello: 1 });
    const empty = wrap(null);
    const broken = wrap({ version: 1, day: 99 });
    for (const sample of [bogus, empty, broken]) {
      const result = decodeSave(sample);
      expect(result.ok).toBe(false);
    }
  });

  it('keeps storage failures from crashing', () => {
    const state = createGame(1);
    const exploding = {
      getItem() {
        return null;
      },
      setItem() {
        throw new Error('private mode');
      },
      removeItem() {
        throw new Error('private mode');
      },
    };
    expect(writeLocal(exploding, state)).toBe(false);
    expect(readLocal({ getItem: () => null }).ok).toBe(true);
  });
});

describe('debug mode', () => {
  it('is off unless the query is exactly debug=1', () => {
    expect(isDebugMode('')).toBe(false);
    expect(isDebugMode('?foo=1')).toBe(false);
    expect(isDebugMode('?debug=0')).toBe(false);
    expect(isDebugMode('?debug=1')).toBe(true);
    expect(isDebugMode('?day=3&debug=1')).toBe(true);
  });

  it('refuses stat edits when debug is off and leaves state untouched', () => {
    const state = createGame(9);
    const result = applyDebug(state, { type: 'set-stats', stats: { money: 1, hunger: 0 } }, '');
    expect(result.ok).toBe(false);
    expect(result.state).toBe(state);
    expect(result.state.stats).toEqual(state.stats);
    expect(result.state.endingId).toBeNull();
  });

  it('can jump days and restart from a fixed seed', () => {
    const state = createGame(3);
    const jumped = applyDebug(state, { type: 'jump-day', day: 18, slot: 'evening', skipContent: true }, DEBUG);
    expect(jumped.ok).toBe(true);
    if (!jumped.ok) return;
    expect(jumped.state.day).toBe(18);
    expect(jumped.state.slot).toBe('evening');
    expect(jumped.state.phase).toBe('action');
    const restarted = applyDebug(state, { type: 'new-seed', seed: 77 }, DEBUG);
    expect(restarted.ok).toBe(true);
    if (!restarted.ok) return;
    expect(restarted.state.seed).toBe(77);
    expect(restarted.state).toEqual(createGame(77));
  });
});

describe('event repeat cap and daily story', () => {
  it('never draws the same random event more than twice', () => {
    let state = createGame(4);
    for (const npc of NPCS) {
      const result = applyDebug(state, { type: 'set-npc', npcId: npc.id, beat: npc.beats.length, affinity: 0 }, DEBUG);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      state = result.state;
    }
    for (let i = 0; i < 200; i++) {
      const picked = pickContent(state);
      state = picked.state;
      if (picked.ref.kind === 'event') expect(state.eventCounts[picked.ref.id]).toBeLessThanOrEqual(META.maxEventRepeats);
    }
    for (const event of EVENTS) {
      expect(state.eventCounts[event.id] ?? 0).toBeLessThanOrEqual(2);
      expect(state.eventCounts[event.id]).toBe(2);
    }
  });

  it('fires at least one event or story on every day of a full run', () => {
    let state = createGame(8);
    for (let guard = 0; guard < 400 && !state.endingId; guard++) {
      if (state.phase === 'event') state = chooseEvent(state, pickEventChoice(state));
      else {
        const healed = applyDebug(state, { type: 'set-stats', stats: { hunger: 90, mood: 90, stamina: 90, money: 99999 } }, DEBUG);
        if (!healed.ok) throw new Error(healed.error);
        state = chooseAction(healed.state, 'rest');
      }
    }
    expect(state.endingId === 'paid' || state.endingId === 'unpaid').toBe(true);
    expect(new Set(state.contentLog.map((entry) => entry.day)).size).toBe(30);
    for (const count of Object.values(state.eventCounts)) expect(count).toBeLessThanOrEqual(2);
  });
});

describe('all endings are reachable in debug', () => {
  it('reaches every ending id', () => {
    const reached = new Set<string>();
    reached.add(endingByAction({ hunger: 1 }, 'rest'));
    reached.add(endingByAction({ mood: 1 }, 'work', 'flyer'));
    reached.add(endingByAction({ stamina: 1 }, 'work', 'brick'));
    reached.add(day30('paid'));
    reached.add(day30('unpaid'));
    for (const npc of NPCS) {
      const last = npc.beats[npc.beats.length - 1]!;
      const endingChoice = last.choices.find((choice) => choice.endingId);
      if (!endingChoice?.endingId) continue;
      let state = createGame(1);
      const jumped = applyDebug(state, { type: 'jump-day', day: last.minDay, slot: 'morning', skipContent: true }, DEBUG);
      if (!jumped.ok) throw new Error(jumped.error);
      state = jumped.state;
      const progressed = applyDebug(state, { type: 'set-npc', npcId: npc.id, beat: npc.beats.length - 1, affinity: last.minAffinity }, DEBUG);
      if (!progressed.ok) throw new Error(progressed.error);
      state = progressed.state;
      if (last.requiresFlag) {
        const flagged = applyDebug(state, { type: 'add-flag', flag: last.requiresFlag }, DEBUG);
        if (!flagged.ok) throw new Error(flagged.error);
        state = flagged.state;
      }
      const queued = applyDebug(state, { type: 'queue-npc', npcId: npc.id }, DEBUG);
      if (!queued.ok) throw new Error(queued.error);
      state = chooseEvent(queued.state, last.choices.indexOf(endingChoice));
      expect(state.endingId).toBe(endingChoice.endingId);
      reached.add(state.endingId!);
    }
    for (const ending of ENDINGS_IDS()) expect(reached.has(ending)).toBe(true);
    expect(reached.size).toBeGreaterThanOrEqual(6);
  });
});

describe('share card', () => {
  it('fills the ending card from config placeholders', () => {
    const state = chooseAction(
      applyDebug(
        applyDebug(createGame(1), { type: 'jump-day', day: 4, slot: 'morning', skipContent: true }, DEBUG).state as GameState,
        { type: 'set-stats', stats: { hunger: 1, mood: 40, stamina: 40, money: 20 } },
        DEBUG,
      ).state as GameState,
      'rest',
    );
    const card = buildShareCard(state);
    expect(card).not.toBeNull();
    expect(card?.endingName).toBe('饿倒');
    expect(card?.days).toBe(4);
    expect(card?.keyStat).toContain('饥饿');
    expect(card?.url).toBe(META.gameUrl);
    expect(card?.watermark).toBe(META.watermark);
  });

  it('places the url inside the dark footer, clear of the watermark line', () => {
    expect(SHARE_LAYOUT.urlY).toBeGreaterThanOrEqual(SHARE_LAYOUT.barTop);
    expect(SHARE_LAYOUT.urlY + SHARE_LAYOUT.urlMax).toBeLessThanOrEqual(SHARE_LAYOUT.markY);
    expect(SHARE_LAYOUT.urlMin).toBeGreaterThanOrEqual(24);
  });

  it('picks wechat, mobile share, or desktop download', () => {
    expect(sharePlan('Mozilla/5.0 MicroMessenger', true)).toBe('wechat');
    expect(sharePlan('Mozilla/5.0 MicroMessenger', false)).toBe('wechat');
    expect(sharePlan('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', true)).toBe('share');
    expect(sharePlan('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', false)).toBe('download');
    expect(sharePlan('Mozilla/5.0 (Windows NT 10.0) Chrome/120.0', true)).toBe('download');
  });
});

describe('font loading', () => {
  it('swaps in a local pixel font and does not block first paint on it', () => {
    const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
    expect(css).toContain('font-display: swap');
    expect(css).toContain('PingFang SC');
    expect(css).toContain('Microsoft YaHei');
    expect(css).toContain('fusion-pixel-subset.woff2');
    expect(css).toContain('white-space: nowrap');
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    expect(html).toContain('PingFang SC');
  });
});

function endingByAction(patch: Partial<GameState['stats']>, action: string, option?: string): string {
  let state = createGame(1);
  const jumped = applyDebug(state, { type: 'jump-day', day: 4, slot: 'morning', skipContent: true }, DEBUG);
  if (!jumped.ok) throw new Error(jumped.error);
  const stats = applyDebug(jumped.state, { type: 'set-stats', stats: { hunger: 80, mood: 80, stamina: 80, money: 5000, ...patch } }, DEBUG);
  if (!stats.ok) throw new Error(stats.error);
  const ended = chooseAction(stats.state, action, option);
  if (!ended.endingId) throw new Error('no ending');
  return ended.endingId;
}

function day30(kind: 'paid' | 'unpaid'): string {
  const jumped = applyDebug(createGame(1), { type: 'jump-day', day: 30, slot: 'evening', skipContent: true }, DEBUG);
  if (!jumped.ok) throw new Error(jumped.error);
  const upkeep = -(BALANCE.decay.money ?? 0);
  const money = kind === 'paid' ? jumped.state.debt + upkeep : jumped.state.debt + upkeep - 1;
  const stats = applyDebug(jumped.state, { type: 'set-stats', stats: { money, hunger: 50, mood: 50, stamina: 50 } }, DEBUG);
  if (!stats.ok) throw new Error(stats.error);
  const ended = chooseAction(stats.state, 'rest');
  expect(ended.endingId).toBe(kind === 'paid' ? ENDING.paid : ENDING.unpaid);
  return ended.endingId!;
}

function ENDINGS_IDS(): string[] {
  return ['paid', 'unpaid', 'starve', 'breakdown', 'collapse', 'leave_with_lin', 'bench'];
}

function wrap(value: unknown): string {
  const body = encodeB64Url(JSON.stringify(value));
  return `${SAVE_PREFIX}.${body}.${fnv1a(`${SAVE_PREFIX}.${body}`)}`;
}
