import {geoGraticule10} from 'd3-geo';
import {mesh} from 'topojson-client';

// Project the base once. Its SVG instance follows the camera along with the overlays.
export function mapBaseDefinitions(world, countries, path) {
  const coastline = mesh(world, world.objects.countries, (left, right) => left === right);
  const land = countries.features.map(country => {
    const outline = path(country);
    if (!outline) return '';
    return `<path class="${country.id === '643' ? 'russia' : 'country'}" d="${outline}"/>`;
  }).join('');

  return `
    <linearGradient id="atlas-land-light" gradientUnits="userSpaceOnUse" x1="150" y1="95" x2="1040" y2="560">
      <stop stop-color="#30495a"/>
      <stop offset=".48" stop-color="#253b4c"/>
      <stop offset="1" stop-color="#1c2e40"/>
    </linearGradient>
    <linearGradient id="atlas-neighbor-light" gradientUnits="userSpaceOnUse" x1="150" y1="95" x2="1040" y2="560">
      <stop stop-color="#203241"/>
      <stop offset="1" stop-color="#152333"/>
    </linearGradient>
    <path id="atlas-coast" d="${path(coastline)}" fill="none" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    <g id="atlas-base">
      <path d="${path(geoGraticule10())}" class="graticule"/>
      <use href="#atlas-coast" stroke="#091723" stroke-width="7" opacity=".64"/>
      <use href="#atlas-coast" stroke="#38566a" stroke-width="3" opacity=".75"/>
      ${land}
    </g>`;
}
