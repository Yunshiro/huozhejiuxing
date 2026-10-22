import type { GameState } from '../game/types';

export function queryDebug(_search: string): boolean {
  return false;
}

export function debugPanelHtml(_game: GameState, _debugError: string): string {
  return '';
}

export function handleDebugClick(_click: {
  act: string;
  target: HTMLElement;
  game: GameState;
  search: string;
  view: ParentNode;
}): { handled: false } {
  return { handled: false };
}
