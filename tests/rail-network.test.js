import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ports} from '../src/infrastructure.js';
import {railways} from '../src/railways.js';
import {portRailConnections} from '../src/rail-connections.js';

const network = JSON.parse(readFileSync(new URL('../src/data/rail-network.json', import.meta.url), 'utf8'));

function checkCoordinate(coordinate, label) {
  assert.equal(coordinate.length, 2, label);
  assert.ok(coordinate.every(Number.isFinite), label);
  assert.ok(coordinate[0] >= -180 && coordinate[0] <= 180, label);
  assert.ok(coordinate[1] >= -90 && coordinate[1] <= 90, label);
}

function checkSource(source, label) {
  assert.ok(source.name, label);
  const url = new URL(source.url);
  assert.equal(url.protocol, 'https:', label);
  assert.equal(url.username, '', label);
  assert.equal(url.password, '', label);
}

test('detailed railway geometry contains valid land rail segments and preserves source accounting', () => {
  assert.equal(network.type, 'FeatureCollection');
  assert.ok(network.features.length > 0);
  assert.equal(new Set(network.features.map(feature => feature.id)).size, network.features.length);
  const sourceIds = new Set();
  let segments = 0;
  let vertices = 0;
  for (const feature of network.features) {
    assert.equal(feature.type, 'Feature');
    assert.equal(feature.geometry.type, 'MultiLineString');
    assert.equal(feature.properties.sourceClass, 'Railroad', 'Ferry routes must not appear as land railways');
    assert.equal(feature.properties.sourceIds.length, feature.geometry.coordinates.length);
    for (const sourceId of feature.properties.sourceIds) sourceIds.add(sourceId);
    for (const coordinates of feature.geometry.coordinates) {
      assert.ok(coordinates.length >= 2, feature.id);
      for (let index = 0; index < coordinates.length; index++) {
        const coordinate = coordinates[index];
        checkCoordinate(coordinate, feature.id);
        assert.ok(coordinate[0] >= network.bbox[0] && coordinate[0] <= network.bbox[2], feature.id);
        assert.ok(coordinate[1] >= network.bbox[1] && coordinate[1] <= network.bbox[3], feature.id);
        if (index) assert.notDeepEqual(coordinate, coordinates[index - 1], `Zero-length segment: ${feature.id}`);
      }
      segments++;
      vertices += coordinates.length;
    }
  }
  assert.ok(segments > 5 && vertices > 100, 'The detailed layer must not regress to the previous five schematic routes');
  assert.equal(segments, network.metadata.segments);
  assert.equal(vertices, network.metadata.vertices);
  assert.equal(sourceIds.size, network.metadata.selectedSourceFeatures);
  assert.ok(sourceIds.size <= network.metadata.sourceFeatures);
});

test('railway source retains immutable provenance and attribution', () => {
  const metadata = network.metadata;
  assert.match(metadata.sourceCommit, /^[a-f0-9]{40}$/);
  assert.match(metadata.sourceSha256, /^[a-f0-9]{64}$/);
  assert.ok(metadata.sourceUrl.includes(`/blob/${metadata.sourceCommit}/`));
  assert.equal(new URL(metadata.sourceUrl).protocol, 'https:');
  assert.ok(metadata.sourceVersion && metadata.license && metadata.licenseUrl);
  assert.ok(metadata.excludedClasses.includes('Railroad ferry'));
  assert.ok(metadata.coverage);
});

test('every port has one rail-access assessment and unconfirmed terminals receive no invented connection', () => {
  assert.deepEqual(new Set(portRailConnections.map(connection => connection.portId)), new Set(ports.map(port => port.id)));
  assert.equal(new Set(portRailConnections.map(connection => connection.portId)).size, portRailConnections.length);
  const unconfirmedPorts = new Set(['primorsk', 'kozmino', 'de-kastri', 'prigorodnoye']);
  for (const connection of portRailConnections) {
    assert.ok(['schematic', 'unconfirmed', 'no-direct-rail'].includes(connection.status), connection.portId);
    assert.ok(connection.name && connection.note, connection.portId);
    checkSource(connection.source, connection.portId);
    if (connection.status !== 'schematic') {
      assert.deepEqual(connection.nodes, [], connection.portId);
    }
    if (unconfirmedPorts.has(connection.portId)) {
      assert.notEqual(connection.status, 'schematic', `No verified rail approach for ${connection.portId}`);
      assert.deepEqual(connection.nodes, [], connection.portId);
    }
  }
});

test('schematic port approaches use named railway nodes and end at the correct port district', () => {
  const railwayNames = new Set(railways.map(railway => railway.name));
  const approaches = portRailConnections.filter(connection => connection.status === 'schematic');
  assert.ok(approaches.length > 0);
  for (const connection of approaches) {
    const port = ports.find(port => port.id === connection.portId);
    assert.ok(connection.railways.length > 0, port.id);
    assert.ok(connection.railways.every(name => railwayNames.has(name)), port.id);
    assert.ok(connection.nodes.length >= 2, port.id);
    for (const node of connection.nodes) {
      assert.ok(node.name, port.id);
      checkCoordinate(node.coordinates, `${port.id}: ${node.name}`);
    }
    assert.ok(new Set(connection.nodes.map(node => JSON.stringify(node.coordinates))).size > 1, port.id);
    assert.deepEqual(connection.nodes.at(-1).coordinates, port.coordinates, port.id);
  }
});
