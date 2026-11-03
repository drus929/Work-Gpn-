// The polygons illustrate service areas; clipping keeps their fill on Russian land.
export function renderRailwayAreas({railways, path, russia, activeRailway}) {
  return `<defs><clipPath id="railway-land-clip"><path d="${path(russia)}"/></clipPath></defs>
    <g class="railway-areas" clip-path="url(#railway-land-clip)">
      ${[...railways].sort((a, b) => Number(a.name === activeRailway) - Number(b.name === activeRailway)).map(rail => `<path class="railway-zone ${rail.name === activeRailway ? 'is-selected' : activeRailway ? 'is-muted' : ''}"
        data-railway="${rail.name}" style="--rail-color:${rail.color}" d="${path(rail.geometry)}">
        <title>${rail.name} железная дорога — схематичный район обслуживания</title>
      </path>`).join('')}
    </g>`;
}

const namedPlants = ['omsk', 'kirishi', 'perm', 'ang', 'khab', 'ach', 'volg', 'norsi', 'moscow', 'tan'];
const overlaps = (a, b, gap) => a.x < b.x + b.width + gap && a.x + a.width + gap > b.x
  && a.y < b.y + b.height + gap && a.y + a.height + gap > b.y;

export function renderRailwayLabels({railways, projection, activeRailway, plants, showPlantLabels, selected, zoom = 1}) {
  const inverseZoom = 1 / (Number.isFinite(zoom) && zoom > 0 ? zoom : 1);
  const occupied = plants.map(plant => {
    const [x, y] = projection([plant.lon, plant.lat]);
    const active = selected === plant.id;
    const named = showPlantLabels && (namedPlants.includes(plant.id) || active);
    const left = active ? 18 : 9;
    const top = named && plant.id === 'tan' ? 24 : active ? 18 : 10;
    const right = named
      ? Math.max(12 + plant.name.replace(' НПЗ', '').length * 5.5, active ? 12 + (plant.region || '').length * 4.5 : 0)
      : left;
    const bottom = active && named ? 24 : active ? 18 : 12;
    return {
      x: x - left * inverseZoom,
      y: y - top * inverseZoom,
      width: (left + right) * inverseZoom,
      height: (top + bottom) * inverseZoom,
    };
  });
  return `<g class="railway-labels">${railways.map(rail => {
    const [x, y] = projection(rail.label);
    const labelWidth = rail.name.length * 5.5 + 18;
    const labelHeight = 22;
    const width = labelWidth * inverseZoom;
    const height = labelHeight * inverseZoom;
    let box;
    // Place nearby labels without covering markers or other railway names.
    for (let radius = 0; radius <= 160 && !box; radius += 20) {
      for (const angle of [0, Math.PI, -Math.PI / 2, Math.PI / 2, -Math.PI / 4, -3 * Math.PI / 4, Math.PI / 4, 3 * Math.PI / 4]) {
        const candidate = {
          x: Math.max(10 * inverseZoom, Math.min(1200 - 10 * inverseZoom - width, x - width / 2 + Math.cos(angle) * radius * inverseZoom)),
          y: Math.max(55 * inverseZoom, Math.min(672 - height, y - height / 2 + Math.sin(angle) * radius * inverseZoom)),
          width, height,
        };
        if (!occupied.some(other => overlaps(candidate, other, 5 * inverseZoom))) { box = candidate; break; }
      }
    }
    box ||= {x: x - width / 2, y: y - height / 2, width, height};
    occupied.push(box);
    const muted = activeRailway && activeRailway !== rail.name;
    return `<g class="railway-label ${muted ? 'is-muted' : ''} ${activeRailway === rail.name ? 'is-selected' : ''}"
      data-railway="${rail.name}" style="--rail-color:${rail.color}" tabindex="0" role="button"
      aria-label="${rail.name} железная дорога: показать НПЗ" aria-pressed="${activeRailway === rail.name}">
      <line x1="${x}" y1="${y}" x2="${box.x + width / 2}" y2="${box.y + height / 2}" vector-effect="non-scaling-stroke"/>
      <circle cx="${x}" cy="${y}" r="${2 * inverseZoom}"/>
      <g transform="translate(${box.x},${box.y}) scale(${inverseZoom})">
        <rect width="${labelWidth}" height="${labelHeight}" rx="4"/>
        <text x="${labelWidth / 2}" y="14.5" text-anchor="middle">${rail.name}</text>
      </g>
    </g>`;
  }).join('')}</g>`;
}
