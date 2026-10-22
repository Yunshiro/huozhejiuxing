import { BALANCE } from '../data/balance';
import type { StatKey, Stats } from '../data/schema';

export const STAT_KEYS: StatKey[] = ['money', 'hunger', 'mood', 'stamina'];

export const STAT_LABEL: Record<StatKey, string> = {
  money: '钱',
  hunger: '饥饿',
  mood: '心情',
  stamina: '体力',
};

export function mergeEffects(...parts: (Partial<Stats> | undefined)[]): Partial<Stats> {
  const out: Partial<Stats> = {};
  for (const part of parts) {
    if (!part) continue;
    for (const key of STAT_KEYS) {
      const value = part[key];
      if (!value) continue;
      out[key] = (out[key] ?? 0) + value;
    }
  }
  return out;
}

export function applyStatEffects(
  stats: Stats,
  effects: Partial<Stats>,
): { stats: Stats; deltas: Partial<Stats> } {
  const next: Stats = { ...stats };
  const deltas: Partial<Stats> = {};
  for (const key of STAT_KEYS) {
    const delta = effects[key];
    if (!delta) continue;
    const before = next[key];
    let after = before + delta;
    if (key === 'money') after = Math.max(0, after);
    else after = Math.max(0, Math.min(BALANCE.statMax, after));
    after = Math.round(after);
    if (after === before) continue;
    next[key] = after;
    deltas[key] = after - before;
  }
  return { stats: next, deltas };
}

export function combineDeltas(a: Partial<Stats>, b: Partial<Stats>): Partial<Stats> {
  const out: Partial<Stats> = {};
  for (const key of STAT_KEYS) {
    const value = (a[key] ?? 0) + (b[key] ?? 0);
    if (value) out[key] = value;
  }
  return out;
}

export function deathEnding(stats: Stats): 'starve' | 'breakdown' | 'collapse' | null {
  if (stats.hunger <= 0) return 'starve';
  if (stats.mood <= 0) return 'breakdown';
  if (stats.stamina <= 0) return 'collapse';
  return null;
}

export function isLowStat(value: number): boolean {
  return value <= BALANCE.lowStatAt;
}

export function formatDeltas(deltas: Partial<Stats>): string {
  const parts: string[] = [];
  for (const key of STAT_KEYS) {
    const value = deltas[key];
    if (!value) continue;
    parts.push(`${STAT_LABEL[key]} ${value > 0 ? '+' : ''}${value}`);
  }
  return parts.join('，');
}

export function clampStatInput(key: StatKey, value: number): number {
  if (!Number.isFinite(value)) return key === 'money' ? 0 : 1;
  const rounded = Math.round(value);
  if (key === 'money') return Math.max(0, rounded);
  return Math.max(0, Math.min(BALANCE.statMax, rounded));
}
