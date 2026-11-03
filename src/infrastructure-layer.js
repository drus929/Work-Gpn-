export const infrastructureKinds = {
  ports: {title: 'Порты и терминалы', singular: 'Порт / терминал', color: '#69d9f4'},
  oil: {title: 'Нефтепроводы', singular: 'Нефтепровод', color: '#d5a0ff'},
  products: {title: 'Нефтепродуктопроводы', singular: 'Нефтепродуктопровод', color: '#ffcc6e'},
};

export function renderPipelines({pipelines, path, enabled, selected}) {
  return pipelines.filter(pipeline => enabled[pipeline.kind]).map(pipeline => {
    const active = selected?.type === 'pipeline' && selected.id === pipeline.id;
    const d = path(pipeline.geometry);
    const [x, y] = path.centroid(pipeline.geometry);
    const width = Math.max(70, pipeline.name.length * 6 + 18);
    // Separate coincident overview routes so crude oil and products remain distinguishable.
    return `<g class="pipeline pipeline-${pipeline.kind} ${active ? 'is-selected' : ''}" transform="translate(0,${pipeline.kind === 'products' ? 8 : 0})"
      style="--infra-color:${infrastructureKinds[pipeline.kind].color}" data-infra-id="${pipeline.id}" data-infra-type="pipeline"
      tabindex="0" role="button" aria-label="${infrastructureKinds[pipeline.kind].singular}: ${pipeline.name}" aria-pressed="${active}">
      <title>${pipeline.name} · ${pipeline.route} · схема направления</title>
      <path class="pipeline-casing" d="${d}"/>
      <path class="pipeline-line" d="${d}"/>
      <path class="pipeline-hit" d="${d}"/>
      <g class="pipeline-label" transform="translate(${x},${y - 14})" aria-hidden="true">
        <rect x="${-width / 2}" y="-15" width="${width}" height="22" rx="4"/>
        <text text-anchor="middle" y="0">${pipeline.name}</text>
      </g>
    </g>`;
  }).join('');
}

export function renderPorts({ports, projection, selected}) {
  const placed = [];
  return ports.map(port => {
    const [x, y] = projection(port.coordinates);
    let dx = 11, dy = -13;
    for (let radius = 17; radius <= 85; radius += 23) {
      const offset = [-Math.PI / 4, 0, Math.PI / 4, Math.PI / 2, Math.PI, -Math.PI / 2, -3 * Math.PI / 4, 3 * Math.PI / 4]
        .map(angle => [Math.cos(angle) * radius, Math.sin(angle) * radius])
        .find(([ox, oy]) => placed.every(([px, py]) => Math.hypot(x + ox - px, y + oy - py) >= 23));
      if (offset) { [dx, dy] = offset; break; }
    }
    placed.push([x + dx, y + dy]);
    const active = selected?.type === 'port' && selected.id === port.id;
    return `<g class="infrastructure-marker port-marker ${active ? 'is-selected' : ''}"
      data-infra-id="${port.id}" data-infra-type="port" transform="translate(${x + dx},${y + dy})"
      tabindex="0" role="button" aria-label="Порт / терминал: ${port.name}, ${port.region}" aria-pressed="${active}">
      <title>${port.name} · ${port.cargo.join(', ')}</title>
      <line class="port-leader" x1="${-dx}" y1="${-dy}" x2="0" y2="0"/>
      <rect class="port-box" x="-9" y="-9" width="18" height="18" rx="4"/>
      <path class="port-anchor" d="M0-3V6M-6 1C-6 7 6 7 6 1M-3-1H3M-6 1l-1 2M6 1l1 2"/>
      <circle class="port-anchor" cx="0" cy="-5" r="2"/>
      <text class="port-label" x="14" y="4">${port.name}</text>
    </g>`;
  }).join('');
}

export function infrastructureDetail(item, type, closeIcon) {
  const isPort = type === 'port';
  const kind = isPort ? 'ports' : item.kind;
  return `<article class="detail-card infrastructure-detail" tabindex="-1" aria-label="${item.name}" style="--infra-color:${infrastructureKinds[kind].color}">
    <div class="detail-top"><span class="card-eyebrow">${isPort ? 'ПОРТОВАЯ ИНФРАСТРУКТУРА' : 'ТРУБОПРОВОДНЫЙ ТРАНСПОРТ'}</span><button id="close-infra-detail" aria-label="Закрыть карточку">${closeIcon}</button></div>
    <h2>${item.name}</h2>
    <span class="infra-type-badge">${infrastructureKinds[kind].singular}</span>
    <div class="detail-metrics">
      ${isPort ? `<div><small>РЕГИОН</small><strong>${item.region}</strong></div><div><small>БАССЕЙН</small><strong>${item.basin}</strong></div>` : `<div><small>ОСНОВНОЕ НАПРАВЛЕНИЕ</small><strong>${item.route}</strong></div>`}
    </div>
    ${isPort ? `<div class="products"><h3>Грузы</h3><div>${item.cargo.map(cargo => `<span>${cargo}</span>`).join('')}</div></div>` : ''}
    <p class="infra-description">${item.description}</p>
    <p class="infra-note">${isPort ? 'Положение обзорное; порт может включать несколько терминалов.' : 'Линия показывает общее направление, а не точную трассу.'} Текущая работа и объёмы не подтверждены.</p>
    <a class="detail-source" href="${item.source.url}" target="_blank" rel="noopener noreferrer">${item.source.name} ↗</a>
  </article>`;
}
