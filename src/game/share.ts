import { endingById } from '../data/endings';
import { META } from '../data/meta';
import type { EndingDef } from '../data/schema';
import type { GameState } from './types';

export interface ShareCard {
  gameTitle: string;
  endingName: string;
  days: number;
  keyStat: string;
  url: string;
  watermark: string;
  text: string;
}

export function formatKeyStat(ending: EndingDef, state: GameState): string {
  if (ending.keyStat.kind === 'money-left') return `结余 ${state.stats.money} 元`;
  if (ending.keyStat.kind === 'money-short') return `还差 ${Math.max(0, state.debt - state.stats.money)} 元`;
  return ending.keyStat.text;
}

export function buildShareCard(state: GameState): ShareCard | null {
  const ending = endingById(state.endingId);
  if (!ending) return null;
  return {
    gameTitle: META.title,
    endingName: ending.name,
    days: state.day,
    keyStat: formatKeyStat(ending, state),
    url: META.gameUrl,
    watermark: META.watermark,
    text: ending.text,
  };
}

export function isWeChat(ua: string): boolean {
  return /MicroMessenger/i.test(ua);
}

export function isMobile(ua: string): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
}

/** 微信内置浏览器长按保存；手机优先系统分享；电脑下载 PNG。 */
export function sharePlan(ua: string, canShareFiles: boolean): 'wechat' | 'share' | 'download' {
  if (isWeChat(ua)) return 'wechat';
  if (isMobile(ua) && canShareFiles) return 'share';
  return 'download';
}
