import {escapeHtml} from './pipeline-catalog.js';

function moscowTime(value) {
  const date = new Date(value);
  return value && Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Moscow', day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit',
  }).format(date) : 'ещё не выполнялся';
}

function sourceLink(item) {
  for (const value of [item.url, item.discoveryUrl]) {
    try {
      const url = new URL(value);
      if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
    } catch { /* Display no link when the collector has no safe URL. */ }
  }
  return null;
}

export function renderIncidentMonitor(monitor, now = new Date()) {
  const labels = {never_run:'Первый запуск ещё не выполнен',complete:'Поиск выполнен',partial:'Часть источников недоступна',failed:'Поиск не выполнен'};
  const status = labels[monitor.status] || labels.never_run;
  const stale = monitor.lastAttemptAt && now.getTime() - new Date(monitor.lastAttemptAt).getTime() > 36 * 60 * 60 * 1000;
  const items = monitor.items || [];
  const counts = monitor.counts || {};
  const availability = {available:'Страница ответила на проверку доступности',blocked:'Чтение ограничено',unavailable:'Страница недоступна',unresolved:'Прямая ссылка не установлена'};
  return `<section class="incident-monitor" aria-label="Ежедневный поиск публикаций"><div class="incident-panel-heading"><div><h2>Ежедневный поиск публикаций</h2><p>Запуск в 09:00 по Москве · автоматическая выборка для редакционной проверки</p></div><a href="https://github.com/drus929/Work-Gpn-/actions/workflows/daily-update.yml" target="_blank" rel="noopener noreferrer">История запусков ↗</a></div><p class="monitor-status" role="status"><strong>${status}${stale?' · данные сбора устарели':''}</strong> · попытка: ${moscowTime(monitor.lastAttemptAt)} (МСК)</p>
    <div class="monitor-counts"><span>Ссылок для проверки: <strong>${Number(counts.eligible) || 0}</strong></span><span>Страниц ответили на проверку: <strong>${Number(counts.available) || 0}</strong> из ${Number(counts.checked) || 0}</span>${monitor.lastSuccessfulRun ? `<span>Последний успешный поиск: ${moscowTime(monitor.lastSuccessfulRun.finishedAt)} (МСК)</span>` : ''}</div>
    <p>Найденные ссылки не проверены редактором и не меняют отметки предприятий. Даты получены из RSS и требуют сверки с публикациями. Нулевой результат или недоступность источников не означают отсутствие происшествий.</p>
    ${items.length ? `<details><summary>Найденные публикации · ${items.length}</summary><ul>${items.slice(0, 12).map(item => {const url = sourceLink(item);return `<li>${url?`<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.publisher || 'Публикация')} ↗</a>`:'Публикация'}<span>${moscowTime(item.publishedAt)} (МСК) · ${availability[item.availability?.status] || 'Доступность не установлена'}</span></li>`}).join('')}</ul>${items.length>12?'<p>Показаны первые 12 ссылок.</p>':''}<a href="https://github.com/drus929/Work-Gpn-/blob/main/src/data/incident-monitor.json" target="_blank" rel="noopener noreferrer">Вся выборка и результаты проверки доступности ↗</a></details>` : ''}
    <a class="monitor-method" href="https://github.com/drus929/Work-Gpn-/blob/main/docs/daily-update.md" target="_blank" rel="noopener noreferrer">Как работает ежедневное обновление ↗</a></section>`;
}
