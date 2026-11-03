import {escapeHtml, pipelineScopes} from './pipeline-catalog.js';

export const infrastructureKinds = {
  ports: {title: 'Порты и терминалы', singular: 'Порт / терминал', color: '#69d9f4'},
  oil: {title: 'Нефтепроводы', singular: 'Нефтепровод', color: '#d5a0ff'},
  products: {title: 'Нефтепродуктопроводы', singular: 'Нефтепродуктопровод', color: '#ffcc6e'},
};

export function renderPipelines({pipelines, path, enabled, selected, zoom = 1}) {
  return pipelines.filter(pipeline => enabled[pipeline.kind])
    .sort((a, b) => Number(a.id === selected?.id) - Number(b.id === selected?.id)).map(pipeline => {
    const active = selected?.type === 'pipeline' && selected.id === pipeline.id;
    const d = path(pipeline.geometry);
    const [x, y] = path.centroid(pipeline.geometry);
    const words = pipeline.name.split(' ');
    const lines = [''];
    for (const word of words) {
      if ((lines.at(-1) + ' ' + word).trim().length > 32 && lines.length < 2) lines.push('');
      lines[lines.length - 1] = (lines.at(-1) + ' ' + word).trim();
    }
    const labels = lines.map(line => line.length > 36 ? line.slice(0, 35) + '…' : line);
    const width = Math.max(70, Math.max(...labels.map(label => label.length)) * 6 + 18);
    const height = 22 + (labels.length - 1) * 12;
    // Separate coincident overview routes so crude oil and products remain distinguishable.
    return `<g class="pipeline pipeline-${pipeline.kind} pipeline-${pipeline.scope} ${active ? 'is-selected' : selected?.type === 'pipeline' ? 'is-muted' : ''}" transform="translate(0,${pipeline.kind === 'products' ? 8 / zoom : 0})"
      style="--infra-color:${infrastructureKinds[pipeline.kind].color}" data-infra-id="${pipeline.id}" data-infra-type="pipeline"
      tabindex="0" role="button" aria-label="${infrastructureKinds[pipeline.kind].singular}: ${escapeHtml(pipeline.name)}" aria-pressed="${active}">
      <title>${escapeHtml(pipeline.name)} · ${escapeHtml(pipeline.route)} · схема направления</title>
      <path class="pipeline-casing" d="${d}"/>
      <path class="pipeline-line" d="${d}"/>
      <path class="pipeline-hit" d="${d}"/>
      <g class="pipeline-label" transform="translate(${x},${y - 14 / zoom}) scale(${1 / zoom})" aria-hidden="true">
        <rect x="${-width / 2}" y="${7-height}" width="${width}" height="${height}" rx="4"/>
        <text text-anchor="middle">${labels.map((label,index)=>`<tspan x="0" y="${index*12-(labels.length-1)*12}">${escapeHtml(label)}</tspan>`).join('')}</text>
      </g>
    </g>`;
  }).join('');
}

export function renderPorts({ports, projection, selected, zoom = 1}) {
  const placed = [];
  return ports.map(port => {
    const [x, y] = projection(port.coordinates);
    let dx = 11 / zoom, dy = -13 / zoom;
    for (let radius = 17; radius <= 85; radius += 23) {
      const offset = [-Math.PI / 4, 0, Math.PI / 4, Math.PI / 2, Math.PI, -Math.PI / 2, -3 * Math.PI / 4, 3 * Math.PI / 4]
        .map(angle => [Math.cos(angle) * radius / zoom, Math.sin(angle) * radius / zoom])
        .find(([ox, oy]) => placed.every(([px, py]) => Math.hypot(x + ox - px, y + oy - py) >= 23 / zoom));
      if (offset) { [dx, dy] = offset; break; }
    }
    placed.push([x + dx, y + dy]);
    const active = selected?.type === 'port' && selected.id === port.id;
    return `<g class="infrastructure-marker port-marker ${active ? 'is-selected' : ''}"
      data-infra-id="${port.id}" data-infra-type="port" transform="translate(${x + dx},${y + dy})"
      tabindex="0" role="button" aria-label="Порт / терминал: ${port.name}, ${port.region}" aria-pressed="${active}">
      <title>${port.name} · ${port.cargo.join(', ')}</title>
      <line class="port-leader" x1="${-dx}" y1="${-dy}" x2="0" y2="0" vector-effect="non-scaling-stroke"/>
      <g transform="scale(${1 / zoom})">
      <rect class="port-box" x="-9" y="-9" width="18" height="18" rx="4"/>
      <path class="port-anchor" d="M0-3V6M-6 1C-6 7 6 7 6 1M-3-1H3M-6 1l-1 2M6 1l1 2"/>
      <circle class="port-anchor" cx="0" cy="-5" r="2"/>
      <text class="port-label" x="14" y="4">${port.name}</text>
      </g>
    </g>`;
  }).join('');
}

