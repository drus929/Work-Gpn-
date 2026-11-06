import test from 'node:test';
import assert from 'node:assert/strict';
import {borderCrossings,catalogueCoverage} from '../src/border-crossings.js';

test('border catalogue keeps source-era evidence separate from operating status and approximate map points',()=>{
  assert.equal(catalogueCoverage.state,'partial');
  assert.ok(borderCrossings.length>=20);
  assert.equal(new Set(borderCrossings.map(x=>x.id)).size,borderCrossings.length);
  assert.ok(new Set(borderCrossings.map(x=>x.country)).size>=10);
  for(const item of borderCrossings){
    assert.equal(item.operatingStatus,'unverified',item.id);
    assert.ok(['station-pair','railway-connection'].includes(item.kind),item.id);
    assert.ok(item.name&&item.counterpart&&item.region&&item.coordinateAnchor,item.id);
    assert.equal(new URL(item.source.url).protocol,'https:',item.id);
    assert.ok(item.evidence.basis&&item.evidence.sourceDateMeaning,item.id);
    assert.match(item.evidence.sourceDate,/^\d{4}-\d{2}-\d{2}$/);
    assert.ok(item.evidence.sourceDate<=item.evidence.checkedAt,item.id);
    const [lon,lat]=item.coordinates;
    assert.ok(lon>=19&&lon<=180&&lat>=40&&lat<=75,item.id);
    for(const value of item.coordinates)assert.ok(Math.abs(value*10-Math.round(value*10))<1e-8,item.id);
  }
  const stationPairs=borderCrossings.filter(item=>item.kind==='station-pair');
  assert.ok(stationPairs.every(item=>item.evidence.sourceDate==='2019-10-11'));
});

test('Petropavlovsk is one Kazakhstan transfer-station reference with an explicit identity limit',()=>{
  const item=borderCrossings.find(item=>item.id==='rail-petropavlovsk');
  assert.ok(item);
  assert.match(item.region,/Казахстан/);
  assert.match(item.displayKind,/Передаточная станция/);
  assert.match(item.description,/одна передаточная станция/);
  assert.match(item.description,/не подтверждение юридического/);
  assert.deepEqual(item.coordinates,[69.2,54.9]);
});
