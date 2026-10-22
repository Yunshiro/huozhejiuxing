import { canAffordChoice, contentView, findContent } from '../src/game/content';
import { chooseAction, chooseEvent, mealViews } from '../src/game/engine';
import { listJobs } from '../src/game/jobs';
import type { ChoiceDef } from '../src/data/schema';
import { choiceEffects } from '../src/game/content';
import type { GameState } from '../src/game/types';

export function pickEventChoice(state: GameState): number {
  const view = contentView(state);
  const found = state.pending ? findContent(state.pending) : null;
  if (!view || !found) return 0;
  let best = -1;
  let bestScore = -Infinity;
  view.choices.forEach((choice, index) => {
    const def = found.choices[index];
    if (!def || choice.disabled || def.endingId) return;
    const score = scoreChoice(state, def);
    if (score > bestScore) {
      bestScore = score;
      best = index;
    }
  });
  if (best >= 0) return best;
  const fallback = view.choices.findIndex((choice) => !choice.disabled);
  if (fallback < 0) throw new Error(`softlock ${state.pending?.id ?? 'none'}`);
  return fallback;
}

function scoreChoice(state: GameState, choice: ChoiceDef): number {
  if (!canAffordChoice(state, choice)) return -1e8;
  const effects = choiceEffects(choice, state.flags);
  const hunger = state.stats.hunger + (effects.hunger ?? 0);
  const mood = state.stats.mood + (effects.mood ?? 0);
  const stamina = state.stats.stamina + (effects.stamina ?? 0);
  if (hunger <= 0 || mood <= 0 || stamina <= 0) return -1e7;
  const money = effects.money ?? 0;
  return Math.min(hunger, 100) + Math.min(mood, 100) + Math.min(stamina, 100) + Math.max(-40, Math.min(30, money / 20)) + (choice.affinity ?? 0) * 3;
}

export function carefulStep(state: GameState): GameState {
  if (state.endingId) return state;
  if (state.phase === 'event') return chooseEvent(state, pickEventChoice(state));
  const stats = state.stats;
  const meals = mealViews(state).filter((meal) => !meal.disabled);
  if (stats.hunger < 46 && meals.length > 0) {
    const meal = [...meals].sort((a, b) => b.hunger - a.hunger || a.cost - b.cost)[0]!;
    return chooseAction(state, 'eat', meal.id);
  }
  if (stats.mood < 32) {
    if (stats.money >= 6) return chooseAction(state, 'wash');
    return chooseAction(state, 'rest');
  }
  if (stats.stamina < 36) {
    if (state.slot === 'evening' || stats.stamina < 24) return chooseAction(state, 'sleep');
    return chooseAction(state, 'rest');
  }
  if (state.slot === 'evening' && stats.stamina < 58) return chooseAction(state, 'sleep');
  const jobs = listJobs(state)
    .filter((job) => !job.locked)
    .sort((a, b) => b.pay - a.pay);
  const job = jobs[0];
  if (!job) return chooseAction(state, 'rest');
  const stamCost = Math.abs(job.effects.stamina ?? 0) + 3;
  if (state.slot !== 'evening' && stats.stamina - stamCost >= 20 && stats.hunger >= 30) {
    return chooseAction(state, 'work', job.id);
  }
  if (state.slot === 'evening') return chooseAction(state, 'sleep');
  return chooseAction(state, 'rest');
}

export function recklessStep(state: GameState): GameState {
  if (state.phase === 'event') return chooseEvent(state, pickEventChoice(state));
  const jobs = listJobs(state)
    .filter((job) => !job.locked)
    .sort((a, b) => b.pay - a.pay);
  return chooseAction(state, 'work', jobs[0]!.id);
}

export function runPolicy(step: (state: GameState) => GameState, state: GameState): GameState {
  let next = state;
  for (let guard = 0; guard < 400 && !next.endingId; guard++) {
    const after = step(next);
    if (after === next) throw new Error(`stuck at day ${next.day} ${next.slot} ${next.phase}`);
    next = after;
  }
  return next;
}