export function infrastructureDetail(item, type, closeIcon, railDetail = '') {
  const isPort = type === 'port';
  const kind = isPort ? 'ports' : item.kind;
  const evidence = !isPort && item.evidence;
  const sourceDates = evidence && (evidence.sourceDates || (evidence.sourceDate ? [evidence.sourceDate] : []));
  return `<article class="detail-card infrastructure-detail" tabindex="-1" aria-label="${escapeHtml(item.name)}" style="--infra-color:${infrastructureKinds[kind].color}">
    <div class="detail-top"><span class="card-eyebrow">${isPort ? 'ПОРТОВАЯ ИНФРАСТРУКТУРА' : 'ТРУБОПРОВОДНЫЙ ТРАНСПОРТ'}</span><button id="close-infra-detail" aria-label="Закрыть карточку">${closeIcon}</button></div>
    <h2>${escapeHtml(item.name)}</h2>
    <span class="infra-type-badge">${infrastructureKinds[kind].singular}</span>
    ${!isPort?`<span class="infra-scope-badge">${pipelineScopes[item.scope]}</span>`:''}
    <div class="detail-metrics">
      ${isPort ? `<div><small>РЕГИОН</small><strong>${escapeHtml(item.region)}</strong></div><div><small>БАССЕЙН</small><strong>${escapeHtml(item.basin)}</strong></div>` : `<div><small>НАПРАВЛЕНИЕ</small><strong>${escapeHtml(item.route)}</strong></div><div><small>РЕГИОНЫ ОБЗОРА</small><strong>${escapeHtml((item.regions||[]).join(', '))}</strong></div><div><small>НАЗНАЧЕНИЕ</small><strong>${escapeHtml(item.purpose||'Транспортировка по указанному направлению.')}</strong></div>`}
    </div>
    ${isPort ? `<div class="products"><h3>Грузы</h3><div>${item.cargo.map(cargo => `<span>${cargo}</span>`).join('')}</div></div>` : ''}
    <p class="infra-description">${escapeHtml(item.description)}</p>
    ${isPort ? railDetail : ''}
    ${evidence?`<div class="pipeline-evidence ${evidence.status==='documented'?'is-documented':''}"><strong>${evidence.status==='documented'?'Есть подтверждение в опубликованном источнике':'Справочная запись · документ не проверен'}</strong><p>${escapeHtml(evidence.basis||'')}</p>${sourceDates.length?`<small>${sourceDates.length>1?'Даты сведений записей':'Дата сведений записи'}: ${sourceDates.map(escapeHtml).join(', ')}</small>`:''}${evidence.checkedAt?`<small>Источник проверен: ${escapeHtml(evidence.checkedAt)}</small>`:''}</div>`:''}
    <p class="infra-note">${isPort ? 'Положение обзорное; порт может включать несколько терминалов.' : 'Линия показывает общее направление, а не точную трассу.'} Текущая работа и объёмы не подтверждены.</p>
    <a class="detail-source" href="${escapeHtml(item.source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.source.name)} ↗</a>
  </article>`;
}
