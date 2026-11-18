import {escapeHtml} from './pipeline-catalog.js';

// The projection stays fixed as the camera moves. Keep one SVG definition per region.
export function prepareRegions(collection, projection, path) {
  return collection.features.map(feature => {
    const [[left, top], [right, bottom]] = path.bounds(feature);
    return {
      id: feature.id,
      name: feature.properties.name,
      point: projection(feature.properties.labelPoint),
      width: right - left,
      height: bottom - top,
      center: [(left + right) / 2, (top + bottom) / 2],
      d: path(feature),
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

export function regionDefinitions(regions, land) {
  const outlines = regions.map(region =>
    `<path id="boundary-${escapeHtml(region.id)}" d="${region.d}" vector-effect="non-scaling-stroke"/>`
  ).join('');
  return `<clipPath id="region-land-clip"><path d="${land}"/></clipPath>
    <g id="all-region-boundaries">${outlines}</g>`;
}

export function regionOverlay(regions, selectedId, zoom, symbolZoom, labelScale) {
  if (!regions.length) return '';
  const selected = regions.find(region => region.id === selectedId);
  const highlight = selected
    ? `<use class="region-highlight" href="#boundary-${escapeHtml(selected.id)}"/>`
    : '';
  const scale = labelScale / symbolZoom;
  const occupied = [];
  const names = [];
  // Give a chosen region first claim on space, followed by the largest visible shapes.
  const ranked = [...regions].sort((a, b) =>
    Number(b === selected) - Number(a === selected) || b.width * b.height - a.width * a.height
  );
  for (const region of ranked) {
    const [x, y] = region.point;
    const halfWidth = (region.name.length * 2.9 + 5) * scale;
    const halfHeight = 8 * scale;
    if (region !== selected) {
      if (zoom < 2 || region.width < halfWidth * 1.8 || region.height < halfHeight * 3) continue;
      if (occupied.some(box => Math.abs(box.x - x) < box.halfWidth + halfWidth &&
        Math.abs(box.y - y) < box.halfHeight + halfHeight)) continue;
    }
    occupied.push({x, y, halfWidth, halfHeight});
    names.push(`<text class="region-name${region === selected ? ' is-selected' : ''}"
      text-anchor="middle" transform="translate(${x},${y}) scale(${scale})">${escapeHtml(region.name)}</text>`);
  }
  return `<g class="admin-regions" pointer-events="none" aria-hidden="true">
    <g clip-path="url(#region-land-clip)"><use class="region-outlines" href="#all-region-boundaries"/>${highlight}</g>
    ${names.join('')}</g>`;
}
