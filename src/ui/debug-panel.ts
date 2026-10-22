import { META } from '../data/meta';
import { NPCS } from '../data/npcs';
import type { StatKey } from '../data/schema';
import { beatAvailability } from '../game/content';
import { applyDebug, isDebugMode } from '../game/debug';
import { STAT_KEYS, STAT_LABEL } from '../game/stats';
import type { GameState } from '../game/types';

export function queryDebug(search: string): boolean {
  return __INCLUDE_DEBUG__ && isDebugMode(search);
}

export function debugPanelHtml(game: GameState, debugError: string): string {
  if (!__INCLUDE_DEBUG__) return '';
  const lines = NPCS.map((npc) => {
    const progress = game.npc[npc.id];
    const availability = beatAvailability(game, npc.id);
    return `<li><span>${esc(npc.name)} 好感 ${progress?.affinity ?? 0} · ${progress?.beat ?? 0}/${npc.beats.length}</span><span>${esc(availability.reason)}</span>${
      availability.ok ? `<button data-act="debug-npc" data-id="${esc(npc.id)}">触发</button>` : ''
    }</li>`;
  }).join('');
  return `<details class="debug plain">
    <summary>测试模式</summary>
    ${debugError ? `<p class="error">${esc(debugError)}</p>` : ''}
    <p class="fine">种子 ${game.seed}</p>
    <label class="field">跳到第几天<input data-field="day" type="number" min="1" max="${META.maxDays}" value="${game.day}"></label>
    <button data-act="debug-jump">跳转</button>
    <div class="debug-stats">
      ${STAT_KEYS.map((key) => `<label class="field">${STAT_LABEL[key]}<input data-field="${key}" type="number" value="${game.stats[key]}"></label>`).join('')}
    </div>
    <button data-act="debug-stats">改数值</button>
    <label class="field">用这个种子重开<input data-field="seed" type="number" value="${game.seed}"></label>
    <button data-act="debug-seed">重开</button>
    <ul class="npc-debug">${lines}</ul>
  </details>`;
}

export interface DebugClick {
  act: string;
  target: HTMLElement;
  game: GameState;
  search: string;
  view: ParentNode;
}

export type DebugClickResult =
  | { handled: false }
  | { handled: true; error: string; state?: GameState; restart?: boolean };

export function handleDebugClick(click: DebugClick): DebugClickResult {
  if (!__INCLUDE_DEBUG__) return { handled: false };
  const { act, target, game, search, view } = click;
  if (act === 'debug-jump') {
    const day = Number((view.querySelector('[data-field="day"]') as HTMLInputElement | null)?.value);
    const result = applyDebug(game, { type: 'jump-day', day, slot: 'morning' }, search);
    return result.ok ? { handled: true, error: '', state: result.state } : { handled: true, error: result.error };
  }
  if (act === 'debug-stats') {
    const read = (field: StatKey) => Number((view.querySelector(`[data-field="${field}"]`) as HTMLInputElement | null)?.value);
    const result = applyDebug(
      game,
      { type: 'set-stats', stats: { money: read('money'), hunger: read('hunger'), mood: read('mood'), stamina: read('stamina') } },
      search,
    );
    return result.ok
      ? { handled: true, error: '', state: result.state, restart: true }
      : { handled: true, error: result.error };
  }
  if (act === 'debug-seed') {
    const seed = Number((view.querySelector('[data-field="seed"]') as HTMLInputElement | null)?.value);
    const result = applyDebug(game, { type: 'new-seed', seed: Number.isFinite(seed) ? seed : 1 }, search);
    return result.ok
      ? { handled: true, error: '', state: result.state, restart: true }
      : { handled: true, error: result.error };
  }
  if (act === 'debug-npc') {
    const result = applyDebug(game, { type: 'queue-npc', npcId: target.dataset.id ?? '' }, search);
    return result.ok ? { handled: true, error: '', state: result.state } : { handled: true, error: result.error };
  }
  return { handled: false };
}

function esc(value: string | number): string {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[char] ?? char;
  });
}
