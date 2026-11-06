import {escapeHtml} from './pipeline-catalog.js';
import {storageLabel} from './depots.js';

const normalized = value => String(value || '').toLocaleLowerCase('ru-RU').replaceAll('ё','е');
const date = value => escapeHtml(value ? value.split('-').reverse().join('.') : 'не указана');
const methodUrl = 'https://github.com/drus929/Work-Gpn-/blob/main/docs/oil-depots.md';
const safeUrl = value => {
  try { const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password?value:'#'; } catch { return '#'; }
};

export function filterDepots(records, {query = '',region = ''} = {}) {
  const needle = normalized(query).trim();
  return records.filter(item => (!region || item.region === region)
    && (!needle || normalized([item.name,item.operator,item.region,item.locality,...item.products].join(' ')).includes(needle)));
}

export function renderDepots({depots,projection,selectedId,zoom = 1,occupied = []}) {
  if (!Number.isFinite(zoom) || zoom <= 0) return '';
  const placed = occupied.filter(point=>Array.isArray(point)&&point.length===2&&point.every(Number.isFinite));
  return depots.map(item => {
    const point = projection(item.coordinates);
    if (!point?.every(Number.isFinite)) return '';
    const [x,y] = point;
    let offset = [0,0];
    for (const radius of [0,21,39,57]) {
      const candidate = [0,Math.PI/2,Math.PI,-Math.PI/2,Math.PI/4,-Math.PI/4]
        .map(angle => [Math.cos(angle)*radius/zoom,Math.sin(angle)*radius/zoom])
        .find(([dx,dy]) => placed.every(([px,py]) => Math.hypot(x+dx-px,y+dy-py) >= 20/zoom));
      if (candidate) { offset=candidate;break; }
    }
    const [dx,dy] = offset;
    placed.push([x+dx,y+dy]);
    const active = selectedId === item.id;
    return `<g class="depot-marker ${active?'is-selected':''}" data-depot-id="${escapeHtml(item.id)}" transform="translate(${x+dx},${y+dy})" tabindex="0" role="button" aria-pressed="${active}" aria-label="Нефтебаза: ${escapeHtml(item.name)}, ${escapeHtml(item.region)}">
      <title>${escapeHtml(item.name)} · резервуарный парк ${escapeHtml(storageLabel(item.storage))}</title>
      ${dx||dy?`<line class="depot-leader" x1="${-dx}" y1="${-dy}" x2="0" y2="0" vector-effect="non-scaling-stroke"/>`:''}
      <g transform="scale(${1/zoom})"><circle class="depot-symbol" r="10"/><path class="depot-tank" d="M-5-4V4C-5 7 5 7 5 4V-4M-5-4C-5-7 5-7 5-4S-5-1-5-4Z"/>
      ${active?`<text class="depot-label" x="15" y="4">${escapeHtml(item.name)}</text>`:''}</g></g>`;
  }).join('');
}

export function depotOptions(records) {
  return `<option value="">${records.length?'Выбрать нефтебазу и приблизить':'Нет нефтебаз по фильтру'}</option>${records.map(item=>`<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} · ${escapeHtml(storageLabel(item.storage))}</option>`).join('')}`;
}

export function depotPanel(records,coverage) {
  const regions = [...new Set(records.map(item=>item.region))].sort((a,b)=>a.localeCompare(b,'ru'));
  const threshold = (coverage.acceptedUnits || ['tonnes']).map(unit=>unit==='m3'?'30 тыс. м³':'30 тыс. тонн').join(' или ');
  return `<section class="depot-panel" aria-label="Нефтебазы"><div class="railway-key-heading"><div><h2>Нефтебазы</h2><p>${escapeHtml(coverage.message)} Выберите объект для просмотра карточки.</p></div><label class="depot-layer-switch"><input type="checkbox" data-depot-toggle> Показать на карте</label></div>
    <div class="depot-tools"><label><span>Поиск</span><input id="depot-search" type="search" placeholder="Нефтебаза, компания или населённый пункт" aria-label="Поиск нефтебаз"></label><label><span>Регион</span><select id="depot-region" aria-label="Регион нефтебазы"><option value="">Все регионы</option>${regions.map(region=>`<option>${escapeHtml(region)}</option>`).join('')}</select></label><label><span>Нефтебазы по фильтру</span><select id="depot-select" aria-label="Выбрать нефтебазу" ${records.length?'':'disabled'}>${depotOptions(records)}</select></label></div>
    <div class="depot-summary"><span id="depot-count" aria-live="polite">${records.length} из ${records.length} нефтебаз</span><span>Вместимость от ${threshold} · исходные единицы</span><a href="${methodUrl}" target="_blank" rel="noopener noreferrer">Источники и полнота проверки ↗</a></div></section>`;
}

export function depotDetail(item,closeIcon) {
  return `<article class="detail-card infrastructure-detail depot-detail" tabindex="-1" aria-label="${escapeHtml(item.name)}"><div class="detail-top"><span class="card-eyebrow">ПАСПОРТ НЕФТЕБАЗЫ</span><button id="close-depot-detail" aria-label="Закрыть карточку нефтебазы">${closeIcon}</button></div><h2>${escapeHtml(item.name)}</h2><span class="infra-type-badge">Справочные сведения о хранении</span>
    <div class="detail-metrics"><div><small>КОМПАНИЯ / ОПЕРАТОР В ИСТОЧНИКЕ</small><strong>${escapeHtml(item.operator)}</strong></div><div><small>РЕГИОН</small><strong>${escapeHtml(item.region)}</strong></div><div><small>НАСЕЛЁННЫЙ ПУНКТ</small><strong>${escapeHtml(item.locality)}</strong></div></div>
    <section class="depot-storage"><h3>Общая вместимость резервуарного парка</h3><p>${escapeHtml(item.storage.asOf)}</p><strong>${escapeHtml(storageLabel(item.storage))}</strong><small>Опубликованная характеристика хранения</small></section>
    ${item.products.length?`<div class="products"><h3>Нефтепродукты в источнике</h3><div>${item.products.map(product=>`<span>${escapeHtml(product)}</span>`).join('')}</div></div>`:''}
    <p class="infra-description">${escapeHtml(item.description)}</p><div class="depot-evidence"><strong>Источник и основание включения</strong><p>${escapeHtml(item.source.basis)}</p><a href="${escapeHtml(safeUrl(item.source.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.source.publisher)} ↗</a><small>Дата публикации: ${date(item.source.publishedOn)} · проверено: ${date(item.source.checkedAt)}</small></div>
    <p class="infra-note">Обзорная привязка к населённому пункту. Сведения о вместимости не устанавливают текущие запасы или состояние нефтебазы.</p><a class="detail-source" href="${methodUrl}" target="_blank" rel="noopener noreferrer">Источники и полнота проверки ↗</a></article>`;
}
