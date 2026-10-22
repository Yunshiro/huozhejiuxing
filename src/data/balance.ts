import type { Stats } from './schema';

/** 数值规则。调平衡只改这个文件，不用动流程代码。 */
export const BALANCE = {
  statMax: 100,
  /** 饥饿 / 心情 / 体力低于这个数（也就是上限的 20%）时界面变红。 */
  lowStatAt: 20,
  start: { money: 700, hunger: 78, mood: 70, stamina: 78 } satisfies Stats,
  /** 每个时段结束时的自然消耗，叠在行动效果之上。钱是生活开销，不改债务金额。 */
  decay: { hunger: -3, mood: -2, stamina: -3, money: -4 } satisfies Partial<Stats>,
  /** 没有到期剧情时，抽到 NPC 故事而不是随机事件的概率。 */
  npcPreferChance: 0.5,
  /** 一段剧情到达最早天数后再过这么多天，就会优先塞进当天。 */
  npcOverdueDays: 6,
} as const;
