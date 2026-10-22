export type StatKey = 'money' | 'hunger' | 'mood' | 'stamina';

export type SlotId = 'morning' | 'afternoon' | 'evening';

export interface Stats {
  money: number;
  hunger: number;
  mood: number;
  stamina: number;
}

export interface ChoiceDef {
  text: string;
  effects?: Partial<Stats>;
  /** Extra stat changes when the flag is already set. */
  effectsIf?: { flag: string; effects: Partial<Stats> }[];
  /** Affinity toward the NPC whose beat this choice belongs to. */
  affinity?: number;
  npcAffinity?: { npcId: string; delta: number }[];
  flagsAdd?: string[];
  endingId?: string;
  result?: string;
}

export interface EventDef {
  id: string;
  title: string;
  text: string;
  choices: ChoiceDef[];
  speaker?: string;
  locationId?: string;
  /** Not part of the random pool and not subject to the repeat cap. */
  uncapped?: boolean;
}

export interface BeatDef extends EventDef {
  minDay: number;
  minAffinity: number;
  /** If the beat is available on this day, it takes the day's story slot. */
  scheduleDay?: number;
  requiresFlag?: string;
}

export interface NpcDef {
  id: string;
  name: string;
  role: string;
  beats: BeatDef[];
}

export type UnlockDef =
  | { type: 'proficiency'; jobId: string; min: number }
  | { type: 'any'; reqs: { jobId: string; min: number }[] };

export interface JobDef {
  id: string;
  name: string;
  locationId: string;
  blurb: string;
  basePay: number;
  /** Proficiency increases by 1 each shift. Pay steps up every this many shifts. */
  stepEvery: number;
  payPerStep: number;
  maxSteps: number;
  effects: Partial<Stats>;
  flagsAdd?: string[];
  unlock?: UnlockDef;
}

export interface ActionDef {
  id: string;
  name: string;
  locationId: string;
  hint: string;
  result: string;
  effects: Partial<Stats>;
  optionKind?: 'job' | 'meal';
  slotBonus?: Partial<Record<SlotId, Partial<Stats>>>;
  slotResult?: Partial<Record<SlotId, string>>;
}

export interface MealDef {
  id: string;
  name: string;
  cost: number;
  hunger: number;
  mood: number;
  stamina?: number;
  blurb: string;
  result: string;
}

export interface LocationDef {
  id: string;
  name: string;
  flavor: string;
}

export type KeyStat =
  | { kind: 'money-left' }
  | { kind: 'money-short' }
  | { kind: 'label'; text: string };

export interface EndingDef {
  id: string;
  name: string;
  text: string;
  keyStat: KeyStat;
  /** Set when this ending is decided by an NPC storyline. */
  npcId?: string;
}

export interface StrollHook {
  npcId: string;
  minBeat: number;
  affinity: number;
  oncePerDay: boolean;
  log?: string;
}
