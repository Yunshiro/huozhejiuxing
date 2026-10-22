import { JOBS, jobById } from '../data/jobs';
import type { JobDef, Stats } from '../data/schema';
import type { GameState } from './types';

export function jobPay(job: JobDef, proficiency: number): number {
  const steps = Math.min(job.maxSteps, Math.floor(Math.max(0, proficiency) / job.stepEvery));
  return job.basePay + steps * job.payPerStep;
}

export function isJobUnlocked(state: GameState, job: JobDef): boolean {
  if (!job.unlock) return true;
  if (job.unlock.type === 'proficiency') {
    return (state.proficiency[job.unlock.jobId] ?? 0) >= job.unlock.min;
  }
  return job.unlock.reqs.some((req) => (state.proficiency[req.jobId] ?? 0) >= req.min);
}

export function lockText(state: GameState, job: JobDef): string {
  if (!job.unlock || isJobUnlocked(state, job)) return '';
  if (job.unlock.type === 'proficiency') {
    const name = jobById(job.unlock.jobId)?.name ?? '工作';
    const now = state.proficiency[job.unlock.jobId] ?? 0;
    return `未解锁 · ${name}熟练度 ${job.unlock.min}（现在 ${now}）`;
  }
  const parts = job.unlock.reqs.map((req) => {
    const name = jobById(req.jobId)?.name ?? '工作';
    return `${name}熟练度 ${req.min}`;
  });
  return `未解锁 · ${parts.join(' 或 ')}`;
}

export interface JobView {
  id: string;
  name: string;
  blurb: string;
  locationId: string;
  locked: boolean;
  lockText: string;
  pay: number;
  effects: Partial<Stats>;
  proficiency: number;
}

export function listJobs(state: GameState): JobView[] {
  return JOBS.map((job) => {
    const locked = !isJobUnlocked(state, job);
    return {
      id: job.id,
      name: job.name,
      blurb: job.blurb,
      locationId: job.locationId,
      locked,
      lockText: locked ? lockText(state, job) : '',
      pay: jobPay(job, state.proficiency[job.id] ?? 0),
      effects: job.effects,
      proficiency: state.proficiency[job.id] ?? 0,
    };
  });
}
