import { BALANCE } from '../data/balance';
import { locationById } from '../data/locations';
import { META } from '../data/meta';
import { NPCS } from '../data/npcs';
import { beatAvailability, contentView } from '../game/content';
import { applyDebug, isDebugMode } from '../game/debug';
import {
  actionViews,
  backToActions,
  chooseAction,
  chooseEvent,
  createGame,
  displayLocationId,
  mealViews,
  SLOT_LABEL,
} from '../game/engine';
import { listJobs } from '../game/jobs';
import { randomSeed } from '../game/rng';
import { decodeSave, encodeSave, readLocal, writeLocal } from '../game/save';
import { buildShareCard, isMobile, isWeChat, sharePlan } from '../game/share';
import { deliverImage, renderShareBlob } from '../game/share-canvas';
import { formatDeltas, isLowStat, STAT_KEYS, STAT_LABEL } from '../game/stats';
import type { GameState } from '../game/types';
import type { StatKey } from '../data/schema';

export interface MountEnv {
  search?: string;
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  ua?: string;
  seed?: () => number;
}

export function mount(root: HTMLElement, env: MountEnv = {}): void {
  const storage = env.storage ?? localStorage;
  const search = env.search ?? window.location.search;
  const ua = env.ua ?? navigator.userAgent;
  const debug = isDebugMode(search);
  const loaded = readLocal(storage);

  let game: GameState | null = loaded.ok ? loaded.state : null;
  let atTitle = !game;
  let importOpen = !loaded.ok;
  let importError = loaded.ok ? '' : loaded.error;
  let saveOpen = false;
  let saveCode = '';
  let confirmNew = false;
  let saveWarning = '';
  let debugError = '';
  let shareUrl = '';
  let shareBlob: Blob | null = null;
  let shareKey = '';
  let shareNote = '';
  let renderingShare = false;

  const view = document.createElement('div');
  root.replaceChildren(view);
  root.addEventListener('click', (event) => {
    void onClick(event);
  });

  render();
  void ensureShare();

  function nextSeed(): number {
    return (env.seed ?? randomSeed)() >>> 0;
  }

  function persist(next: GameState | null): void {
    const ok = writeLocal(storage, next);
    saveWarning = ok ? '' : '这台浏览器没能写入本地存档，记得自己导出存档码。';
  }

  function resetShare(): void {
    if (shareUrl) URL.revokeObjectURL(shareUrl);
    shareUrl = '';
    shareBlob = null;
    shareKey = '';
    shareNote = '';
  }

  function setGame(next: GameState | null): void {
    game = next;
    persist(next);
    render();
    void ensureShare();
  }

  async function ensureShare(): Promise<void> {
    if (!game?.endingId || atTitle) return;
    const card = buildShareCard(game);
    if (!card) return;
    const key = `${card.endingName}|${card.days}|${card.keyStat}|${card.watermark}`;
    if (key === shareKey || renderingShare) return;
    renderingShare = true;
    try {
      const blob = await renderShareBlob(card);
      if (shareUrl) URL.revokeObjectURL(shareUrl);
      shareBlob = blob;
      shareUrl = URL.createObjectURL(blob);
      shareKey = key;
      shareNote = '';
    } catch {
      shareNote = '分享图没能生成，可以刷新后再看这一局。';
    } finally {
      renderingShare = false;
      render();
    }
  }

  function render(): void {
    const screen = !game || atTitle ? 'title' : game.endingId ? 'ending' : 'play';
    const pressured =
      screen === 'play' &&
      !!game &&
      (isLowStat(game.stats.hunger) || isLowStat(game.stats.mood) || isLowStat(game.stats.stamina));
    view.innerHTML = `<div class="shell${pressured ? ' alert' : ''}" data-screen="${screen}">${
      screen === 'title' ? titleScreen() : screen === 'ending' ? endingScreen() : playScreen()
    }${debug && game && !atTitle ? debugPanel() : ''}</div>`;
  }

  function titleScreen(): string {
    const debt = META.debt.toLocaleString('zh-CN');
    return `<header class="title-block">
      <p class="eyebrow">三十天 · 一笔债</p>
      <h1>${esc(META.title)}</h1>
      <p class="lead">手头要在第 ${META.maxDays} 天结束时攒够 ${esc(debt)} 元。饥饿、心情、体力有一项归零，这一局就停。</p>
    </header>
    <figure class="scene" data-slot="evening">
      <img src="${sceneSrc('street')}" alt="街道">
      <div class="slot-shade"></div>
      <figcaption>城市不打招呼</figcaption>
    </figure>
    <div class="stack">
      ${game ? `<button class="primary" data-act="continue">继续上一局</button>` : ''}
      <button class="primary" data-act="${game ? 'new' : 'start'}">${game ? (confirmNew ? '确定放弃存档，重开？' : '放弃存档重开') : '开始'}</button>
      <button data-act="import-open">${importOpen ? '收起存档码' : '导入存档码'}</button>
    </div>
    ${importOpen ? importBox() : ''}
    ${importError ? `<p class="error" role="alert">${esc(importError)}</p>` : ''}
    <details class="plain">
      <summary>怎么玩</summary>
      <ul>
        <li>一天三个时段，每个时段做一件事。</li>
        <li>打工会累，同一份活做熟了，钱会变多，也能解锁新工作。</li>
        <li>吃饭、休息、洗澡、睡觉，用来把人留住。</li>
        <li>进度存在这台设备上。换浏览器可以用存档码。</li>
      </ul>
    </details>
    <p class="fine">不注册，不联网。关掉页面也会从上次的时段接着过。</p>`;
  }

  function playScreen(): string {
    if (!game) return '';
    const loc = locationById(displayLocationId(game));
    return `${topBar()}
    <div class="play-grid">
      <div>
        ${statBlock()}
        <figure class="scene" data-slot="${game.slot}">
          <img src="${sceneSrc(loc.id)}" alt="${esc(loc.name)}">
          <div class="slot-shade"></div>
          <figcaption>${esc(loc.name)}</figcaption>
        </figure>
        <p class="flavor">${esc(loc.flavor)}</p>
      </div>
      <div class="play-side">
        ${game.banner ? `<p class="banner">${esc(game.banner)}</p>` : ''}
        ${historyHtml()}
        ${phaseBody()}
        <p class="fine">每个时段结束还会掉：饥饿 ${BALANCE.decay.hunger}，心情 ${BALANCE.decay.mood}，体力 ${BALANCE.decay.stamina}</p>
        ${menuHtml()}
        ${saveWarning ? `<p class="error" role="alert">${esc(saveWarning)}</p>` : ''}
      </div>
    </div>`;
  }

  function endingScreen(): string {
    if (!game?.endingId) return '';
    const card = buildShareCard(game);
    if (!card) return '';
    const plan = sharePlan(ua, false);
    const wechat = isWeChat(ua);
    const hint = wechat
      ? '长按图片保存到相册'
      : isMobile(ua)
        ? '如果按钮没反应，长按图片保存'
        : '';
    return `<header class="title-block ending-head">
      <p class="eyebrow">这一局</p>
      <h1 class="ending-name">${esc(card.endingName)}</h1>
      <p class="lead">坚持了 ${card.days} 天 · ${esc(card.keyStat)}</p>
    </header>
    ${hint ? `<p class="share-hint">${esc(hint)}</p>` : ''}
    ${
      shareUrl
        ? `<img class="share-img" id="share-img" alt="${esc(card.endingName)}，坚持了 ${card.days} 天" src="${shareUrl}">`
        : `<p class="muted">${esc(shareNote || '正在生成分享图…')}</p>`
    }
    <p class="story">${esc(card.text)}</p>
    <div class="end-stats">${STAT_KEYS.map((key) => `<span class="${key !== 'money' && isLowStat(game!.stats[key]) ? 'low' : ''}">${STAT_LABEL[key]} ${game!.stats[key]}</span>`).join('')}</div>
    <div class="stack">
      ${wechat ? '' : `<button class="primary" data-act="save-image" ${shareBlob ? '' : 'disabled'}>${plan === 'share' ? '保存到相册' : '下载图片'}</button>`}
      <button data-act="retry">再来一局</button>
      <button data-act="title">回到标题</button>
    </div>
    ${shareNote && shareUrl ? `<p class="fine">${esc(shareNote)}</p>` : ''}
    ${menuHtml()}`;
  }

  function topBar(): string {
    if (!game) return '';
    const gap = Math.max(0, game.debt - game.stats.money);
    return `<header class="topbar">
      <div>
        <strong>${esc(META.title)}</strong>
        <span>第 ${game.day} / ${META.maxDays} 天 · ${SLOT_LABEL[game.slot]}</span>
      </div>
      <div class="debt">${game.stats.money >= game.debt ? '钱已经够还' : `还差 ${gap} 元`}</div>
    </header>`;
  }

  function statBlock(): string {
    if (!game) return '';
    return `<div class="stats">${STAT_KEYS.map((key) => statRow(key)).join('')}</div>`;
  }

  function statRow(key: StatKey): string {
    if (!game) return '';
    const value = game.stats[key];
    const low = key !== 'money' && isLowStat(value);
    const width = key === 'money' ? Math.min(100, Math.round((value / Math.max(1, game.debt)) * 100)) : value;
    const delta = game.lastDeltas[key];
    const deltaHtml =
      delta ? `<em class="delta ${delta > 0 ? 'up' : 'down'}">${delta > 0 ? '+' : ''}${delta}</em>` : '';
    return `<div class="stat${low ? ' low' : ''}">
      <div class="stat-top"><span>${STAT_LABEL[key]}</span><span class="stat-num">${value}${deltaHtml}</span></div>
      <div class="bar" role="presentation"><span style="width:${width}%"></span></div>
    </div>`;
  }

  function historyHtml(): string {
    if (!game) return '';
    const older = game.log.slice(1, 3);
    if (!older.length) return '';
    return `<ul class="log">${older.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>`;
  }

  function phaseBody(): string {
    if (!game) return '';
    if (game.phase === 'event') return eventCard();
    if (game.phase === 'jobs') return jobList();
    if (game.phase === 'meals') return mealList();
    return actionList();
  }

  function eventCard(): string {
    if (!game) return '';
    const viewModel = contentView(game);
    if (!viewModel) return `<p class="error">这段内容读不出来。</p>`;
    const who = viewModel.speaker ? `<p class="speaker">${esc(viewModel.speaker)}</p>` : '';
    return `<section class="event">
      ${who}
      <h2>${esc(viewModel.title)}</h2>
      <p class="event-text">${esc(viewModel.text)}</p>
      <div class="stack">${viewModel.choices
        .map(
          (choice) =>
            `<button data-act="choice" data-index="${choice.index}" ${choice.disabled ? 'disabled' : ''}>${esc(choice.text)}${choice.disabled ? ' · 钱不够' : ''}</button>`,
        )
        .join('')}</div>
    </section>`;
  }

  function actionList(): string {
    if (!game) return '';
    return `<div class="actions">${actionViews(game)
      .map(
        (action) =>
          `<button data-act="action" data-id="${esc(action.id)}" ${action.disabled ? 'disabled' : ''}><strong>${esc(action.name)}</strong><span>${esc(action.hint)}</span></button>`,
      )
      .join('')}</div>`;
  }

  function jobList(): string {
    if (!game) return '';
    return `<div class="stack">${listJobs(game)
      .map((job) => {
        const costs = formatDeltas(job.effects);
        const sub = job.locked ? job.lockText : `本时段 ${job.pay} 元 · 熟练 ${job.proficiency}${costs ? ` · ${costs}` : ''}`;
        return `<button data-act="job" data-id="${esc(job.id)}" ${job.locked ? 'disabled' : ''}><strong>${esc(job.name)}</strong><span>${esc(sub)}</span><span>${esc(job.blurb)}</span></button>`;
      })
      .join('')}<button data-act="back">返回</button></div>`;
  }

  function mealList(): string {
    if (!game) return '';
    return `<div class="stack">${mealViews(game)
      .map(
        (meal) =>
          `<button data-act="meal" data-id="${esc(meal.id)}" ${meal.disabled ? 'disabled' : ''}><strong>${esc(meal.name)} · ${meal.cost} 元</strong><span>${meal.disabled ? '钱不够' : `饥饿 +${meal.hunger} · 心情 +${meal.mood}`}</span><span>${esc(meal.blurb)}</span></button>`,
      )
      .join('')}<button data-act="back">返回</button></div>`;
  }

  function menuHtml(): string {
    return `<details class="menu plain"${saveOpen || importOpen ? ' open' : ''}>
      <summary>菜单</summary>
      <div class="stack">
        <button data-act="export">导出存档码</button>
        <button data-act="import-open">导入存档码</button>
        <button data-act="title">回到标题</button>
      </div>
      ${saveOpen ? `<label class="field">存档码<textarea data-field="export" readonly rows="4">${esc(saveCode)}</textarea></label><button data-act="copy">复制</button>` : ''}
      ${importOpen ? importBox() : ''}
      ${importError ? `<p class="error" role="alert">${esc(importError)}</p>` : ''}
    </details>`;
  }

  function importBox(): string {
    return `<label class="field">把存档码贴在这里<textarea data-field="import" rows="4" placeholder="HZ1...."></textarea></label>
      <button data-act="import-go">确认导入</button>`;
  }

  function debugPanel(): string {
    if (!game) return '';
    const lines = NPCS.map((npc) => {
      const progress = game!.npc[npc.id];
      const availability = beatAvailability(game!, npc.id);
      return `<li><span>${esc(npc.name)} 好感 ${progress?.affinity ?? 0} · ${progress?.beat ?? 0}/${npc.beats.length}</span><span>${esc(availability.reason)}</span>${
        availability.ok ? `<button data-act="debug-npc" data-id="${esc(npc.id)}">触发</button>` : ''
      }</li>`;
    }).join('');
    return `<details class="debug plain">
      <summary>测试模式</summary>
      ${debugError ? `<p class="error">${esc(debugError)}</p>` : ''}
      <p class="fine">种子 ${game.seed}</p>
      <label class="field">跳到第几天<input data-field="day" type="number" min="1" max="${META.maxDays}" value="${game.day}"></label>
      <button data-act="debug-jump">跳转</button>
      <div class="debug-stats">
        ${STAT_KEYS.map((key) => `<label class="field">${STAT_LABEL[key]}<input data-field="${key}" type="number" value="${game!.stats[key]}"></label>`).join('')}
      </div>
      <button data-act="debug-stats">改数值</button>
      <label class="field">用这个种子重开<input data-field="seed" type="number" value="${game.seed}"></label>
      <button data-act="debug-seed">重开</button>
      <ul class="npc-debug">${lines}</ul>
    </details>`;
  }

  async function onClick(event: Event): Promise<void> {
    const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-act]');
    if (!target || !view.contains(target)) return;
    const act = target.dataset.act;
    if (act === 'start') {
      resetShare();
      atTitle = false;
      confirmNew = false;
      setGame(createGame(nextSeed()));
      return;
    }
    if (act === 'continue') {
      atTitle = false;
      confirmNew = false;
      render();
      void ensureShare();
      return;
    }
    if (act === 'new') {
      if (!confirmNew) {
        confirmNew = true;
        render();
        return;
      }
      resetShare();
      atTitle = false;
      confirmNew = false;
      setGame(createGame(nextSeed()));
      return;
    }
    if (act === 'title') {
      atTitle = true;
      confirmNew = false;
      render();
      return;
    }
    if (act === 'retry') {
      resetShare();
      atTitle = false;
      setGame(createGame(nextSeed()));
      return;
    }
    if (act === 'import-open') {
      importOpen = !importOpen;
      render();
      return;
    }
    if (act === 'import-go') {
      const code = (view.querySelector('[data-field="import"]') as HTMLTextAreaElement | null)?.value ?? '';
      const decoded = decodeSave(code);
      if (!decoded.ok) {
        importError = decoded.error;
        importOpen = true;
        render();
        return;
      }
      importError = '';
      importOpen = false;
      atTitle = false;
      resetShare();
      setGame(decoded.state);
      return;
    }
    if (act === 'export' && game) {
      saveCode = encodeSave(game);
      saveOpen = true;
      render();
      return;
    }
    if (act === 'copy') {
      const code = (view.querySelector('[data-field="export"]') as HTMLTextAreaElement | null)?.value ?? saveCode;
      try {
        await navigator.clipboard.writeText(code);
        shareNote = '已复制。';
      } catch {
        importError = '';
        shareNote = '复制没成功，可以手动选中存档码。';
      }
      render();
      return;
    }
    if (act === 'save-image' && shareBlob) {
      const result = await deliverImage(shareBlob, ua);
      shareNote =
        result === 'shared' ? '已交给系统分享。' : result === 'downloaded' ? '已开始下载。' : result === 'cancelled' ? '已取消。' : '';
      render();
      return;
    }
    if (!game) return;
    if (act === 'action') {
      setGame(chooseAction(game, target.dataset.id ?? ''));
      return;
    }
    if (act === 'job') {
      setGame(chooseAction(game, 'work', target.dataset.id));
      return;
    }
    if (act === 'meal') {
      setGame(chooseAction(game, 'eat', target.dataset.id));
      return;
    }
    if (act === 'back') {
      setGame(backToActions(game));
      return;
    }
    if (act === 'choice') {
      setGame(chooseEvent(game, Number(target.dataset.index)));
      return;
    }
    if (!debug) return;
    if (act === 'debug-jump') {
      const day = Number((view.querySelector('[data-field="day"]') as HTMLInputElement | null)?.value);
      const result = applyDebug(game, { type: 'jump-day', day, slot: 'morning' }, search);
      debugError = result.ok ? '' : result.error;
      if (result.ok) setGame(result.state);
      else render();
      return;
    }
    if (act === 'debug-stats') {
      const read = (field: StatKey) => Number((view.querySelector(`[data-field="${field}"]`) as HTMLInputElement | null)?.value);
      const result = applyDebug(
        game,
        { type: 'set-stats', stats: { money: read('money'), hunger: read('hunger'), mood: read('mood'), stamina: read('stamina') } },
        search,
      );
      debugError = result.ok ? '' : result.error;
      if (result.ok) {
        resetShare();
        setGame(result.state);
      } else render();
      return;
    }
    if (act === 'debug-seed') {
      const seed = Number((view.querySelector('[data-field="seed"]') as HTMLInputElement | null)?.value);
      const result = applyDebug(game, { type: 'new-seed', seed: Number.isFinite(seed) ? seed : 1 }, search);
      debugError = result.ok ? '' : result.error;
      if (result.ok) {
        resetShare();
        atTitle = false;
        setGame(result.state);
      }
      return;
    }
    if (act === 'debug-npc') {
      const result = applyDebug(game, { type: 'queue-npc', npcId: target.dataset.id ?? '' }, search);
      debugError = result.ok ? '' : result.error;
      if (result.ok) setGame(result.state);
      else render();
    }
  }
}

function sceneSrc(id: string): string {
  return `${import.meta.env.BASE_URL}scenes/${id}.svg`;
}

function esc(value: string | number): string {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[char] ?? char;
  });
}
