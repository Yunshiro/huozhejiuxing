import type { GameState } from './types';

/** mulberry32. Saved state is the current uint32, before the next step. */
export function nextUint(state: number): { state: number; value: number } {
  let a = state | 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { state: a >>> 0, value };
}

export function roll(state: GameState): { state: GameState; value: number } {
  const next = nextUint(state.rng);
  return { state: { ...state, rng: next.state }, value: next.value };
}

export function randomSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]! >>> 0;
}
