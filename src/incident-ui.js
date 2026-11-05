import {escapeHtml} from './pipeline-catalog.js';
import {calendarMonthWindow} from './incidents.js';

export const reportLabels = {
  reported_impact: 'Сообщалось о последствиях для работы НПЗ',
  reported_incident: 'Инцидент подтверждён · последствия не подтверждены',
  unknown: 'Недостаточно проверенных сведений',
};

export function displayDate(value) {
  return value ? value.split('-').reverse().join('.') : 'не установлена';
}

export function incidentCoverageLabel(coverage) {
  if (coverage.state === 'partial') return 'Проверка неполная';
  if (coverage.state === 'unavailable') return 'Источники недоступны';
  return coverage.verifiedThrough ? `Проверено по ${displayDate(coverage.verifiedThrough)}` : 'Проверка не завершена';
}

export function renderIncidentPanel(coverage, asOf) {
  const window = calendarMonthWindow(asOf);
  return `<section class="incident-panel" aria-label="Сообщения об инцидентах"><div class="incident-panel-heading"><div><h2>Сообщения за последний месяц</h2><p><span id="incident-window">${displayDate(window.from)} — ${displayDate(window.to)}</span> · даты по Москве</p></div><a href="https://github.com/drus929/Work-Gpn-/blob/main/docs/incident-methodology.md" target="_blank" rel="noopener noreferrer">Правила проверки ↗</a></div>
    <p class="incident-coverage" role="status">${escapeHtml(coverage.message)}${coverage.reportUrl ? ` <a href="${escapeHtml(coverage.reportUrl)}" target="_blank" rel="noopener noreferrer">Отчёт о проверке ↗</a>` : ''}</p>
    <div class="incident-key"><span><i class="incident-dot impact"></i>Сообщалось о последствиях для работы НПЗ</span><span><i class="incident-dot incident"></i>Инцидент без подтверждённых последствий</span><span><i class="incident-dot unknown"></i>Недостаточно сведений за период</span></div>
    <details><summary>Как определяются отметки</summary><p>Для включения события нужны российская и западная публикации с независимыми первоисточниками. Перепечатки одного сообщения не считаются двумя подтверждениями. Красная отметка требует подтверждения последствий обеими сторонами; в остальных подтверждённых случаях используется жёлтая.</p><p>Отметка относится к сообщениям за период и не является оценкой текущей работоспособности. По истечении месяца событие остаётся в истории, а отметка снимается. Восстановление только по возрасту новости не предполагается.</p><p>Это проверяемый редакционный журнал. Новые статьи не загружаются автоматически; период пересчитывается при открытии страницы и смене даты. ${coverage.verifiedThrough?`Публикации проверены по ${displayDate(coverage.verifiedThrough)}.`:'Дата завершённой проверки публикаций не установлена.'}</p></details>
  </section>`;
}

function renderDamageReview(record) {
  if (!record.damageReview) return '';
  const review = record.damageReview;
  return `<details class="incident-analysis"><summary>Повреждения и последствия · ${displayDate(record.reviewedOn)}</summary><dl>${[['damage','Повреждения'],['production','Производственные последствия'],['recovery','Сведения о восстановлении']].map(([key,label])=>`<dt>${label}</dt><dd>${escapeHtml(review[key])}</dd>`).join('')}</dl><p>${escapeHtml(review.limits)}</p></details>`;
}

function renderEvent(record, archived = false) {
  return `<article class="incident-event ${archived?'is-archived':''}"><div class="incident-event-heading"><time datetime="${record.occurredOn}">${displayDate(record.occurredOn)}</time><span>${archived?'Вне месячного окна':record.assessment==='reported_impact'?'Сообщалось о последствиях':'Подтверждённое сообщение'}</span></div><h4>${escapeHtml(record.title)}</h4><p>${escapeHtml(record.summary)}</p>${renderDamageReview(record)}<ul>${record.sources.filter(source=>source.confirmsIncident).map(source=>`<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.publisher)} ↗</a><small>${source.perspective==='russian'?'Российский':'Западный'} источник${source.medium==='social'?` · соцсеть ${escapeHtml(source.platform)}`:''} · ${displayDate(source.publishedOn)}${source.confirmsImpact?' · сообщает о последствиях':''}</small>${source.originNote?`<small>${escapeHtml(source.originNote)}</small>`:''}</li>`).join('')}</ul><small>Проверено: ${displayDate(record.reviewedOn)}</small></article>`;
}

export function renderPlantIncidents(assessment, coverage) {
  return `<section class="plant-incidents" aria-label="История сообщений об инцидентах"><h3>Сообщения и источники</h3><p class="incident-period">Период: ${displayDate(assessment.window.from)} — ${displayDate(assessment.window.to)}</p>
    ${assessment.recent.length ? assessment.recent.map(record=>renderEvent(record)).join('') : `<p class="incident-empty">${coverage.state==='unavailable'?'Новости ещё не проверены. Сведений для оценки нет.':'В реестре нет сообщений за этот период, прошедших проверку по обоим типам источников.'}</p>`}
    ${assessment.archive.length?`<details class="incident-archive"><summary>Ранее месяца · ${assessment.archive.length}</summary><p>Снятие отметки по сроку не подтверждает восстановление.</p>${assessment.archive.map(record=>renderEvent(record,true)).join('')}</details>`:''}
    <p class="incident-current-note">Цвет отражает опубликованные сообщения, а не текущее состояние предприятия.</p>
  </section>`;
}
