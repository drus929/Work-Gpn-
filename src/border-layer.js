import {wagonCapacityFor} from './wagon-capacity.js';
import {renderWagonCapacity} from './wagon-capacity-ui.js';
import {escapeHtml} from './pipeline-catalog.js';

const normalized = value => String(value || '').toLocaleLowerCase('ru-RU').replaceAll('ё', 'е');

export function filterBorderCrossings(records, {query = '', country = ''} = {}) {
  const needle = normalized(query).trim();
  return records.filter(item => (!country || item.country === country)
    && (!needle || normalized([item.name, item.counterpart, item.country, item.region].filter(Boolean).join(' ')).includes(needle)));
}

export function renderBorderCrossings({crossings, projection, selectedId, zoom = 1}) {
  const placed = [];
  return crossings.map(item => {
    const point = projection(item.coordinates);
    if (!point?.every(Number.isFinite)) return '';
    const [x, y] = point;
    let offset = [0, 0];
    for (const radius of [0, 19, 35, 51]) {
      const candidate = [0, Math.PI / 2, Math.PI, -Math.PI / 2, Math.PI / 4, -Math.PI / 4]
        .map(angle => [Math.cos(angle) * radius / zoom, Math.sin(angle) * radius / zoom])
        .find(([dx, dy]) => placed.every(([px, py]) => Math.hypot(x + dx - px, y + dy - py) >= 18 / zoom));
      if (candidate) { offset = candidate; break; }
    }
    const [dx, dy] = offset;
    placed.push([x + dx, y + dy]);
    const active = selectedId === item.id;
    return `<g class="border-marker ${active ? 'is-selected' : ''}" data-border-id="${escapeHtml(item.id)}" transform="translate(${x + dx},${y + dy})" tabindex="0" role="button" aria-pressed="${active}" aria-label="ЖД пограничное сообщение: ${escapeHtml(item.name)}, ${escapeHtml(item.country)}">
      <title>${escapeHtml(item.name)} · ${escapeHtml(item.country)} · режим работы не проверен</title>
      ${dx || dy ? `<line class="border-leader" x1="${-dx}" y1="${-dy}" x2="0" y2="0" vector-effect="non-scaling-stroke"/>` : ''}
      <g transform="scale(${1 / zoom})"><rect class="border-symbol" x="-9" y="-9" width="18" height="18" rx="3"/><path class="border-rail" d="M-4-6V6M4-6V6M-4-3H4M-4 1H4M-4 5H4"/>
      ${active ? `<text class="border-label" x="14" y="4">${escapeHtml(item.name)}</text>` : ''}</g>
    </g>`;
  }).join('');
}

export function borderOptions(records) {
  return `<option value="">${records.length ? 'Выбрать переход и приблизить' : 'Нет переходов по фильтру'}</option>${records.map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} · ${escapeHtml(item.country)}</option>`).join('')}`;
}

export function borderPanel(records, coverage) {
  const countries = [...new Set(records.map(item => item.country))].sort((a,b) => a.localeCompare(b, 'ru'));
  return `<section class="border-panel" aria-label="Железнодорожные пограничные переходы"><div class="railway-key-heading"><div><h2>Железнодорожные погранпереходы</h2><p>${escapeHtml(coverage.message)} Выберите переход, чтобы открыть карточку и приблизить карту.</p></div><label class="border-layer-switch"><input type="checkbox" data-border-toggle checked> Показать на карте</label></div>
    <div class="border-tools"><label><span>Поиск</span><input id="border-search" type="search" placeholder="Переход, станция или регион" aria-label="Поиск железнодорожных погранпереходов"></label><label><span>Соседняя страна</span><select id="border-country" aria-label="Страна железнодорожного погранперехода"><option value="">Все страны</option>${countries.map(country => `<option>${escapeHtml(country)}</option>`).join('')}</select></label><label><span>Переходы по фильтру</span><select id="border-select" aria-label="Выбрать железнодорожный погранпереход">${borderOptions(records)}</select></label></div>
    <div class="border-summary"><span id="border-count" aria-live="polite">${records.length} из ${records.length} переходов</span><span>Обзорные точки · текущая работа не проверена</span><a href="https://github.com/drus929/Work-Gpn-/blob/main/docs/border-crossings.md" target="_blank" rel="noopener noreferrer">Аналитика и источники ↗</a></div></section>`;
}

export function borderDetail(item, closeIcon) {
  return `<article class="detail-card infrastructure-detail border-detail" tabindex="-1" aria-label="${escapeHtml(item.name)}"><div class="detail-top"><span class="card-eyebrow">${item.kind==='station-pair'?'ПОГРАНИЧНАЯ ПАРА СТАНЦИЙ':'ЖД ПОГРАНИЧНОЕ СООБЩЕНИЕ'}</span><button id="close-border-detail" aria-label="Закрыть карточку погранперехода">${closeIcon}</button></div><h2>${escapeHtml(item.name)}</h2><span class="infra-type-badge">${escapeHtml(item.displayKind||(item.kind==='station-pair'?'Пара станций из справочника':'Железнодорожное сообщение'))}</span><div class="detail-metrics"><div><small>СОСЕДНЯЯ СТРАНА</small><strong>${escapeHtml(item.country)}</strong></div><div><small>РЕГИОН / ОБЛАСТЬ</small><strong>${escapeHtml(item.region)}</strong></div>${item.counterpart ? `<div><small>${escapeHtml(item.counterpartLabel||'СОПРЕДЕЛЬНАЯ СТОРОНА')}</small><strong>${escapeHtml(item.counterpart)}</strong></div>` : ''}</div><p class="infra-description">${escapeHtml(item.description)}</p>${renderWagonCapacity(wagonCapacityFor('border',item.id))}<div class="pipeline-evidence is-documented"><strong>Сведения из опубликованного источника</strong><p>${escapeHtml(item.evidence.basis)}</p><small>Источник проверен: ${escapeHtml(item.evidence.checkedAt)}</small>${item.evidence.sourceDate ? `<small>${escapeHtml(item.evidence.sourceDateMeaning||'Дата источника')}: ${escapeHtml(item.evidence.sourceDate)}</small>` : ''}</div><p class="infra-note">Точка обозначает район станции или населённого пункта, а не точное место контроля. Опубликованная пара станций не подтверждает текущую работу, пропуск грузов или пассажиров.</p><a class="detail-source" href="${escapeHtml(item.source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.source.name)} ↗</a></article>`;
}
