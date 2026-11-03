import test from 'node:test';
import assert from 'node:assert/strict';
import {ports, pipelines} from '../src/infrastructure.js';

function checkCoordinate(point, name) {
  assert.ok(Array.isArray(point) && point.length === 2, name);
  assert.ok(point.every(Number.isFinite), name);
  assert.ok(point[0] >= 19 && point[0] <= 180, name);
  assert.ok(point[1] >= 40 && point[1] <= 75, name);
}

test('infrastructure records have distinct identifiers and usable reference sources', () => {
  const records = [...ports, ...pipelines];
  assert.ok(ports.length > 0 && pipelines.length > 0);
  assert.equal(new Set(records.map(item => item.id)).size, records.length);
  for (const item of records) {
    assert.ok(item.id && item.name && item.description && item.source.name, item.id);
    const url = new URL(item.source.url);
    assert.equal(url.protocol, 'https:', item.id);
    assert.ok(url.hostname.includes('.'), item.id);
    assert.equal(url.username, '', item.id);
    assert.equal(url.password, '', item.id);
  }
});

test('port markers have valid regional and cargo classifications', () => {
  const allowedCargo = new Set(['Нефть', 'Нефтепродукты']);
  const allowedBasins = new Set(['Балтийский', 'Азово-Черноморский', 'Арктический', 'Дальневосточный']);
  for (const port of ports) {
    checkCoordinate(port.coordinates, port.id);
    assert.ok(port.region && allowedBasins.has(port.basin), port.id);
    assert.ok(port.cargo.length > 0 && port.cargo.every(cargo => allowedCargo.has(cargo)), port.id);
    assert.equal(new Set(port.cargo).size, port.cargo.length, port.id);
  }
});

test('oil and product layers have valid schematic lines without duplicate consecutive points', () => {
  assert.deepEqual(new Set(pipelines.map(item => item.kind)), new Set(['oil', 'products']));
  for (const pipeline of pipelines) {
    assert.equal(pipeline.geometry.type, 'LineString', pipeline.id);
    assert.ok(pipeline.geometry.coordinates.length >= 2, pipeline.id);
    assert.ok(pipeline.route.includes('—'), pipeline.id);
    assert.match(pipeline.description, /[Аа]вторская/, pipeline.id);
    assert.match(pipeline.description, /схема/, pipeline.id);
    pipeline.geometry.coordinates.forEach((coordinate, index, points) => {
      checkCoordinate(coordinate, pipeline.id);
      if (index) assert.notDeepEqual(coordinate, points[index - 1], pipeline.id);
    });
  }
});
