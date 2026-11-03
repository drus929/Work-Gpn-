import {escapeHtml} from './pipeline-catalog.js';

// Projection is fixed; cache this markup instead of reprojecting every vertex on drag.
export function createRailNetworkMarkup(network, path) {
  return `<g class="rail-network" aria-hidden="true">${network.features.map(feature => {
    const d = path(feature);
    return d ? `<path class="rail-route" d="${d}"/>` : '';
  }).join('')}</g>`;
}

export function railAccessGeometry(connection) {
  if (connection?.status !== 'schematic' || connection.nodes.length < 2) return null;
  return {type: 'LineString', coordinates: connection.nodes.map(node => node.coordinates)};
}

export function renderRailAccess({connections, projection, path, selectedPort, zoom = 1}) {
  const ordered = [...connections].sort((a, b) => Number(a.portId === selectedPort) - Number(b.portId === selectedPort));
  return `<g class="rail-access-layer" aria-hidden="true">${ordered.map(connection => {
    const geometry = railAccessGeometry(connection);
    if (!geometry) return '';
    const selected = connection.portId === selectedPort;
    const nodes = connection.nodes.map(node => ({...node, point: projection(node.coordinates)}));
    const occupied = [];
    const labels = selected ? nodes.map((node, index) => {
      const [x, y] = node.point;
      const width = Math.min(235, node.name.length * 5.7 + 16);
      const height = 22;
      let offset = index % 2 ? 14 : -28;
      // Move callouts vertically if adjacent station labels would overlap.
      let box;
      for (let attempt = 0; attempt < 30; attempt++) {
        box = {x: x + 9 / zoom, y: y + offset / zoom, width: width / zoom, height: height / zoom};
        if (!occupied.some(other => box.x < other.x + other.width && box.x + box.width > other.x && box.y < other.y + other.height + 4 / zoom && box.y + box.height + 4 / zoom > other.y)) break;
        offset += 26;
      }
      occupied.push(box);
      const label = node.name.length > 38 ? node.name.slice(0, 37) + '…' : node.name;
      return `<g class="rail-access-node">
        <line x1="${x}" y1="${y}" x2="${box.x}" y2="${box.y + height / zoom / 2}"/>
        <circle cx="${x}" cy="${y}" r="${3 / zoom}"/>
        <g transform="translate(${box.x},${box.y}) scale(${1 / zoom})"><rect width="${width}" height="${height}" rx="4"/><text x="8" y="14.5">${escapeHtml(label)}</text></g>
      </g>`;
    }).join('') : '';
    return `<g class="rail-access ${selected ? 'is-selected' : selectedPort ? 'is-muted' : ''}" data-rail-port="${connection.portId}">
      <path class="rail-access-casing" d="${path(geometry)}"/><path class="rail-access-line" d="${path(geometry)}"/>${labels}
    </g>`;
  }).join('')}</g>`;
}

export function railAccessDetail(connection) {
  if (!connection) return '';
  const drawable = Boolean(railAccessGeometry(connection));
  return `<section class="port-rail-detail"><h3>Железнодорожный подход</h3>
    <span class="rail-access-status ${drawable ? '' : 'is-unconfirmed'}">${drawable ? 'Схема к портовому району' : 'Подключение терминала не подтверждено'}</span>
    <p class="port-rail-road">${escapeHtml(connection.railways.join(' / '))}</p>
    ${drawable ? `<ol>${connection.nodes.map(node => `<li>${escapeHtml(node.name)}</li>`).join('')}</ol>` : ''}
    <p>${escapeHtml(connection.note)}</p>
    ${drawable ? '<button type="button" id="show-port-rail">Показать подход на карте ↗</button>' : ''}
    <a href="${escapeHtml(connection.source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(connection.source.name)} ↗</a>
  </section>`;
}
