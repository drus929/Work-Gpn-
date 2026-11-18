import test from 'node:test';
import assert from 'node:assert/strict';
import {geoArea, geoContains} from 'd3-geo';
import regions from '../src/data/admin-regions.json' with {type:'json'};

const regionsAt = (point) => regions.features.filter(region => geoContains(region, point)).map(region => region.id);

test('all regional labels fall on their unique Russian region and each polygon has D3 winding', () => {
  assert.equal(regions.features.length, 83);
  assert.equal(new Set(regions.features.map(f => f.id)).size, 83);
  assert.equal(new Set(regions.features.map(f => f.properties.name)).size, 83);
  for (const region of regions.features) {
    assert.match(region.id, /^RU-[A-Z]{2,3}$/);
    assert.match(region.properties.name, /[А-Яа-яЁё]/);
    assert.ok(geoArea(region) > 0 && geoArea(region) < 0.15, region.id);
    assert.deepEqual(regionsAt(region.properties.labelPoint), [region.id], region.properties.name);
  }
});

test('small federal cities, autonomous districts and both sides of the antimeridian retain their identities', () => {
  const points = [
    [[37.62, 55.75], 'RU-MOW'], [[38.2, 56.0], 'RU-MOS'],
    [[65.6, 57.15], 'RU-TYU'], [[68.3, 61.0], 'RU-KHM'], [[66.6, 66.52], 'RU-YAN'],
    [[175, 66], 'RU-CHU'], [[-176, 66.1], 'RU-CHU'],
  ];
  for (const [point, code] of points) assert.deepEqual(regionsAt(point), [code]);
  assert.deepEqual(regionsAt([34.1, 44.95]), []);
});
