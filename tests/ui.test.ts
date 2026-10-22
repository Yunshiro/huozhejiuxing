// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { NPCS } from '../src/data/npcs';
import { applyDebug } from '../src/game/debug';
import { createGame } from '../src/game/engine';
import { mount } from '../src/ui/app';
import { encodeSave, SAVE_STORAGE_KEY } from '../src/game/save';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string) {
      map.set(key, String(value));
    },
    removeItem(key: string) {
      map.delete(key);
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
  };
}

function click(act: string): void {
  const node = document.querySelector<HTMLElement>(`[data-act="${act}"]`);
  if (!node) throw new Error(`missing ${act}`);
  node.click();
}

describe('title screen', () => {
  let storage: Storage;

  beforeEach(() => {
    storage = memoryStorage();
    document.body.innerHTML = '<div id="app"></div>';
  });

  it('shows an error for a bad save code and keeps the page usable', () => {
    mount(document.querySelector('#app')!, { storage, search: '', ua: 'tester', seed: () => 1 });
    click('import-open');
    const field = document.querySelector<HTMLTextAreaElement>('[data-field="import"]');
    expect(field).toBeTruthy();
    field!.value = 'this is not a save';
    click('import-go');
    expect(document.body.textContent).toContain('存档码');
    expect(document.querySelector('[data-screen="title"]')).toBeTruthy();
    expect(document.querySelector('[data-act="start"]')).toBeTruthy();
  });

  it('autosaves a new run and restores it', () => {
    mount(document.querySelector('#app')!, { storage, search: '', ua: 'tester', seed: () => 5 });
    click('start');
    expect(storage.getItem(SAVE_STORAGE_KEY)).toBeTruthy();
    expect(document.querySelector('[data-screen="play"]')).toBeTruthy();
    document.body.innerHTML = '<div id="app-2"></div>';
    mount(document.querySelector('#app-2')!, { storage, search: '', ua: 'tester', seed: () => 5 });
    expect(document.querySelector('[data-screen="play"]')).toBeTruthy();
    expect(document.body.textContent).toMatch(/上午|下午|晚上/);
  });

  it('hides the debug panel unless debug=1', () => {
    mount(document.querySelector('#app')!, { storage, search: '', ua: 'tester', seed: () => 1 });
    click('start');
    expect(document.body.textContent).not.toContain('测试模式');
    document.body.innerHTML = '<div id="app-3"></div>';
    mount(document.querySelector('#app-3')!, { storage: memoryStorage(), search: '?debug=1', ua: 'tester', seed: () => 1 });
    click('start');
    expect(document.body.textContent).toContain('测试模式');
  });

  it('keeps the day and debt on one short line', () => {
    mount(document.querySelector('#app')!, { storage, search: '', ua: 'tester', seed: () => 1 });
    click('start');
    expect(document.querySelector('.when')?.textContent).toMatch(/^D\d+ (上午|下午|晚上)$/);
    expect(document.querySelector('.debt')?.textContent).toMatch(/^差 \d+$|^已够$/);
    expect(document.querySelector('.topbar')?.textContent).not.toContain('还差');
  });

  it('tells you when the save code was copied', async () => {
    mount(document.querySelector('#app')!, { storage, search: '', ua: 'tester', seed: () => 1 });
    click('start');
    click('export');
    const clipboard = {
      writeText: async (value: string) => {
        copied = value;
      },
    };
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
    click('copy');
    await flush();
    expect(copied.length).toBeGreaterThan(8);
    expect(document.querySelector('.toast')?.textContent).toBe('已复制。');

    clipboard.writeText = async () => {
      throw new Error('denied');
    };
    click('copy');
    await flush();
    expect(document.querySelector('.toast.bad')?.textContent).toContain('复制没成功');
  });

  it('asks before 上车 ends the run, and keeps that choice first', () => {
    const beat = NPCS.find((npc) => npc.id === 'lin')!.beats[4]!;
    expect(beat.choices[0]?.text).toBe('上车');
    expect(beat.choices[0]?.endingId).toBe('leave_with_lin');
    expect(beat.choices[0]?.confirm).toBeTruthy();
    storage.setItem(SAVE_STORAGE_KEY, linEveningSave());
    mount(document.querySelector('#app')!, { storage, search: '', ua: 'tester', seed: () => 1 });
    const first = document.querySelector<HTMLButtonElement>('[data-act="choice"]');
    expect(first?.textContent).toBe('上车');
    first!.click();
    expect(document.querySelector('[data-screen="play"]')).toBeTruthy();
    expect(document.body.textContent).toContain('这一局就停在这里');
    expect(document.querySelector('[data-act="choice-confirm"]')?.textContent).toBe('上车');
    document.querySelector<HTMLButtonElement>('[data-act="confirm-back"]')!.click();
    expect(document.querySelector('[data-act="choice-confirm"]')).toBeNull();
    expect(document.querySelector<HTMLButtonElement>('[data-act="choice"]')?.textContent).toBe('上车');
    document.querySelector<HTMLButtonElement>('[data-act="choice"]')!.click();
    document.querySelector<HTMLButtonElement>('[data-act="choice-confirm"]')!.click();
    expect(document.querySelector('[data-screen="ending"]')).toBeTruthy();
    expect(document.body.textContent).toContain('末班夜车');
  });
});

let copied = '';

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function linEveningSave(): string {
  const debug = '?debug=1';
  let state = createGame(1);
  const beat = NPCS.find((npc) => npc.id === 'lin')!.beats[4]!;
  const jumped = applyDebug(state, { type: 'jump-day', day: beat.minDay, slot: 'evening', skipContent: true }, debug);
  if (!jumped.ok) throw new Error(jumped.error);
  const progressed = applyDebug(jumped.state, { type: 'set-npc', npcId: 'lin', beat: 4, affinity: beat.minAffinity }, debug);
  if (!progressed.ok) throw new Error(progressed.error);
  const queued = applyDebug(progressed.state, { type: 'queue-npc', npcId: 'lin' }, debug);
  if (!queued.ok) throw new Error(queued.error);
  return encodeSave(queued.state);
}
