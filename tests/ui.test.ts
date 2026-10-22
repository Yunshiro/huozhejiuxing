// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '../src/ui/app';
import { SAVE_STORAGE_KEY } from '../src/game/save';

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
});
