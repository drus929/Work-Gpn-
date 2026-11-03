import test from 'node:test';
import assert from 'node:assert/strict';
import {plants} from '../src/data.js';
import {incidentRecords, incidentCoverage} from '../src/incident-data.js';
import {validateIncident, assessIncidents, moscowDate} from '../src/incidents.js';

test('published incident records identify catalog plants and pass the evidence threshold', () => {
  assert.equal(new Set(incidentRecords.map(record=>record.id)).size,incidentRecords.length);
  const ids=plants.map(plant=>plant.id);
  for(const record of incidentRecords){
    assert.equal(validateIncident(record,ids).valid,true,record.id);
    const assessment=assessIncidents([record],record.plantId,moscowDate());
    assert.equal(assessment.recent.length+assessment.archive.length,1,record.id);
  }
});

test('unreviewed coverage never claims a completed news survey', () => {
  assert.ok(incidentCoverage.message);
  if(incidentCoverage.state==='unavailable')assert.equal(incidentCoverage.verifiedThrough,null);
  if(incidentCoverage.verifiedThrough)assert.ok(incidentCoverage.verifiedThrough<=moscowDate());
});
