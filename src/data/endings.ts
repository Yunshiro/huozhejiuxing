import type { EndingDef } from './schema';

export const ENDING = {
  paid: 'paid',
  unpaid: 'unpaid',
  starve: 'starve',
  breakdown: 'breakdown',
  collapse: 'collapse',
  leave: 'leave_with_lin',
  bench: 'bench',
} as const;

export const ENDINGS: EndingDef[] = [
  {
    id: ENDING.paid,
    name: '结清',
    keyStat: { kind: 'money-left' },
    text: '第三十天晚上，你把钱数了两遍，打给那个号码。对面说「收到」，又像随口问了句还有没有事。你说没有。窗外面还是那条街。债不在了，明天的班还在。',
  },
  {
    id: ENDING.unpaid,
    name: '还差一截',
    keyStat: { kind: 'money-short' },
    text: '期限到了。你报出卡里的数字，那边停了一下，说再看看吧。电话挂断以后，房间安静得能听见楼道里的灯。日子还在，那笔债也还在。',
  },
  {
    id: ENDING.starve,
    name: '饿倒',
    keyStat: { kind: 'label', text: '饥饿归零' },
    text: '你记得自己还想去吃点东西。腿先软了，世界的声音变得很远。这一局停在这里。不是城市赢了，是胃先投了降。',
  },
  {
    id: ENDING.breakdown,
    name: '心态崩了',
    keyStat: { kind: 'label', text: '心情归零' },
    text: '报警的不是身体。你看着明天的班次，突然觉得哪一天都长得一样。工牌摘下来的时候，你没有再戴回去。',
  },
  {
    id: ENDING.collapse,
    name: '累垮',
    keyStat: { kind: 'label', text: '体力归零' },
    text: '骨头像被抽走。你在出租屋的地板上躺平，天花板那块水渍慢慢转。谁喊你都没用。这一天剩下的时间，你只能用来呼吸。',
  },
  {
    id: ENDING.leave,
    name: '末班夜车',
    npcId: 'lin',
    keyStat: { kind: 'label', text: '和小林离开这座城' },
    text: '小林拉着你上了末班长途。债留在这座城里，像一件故意没拿的行李。你们谁都没说以后。车先开了，城市的灯往后退。',
  },
  {
    id: ENDING.bench,
    name: '活着就行',
    npcId: 'wang',
    keyStat: { kind: 'label', text: '在街边停下' },
    text: '王大爷往旁边挪了挪。你没有去任何班上。太阳把两个人的影子叠在一起，很短。他递过来一把瓜子：「活着就行。」',
  },
];

export function endingById(id: string | null): EndingDef | undefined {
  if (!id) return undefined;
  return ENDINGS.find((ending) => ending.id === id);
}
