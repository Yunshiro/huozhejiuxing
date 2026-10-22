import type { ActionDef, MealDef, StrollHook } from './schema';

export const ACTIONS: ActionDef[] = [
  {
    id: 'work',
    name: '打工',
    locationId: 'street',
    hint: '选一份活，当场结钱',
    result: '',
    effects: {},
    optionKind: 'job',
  },
  {
    id: 'eat',
    name: '吃饭',
    locationId: 'eatery',
    hint: '花钱把饥饿拉回来',
    result: '',
    effects: {},
    optionKind: 'meal',
  },
  {
    id: 'rest',
    name: '休息',
    locationId: 'room',
    hint: '恢复体力',
    result: '你靠着墙坐了一会儿。什么都没干成，也没人催。',
    effects: { stamina: 32, mood: 6 },
  },
  {
    id: 'wash',
    name: '洗澡',
    locationId: 'room',
    hint: '花一点水费，心情会好',
    result: '热水只有一点点。身上干净了，镜子也没那么讨厌。',
    effects: { mood: 18, stamina: 1, money: -6 },
  },
  {
    id: 'stroll',
    name: '逛街见人',
    locationId: 'street',
    hint: '散散心，也许碰到熟人',
    result: '你在街上走了一圈，没有买什么，风倒是领了不少。',
    effects: { mood: 10, stamina: -5, hunger: -1, money: -10 },
  },
  {
    id: 'sleep',
    name: '睡觉',
    locationId: 'room',
    hint: '晚上睡更管用',
    result: '你睡了过去。梦很短，或者根本没有。',
    effects: { stamina: 38, mood: 8, hunger: -1 },
    slotBonus: { evening: { stamina: 6, mood: 2 } },
    slotResult: { evening: '这一觉一直睡到楼道灯灭。比白天那一小时管用。' },
  },
];

export const MEALS: MealDef[] = [
  {
    id: 'noodle',
    name: '清汤面',
    cost: 14,
    hunger: 34,
    mood: 2,
    blurb: '汤比面多。',
    result: '面汤喝完，胃里算有了着落。',
  },
  {
    id: 'box',
    name: '盒饭',
    cost: 18,
    hunger: 40,
    mood: 1,
    blurb: '还热着，饭有点坨。',
    result: '你把盒子刮干净。今天这顿算数。',
  },
  {
    id: 'stall',
    name: '烧烤',
    cost: 36,
    hunger: 44,
    mood: 12,
    stamina: 2,
    blurb: '烟火气，贵一点。',
    result: '串是咸的，烟是香的。心情居然抬了一下。',
  },
];

export const STROLL_HOOKS: StrollHook[] = [
  {
    npcId: 'wang',
    minBeat: 1,
    affinity: 1,
    oncePerDay: true,
    log: '街口又碰到王大爷，他朝你抬了抬下巴。',
  },
];
