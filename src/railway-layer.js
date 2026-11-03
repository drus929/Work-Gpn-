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
const overlaps = (a, b) => a.x < b.x + b.width + 5 && a.x + a.width + 5 > b.x
  && a.y < b.y + b.height + 5 && a.y + a.height + 5 > b.y;

export function renderRailwayLabels({railways, projection, activeRailway, plants, showPlantLabels, selected}) {
  const occupied = plants.map(plant => {
    const [x, y] = projection([plant.lon, plant.lat]);
    const named = showPlantLabels && (namedPlants.includes(plant.id) || selected === plant.id);
    return {x: x - 9, y: y - 10, width: named ? plant.name.length * 5 + 15 : 18, height: 22};
  });
  return `<g class="railway-labels">${railways.map(rail => {
    const [x, y] = projection(rail.label);
    const width = rail.name.length * 5.5 + 18;
    const height = 22;
    let box;
    // Place nearby labels without covering markers or other railway names.
    for (let radius = 0; radius <= 160 && !box; radius += 20) {
      for (const angle of [0, Math.PI, -Math.PI / 2, Math.PI / 2, -Math.PI / 4, -3 * Math.PI / 4, Math.PI / 4, 3 * Math.PI / 4]) {
        const candidate = {
          x: Math.max(10, Math.min(1190 - width, x - width / 2 + Math.cos(angle) * radius)),
          y: Math.max(55, Math.min(650, y - height / 2 + Math.sin(angle) * radius)),
          width, height,
        };
        if (!occupied.some(other => overlaps(candidate, other))) { box = candidate; break; }
      }
    }
    box ||= {x: x - width / 2, y: y - height / 2, width, height};
    occupied.push(box);
    const muted = activeRailway && activeRailway !== rail.name;
    return `<g class="railway-label ${muted ? 'is-muted' : ''} ${activeRailway === rail.name ? 'is-selected' : ''}"
      data-railway="${rail.name}" style="--rail-color:${rail.color}" tabindex="0" role="button"
      aria-label="${rail.name} железная дорога: показать НПЗ" aria-pressed="${activeRailway === rail.name}">
      <line x1="${x}" y1="${y}" x2="${box.x + width / 2}" y2="${box.y + height / 2}"/>
      <circle cx="${x}" cy="${y}" r="2"/>
      <rect x="${box.x}" y="${box.y}" width="${width}" height="${height}" rx="4"/>
      <text x="${box.x + width / 2}" y="${box.y + 14.5}" text-anchor="middle">${rail.name}</text>
    </g>`;
  }).join('')}</g>`;
}
