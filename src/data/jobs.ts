import type { JobDef } from './schema';

export const JOBS: JobDef[] = [
  {
    id: 'brick',
    name: '搬砖',
    locationId: 'site',
    blurb: '水泥和砖，不认人。',
    basePay: 200,
    stepEvery: 2,
    payPerStep: 16,
    maxSteps: 8,
    effects: { stamina: -16, hunger: -1, mood: -2 },
    flagsAdd: ['worked_brick'],
  },
  {
    id: 'delivery',
    name: '送外卖',
    locationId: 'street',
    blurb: '骑到风里，单子不等人。',
    basePay: 180,
    stepEvery: 2,
    payPerStep: 12,
    maxSteps: 8,
    effects: { stamina: -12, hunger: -1, mood: -2 },
  },
  {
    id: 'flyer',
    name: '发传单',
    locationId: 'street',
    blurb: '传单最后大多进了垃圾桶。',
    basePay: 120,
    stepEvery: 3,
    payPerStep: 10,
    maxSteps: 6,
    effects: { stamina: -6, hunger: -1, mood: -5 },
  },
  {
    id: 'foreman',
    name: '工地班长',
    locationId: 'site',
    blurb: '少搬一点，多喊两声。',
    basePay: 322,
    stepEvery: 3,
    payPerStep: 18,
    maxSteps: 5,
    effects: { stamina: -12, hunger: -1, mood: -1 },
    unlock: { type: 'proficiency', jobId: 'brick', min: 12 },
  },
  {
    id: 'clerk',
    name: '便利店店员',
    locationId: 'shop',
    blurb: '灯管很白，空调倒是真的。',
    basePay: 260,
    stepEvery: 3,
    payPerStep: 14,
    maxSteps: 5,
    effects: { stamina: -7, hunger: 0, mood: 3 },
    unlock: {
      type: 'any',
      reqs: [
        { jobId: 'flyer', min: 8 },
        { jobId: 'delivery', min: 12 },
      ],
    },
  },
];

export function jobById(id: string): JobDef | undefined {
  return JOBS.find((job) => job.id === id);
}
