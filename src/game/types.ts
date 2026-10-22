import type { SlotId, Stats } from '../data/schema';

export type Phase = 'event' | 'action' | 'jobs' | 'meals' | 'ending';

export interface NpcProgress {
  beat: number;
  affinity: number;
}

export interface ContentRef {
  kind: 'event' | 'npc' | 'fallback';
  id: string;
  npcId?: string;
}

export interface ContentLogEntry {
  day: number;
  id: string;
}

export interface GameState {
  version: 1;
  seed: number;
  rng: number;
  day: number;
  slot: SlotId;
  phase: Phase;
  stats: Stats;
  debt: number;
  proficiency: Record<string, number>;
  npc: Record<string, NpcProgress>;
  flags: string[];
  eventCounts: Record<string, number>;
  contentResolvedToday: boolean;
  planSlot: SlotId;
  pending: ContentRef | null;
  contentLog: ContentLogEntry[];
  locationId: string;
  endingId: string | null;
  banner: string;
  lastDeltas: Partial<Stats>;
  log: string[];
}
