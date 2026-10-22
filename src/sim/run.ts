import { createGame } from '../game/engine';
import type { GameState } from '../game/types';
import { greedyMaxWage, normalPlayer, xorshift, type Step } from './strategies';

export const SIM_SEEDS = 300;

export interface SimReport {
  name: string;
  runs: number;
  payoff: number;
  payoffRate: number;
  deaths: number;
  deathRate: number;
  avgMoney: number;
}

export function play(step: Step, seed: number): GameState {
  let state = createGame(seed);
  for (let guard = 0; guard < 500 && !state.endingId; guard++) {
    const next = step(state);
    if (next === state) throw new Error(`${seed} stuck on day ${state.day} ${state.slot} ${state.phase}`);
    state = next;
  }
  if (!state.endingId) throw new Error(`${seed} did not finish`);
  return state;
}

export function report(name: string, stepForSeed: (seed: number) => Step, runs = SIM_SEEDS): SimReport {
  let payoff = 0;
  let deaths = 0;
  let money = 0;
  for (let seed = 1; seed <= runs; seed++) {
    const ended = play(stepForSeed(seed), seed);
    money += ended.stats.money;
    if (ended.endingId === 'paid') payoff += 1;
    else if (ended.endingId !== 'unpaid') deaths += 1;
  }
  return {
    name,
    runs,
    payoff,
    payoffRate: payoff / runs,
    deaths,
    deathRate: deaths / runs,
    avgMoney: money / runs,
  };
}

export function simulate(runs = SIM_SEEDS): SimReport[] {
  return [
    report('greedy-max-wage', () => greedyMaxWage, runs),
    report('normal-70%', (seed) => normalPlayer(xorshift(seed)), runs),
  ];
}

export function formatReport(row: SimReport): string {
  const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
  return [
    row.name,
    `seeds 1-${row.runs}`,
    `payoff ${row.payoff}/${row.runs} (${pct(row.payoffRate)})`,
    `death ${row.deaths}/${row.runs} (${pct(row.deathRate)})`,
    `avg money ${Math.round(row.avgMoney)}`,
  ].join('  ');
}
