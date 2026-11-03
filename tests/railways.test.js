import test from 'node:test';
import assert from 'node:assert/strict';
import { geoArea, geoContains } from 'd3-geo';
import { railways } from '../src/railways.js';
import { plants } from '../src/data.js';

function crosses(a, b, c, d) {
  const side = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
}

test('railway areas cover all catalog names with unique identifiers and colors', () => {
  assert.equal(railways.length, 16);
  assert.equal(new Set(railways.map(r => r.id)).size, railways.length);
  assert.equal(new Set(railways.map(r => r.name)).size, railways.length);
  assert.equal(new Set(railways.map(r => r.color)).size, railways.length);
  for (const name of new Set(plants.map(p => p.rail))) {
    assert.ok(railways.some(r => r.name === name), `Missing area: ${name}`);
  }
});

test('schematic railway polygons are closed, correctly wound, and contain their labels', () => {
  for (const railway of railways) {
    const ring = railway.geometry.coordinates[0];
    assert.deepEqual(ring[0], ring.at(-1), railway.name);
    assert.ok(geoArea(railway.geometry) > 0 && geoArea(railway.geometry) < 1, railway.name);
    assert.ok(geoContains(railway.geometry, railway.label), `Label outside: ${railway.name}`);
    assert.ok(railway.description.includes('Схематичный'), railway.name);
    for (const point of ring) {
      assert.ok(point.length === 2 && point.every(Number.isFinite), railway.name);
      assert.ok(point[0] >= 19 && point[0] <= 180 && point[1] >= 40 && point[1] <= 75, railway.name);
    }
    for (let i = 0; i < ring.length - 1; i++) {
      for (let j = i + 2; j < ring.length - 1; j++) {
        assert.ok(!crosses(ring[i], ring[i + 1], ring[j], ring[j + 1]), `Crossing edges: ${railway.name}`);
      }
    }
  }
});

test('catalog refineries lie inside their schematic railway area', () => {
  for (const plant of plants) {
    const railway = railways.find(r => r.name === plant.rail);
    assert.ok(geoContains(railway.geometry, [plant.lon, plant.lat]), `${plant.name}: ${plant.rail}`);
  }
});
