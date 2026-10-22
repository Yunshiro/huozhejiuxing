import { canAffordChoice, findContent } from '../game/content';
import { chooseAction, chooseEvent } from '../game/engine';
import { listJobs } from '../game/jobs';
import type { GameState } from '../game/types';

/**
 * Player policies used by `npm run sim`.
 * The decision rules match QA's sim.test.ts (greedy) and reason.test.ts (normal).
 * Swap a policy by editing the functions in this file.
 */

export type Step = (state: GameState) => GameState;

/** QA xorshift. Seed 0 is remapped so the stream never sticks at zero. */
export function xorshift(seed: number): () => number {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5;
    x >>>= 0;
    return x / 4294967296;
  };
}

function act(state: GameState, next: GameState, fallback: () => GameState): GameState {
  return next !== state ? next : fallback();
}

/**
 * greedy-max-wage: keep hunger/stamina/mood just high enough, then always
 * take the highest-paying job the body can finish.
 */
export function greedyMaxWage(state: GameState): GameState {
  if (state.endingId) return state;
  if (state.phase === 'event' && state.pending) {
    const content = findContent(state.pending);
    if (!content) return state;
    let index = content.choices.findIndex((choice) => canAffordChoice(state, choice) && !choice.endingId);
    if (index < 0) index = 0;
    return chooseEvent(state, index);
  }
  const stats = state.stats;
  if (stats.hunger < 40) {
    const eaten = chooseAction(state, 'eat', 'box');
    if (eaten !== state) return eaten;
  }
  if (stats.stamina < 35) return chooseAction(state, 'sleep');
  if (stats.mood < 35) {
    const action = stats.money >= 6 ? 'wash' : 'stroll';
    return act(state, chooseAction(state, action), () => chooseAction(state, 'rest'));
  }
  const jobs = listJobs(state)
    .filter((job) => !job.locked && -(job.effects.stamina ?? 0) < stats.stamina - 5)
    .sort((a, b) => b.pay - a.pay);
  if (!jobs.length) return chooseAction(state, 'rest');
  return chooseAction(state, 'work', jobs[0]!.id);
}

/**
 * normal-70%: keep food, sleep, and rest topped up. When working, 70% of
 * choices are the highest wage the body can handle; otherwise a random
 * unlocked job from that same list.
 */
export function normalPlayer(rng: () => number): Step {
  return (state) => {
    if (state.endingId) return state;
    if (state.phase === 'event' && state.pending) {
      const content = findContent(state.pending);
      if (!content) return state;
      const options: number[] = [];
      content.choices.forEach((choice, index) => {
        if (canAffordChoice(state, choice) && !choice.endingId) options.push(index);
      });
      const index = options.length ? options[Math.floor(rng() * options.length)]! : 0;
      return chooseEvent(state, index);
    }
    const stats = state.stats;
    if (stats.hunger < 50) {
      const meal = rng() < 0.2 && stats.money > 36 ? 'stall' : rng() < 0.5 ? 'noodle' : 'box';
      return act(state, chooseAction(state, 'eat', meal), () => afterMeal(state, rng));
    }
    return afterMeal(state, rng);
  };
}

function afterMeal(state: GameState, rng: () => number): GameState {
  const stats = state.stats;
  if (state.slot === 'evening' && stats.stamina < 70) return chooseAction(state, 'sleep');
  if (stats.stamina < 40) return chooseAction(state, 'rest');
  if (stats.mood < 45) {
    const action = rng() < 0.5 ? 'wash' : 'stroll';
    return act(state, chooseAction(state, action), () => chooseAction(state, 'rest'));
  }
  if (rng() < 0.1) {
    return act(state, chooseAction(state, 'stroll'), () => chooseAction(state, 'rest'));
  }
  const jobs = listJobs(state)
    .filter((job) => !job.locked && -(job.effects.stamina ?? 0) < stats.stamina - 10)
    .sort((a, b) => b.pay - a.pay);
  if (!jobs.length) return chooseAction(state, 'rest');
  const job = rng() < 0.7 ? jobs[0]! : jobs[Math.floor(rng() * jobs.length)]!;
  return chooseAction(state, 'work', job.id);
}
