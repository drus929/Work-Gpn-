import {escapeHtml} from './pipeline-catalog.js';
import {capacityKinds} from './wagon-capacity.js';

const number=value=>value.toLocaleString('ru-RU');
const date=value=>value?.split('-').reverse().join('.')||'не указана';

export function formatWagonCapacity(figure){
  const value=number(figure.wagonsPerDay);
  if(figure.qualifier==='range')return `${value}–${number(figure.upperWagonsPerDay)}`;
  return `${({up_to:'до ',about:'около ',at_least:'не менее '})[figure.qualifier]||''}${value}`;
}

function renderFigure(figure){
  return `<article class="wagon-capacity-figure"><p class="capacity-scope">${escapeHtml(figure.scope)}</p><small>Период сведений: ${escapeHtml(figure.asOf)}</small><div class="wagon-capacity-value"><strong>${formatWagonCapacity(figure)}</strong><span>вагонов/сутки</span></div><span class="capacity-kind ${figure.capacityKind==='planned'?'is-planned':''}">${capacityKinds[figure.capacityKind]}</span><small>Направление: ${escapeHtml(figure.direction)}</small><details><summary>Источник и смысл показателя</summary><p>${escapeHtml(figure.source.basis)}</p><a href="${escapeHtml(figure.source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(figure.source.publisher)} ↗</a><small>Дата публикации: ${date(figure.source.publishedOn)} · проверено: ${date(figure.source.checkedAt)}</small></details></article>`;
}

export function renderWagonCapacity(info){
  const figures=info?.status==='documented'?info.figures:[];
  const whole=figures.filter(figure=>figure.scopeLevel==='object'&&figure.capacityKind!=='planned');
  const contextual=figures.filter(figure=>figure.scopeLevel!=='object'||figure.capacityKind==='planned');
  return `<section class="wagon-capacity" aria-label="Железнодорожная пропускная способность"><h3>ЖД пропускная способность</h3>${info?.checkedAt?`<small>Проверка источников: ${date(info.checkedAt)}</small>`:''}${whole.length?whole.map(renderFigure).join(''):'<p class="capacity-missing">Единое значение для всего объекта в вагонах в сутки не подтверждено.</p>'}${contextual.length?`<details class="capacity-context"><summary>Отдельные объекты и планы · ${contextual.length}</summary><p>Показатели ниже относятся к отдельным объектам или планам. Общая пропускная способность ими не установлена.</p>${contextual.map(renderFigure).join('')}</details>`:''}${info?.note?`<p class="capacity-note">${escapeHtml(info.note)}</p>`:''}<a class="capacity-method" href="https://github.com/drus929/Work-Gpn-/blob/main/docs/wagon-capacity.md" target="_blank" rel="noopener noreferrer">Источники и полнота проверки ↗</a></section>`;
}
