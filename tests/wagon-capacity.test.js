import test from 'node:test';
import assert from 'node:assert/strict';
import {ports} from '../src/infrastructure.js';
import {borderCrossings} from '../src/border-crossings.js';
import {wagonCapacityRecords,validateWagonCapacity} from '../src/wagon-capacity.js';
import {renderWagonCapacity,formatWagonCapacity} from '../src/wagon-capacity-ui.js';

const fixture=()=>({kind:'port',objectId:'fictional',status:'documented',checkedAt:'2026-11-06',figures:[{wagonsPerDay:500,upperWagonsPerDay:null,qualifier:'up_to',capacityKind:'design',scopeLevel:'object',scope:'Fictional whole port rail handling',direction:'Направление не уточнено',asOf:'2019 год',unit:'wagons_per_day',valueBasis:'direct_source',source:{publisher:'Fictional source',url:'https://source.example.invalid/capacity',publishedOn:'2019-06-01',checkedAt:'2026-11-06',basis:'Fictional publication explicitly reports capacity in wagons per day.'}}],note:'Справочные сведения; текущая доступная мощность не проверена.'});

test('all ports and border entries have exactly one capacity assessment with safe provenance',()=>{
  const keys=new Set([...ports.map(p=>`port:${p.id}`),...borderCrossings.map(p=>`border:${p.id}`)]);
  assert.deepEqual(new Set(wagonCapacityRecords.map(r=>`${r.kind}:${r.objectId}`)),keys);
  assert.equal(wagonCapacityRecords.length,keys.size);
  for(const record of wagonCapacityRecords){const result=validateWagonCapacity(record,keys);assert.equal(result.valid,true,record.objectId+': '+result.errors);}
});

test('zero, inferred units, observed traffic, missing scope and unsafe sources cannot become capacity values',()=>{
  for(const change of [
    r=>r.figures[0].wagonsPerDay=0,
    r=>r.figures[0].unit='tonnes_per_year',
    r=>r.figures[0].valueBasis='converted_from_trains',
    r=>r.figures[0].capacityKind='observed_volume',
    r=>delete r.figures[0].scopeLevel,
    r=>r.figures[0].source.url='javascript:alert(1)',
    r=>r.figures[0].source.publishedOn='2026-11-07',
    r=>r.figures[0].source.checkedAt='2026-13-01',
    r=>{r.figures[0].qualifier='range';r.figures[0].upperWagonsPerDay=400;},
  ]){const r=fixture();change(r);assert.equal(validateWagonCapacity(r,['port:fictional']).valid,false);}
  assert.equal(validateWagonCapacity(fixture(),['port:fictional']).valid,true);
});

test('terminal components and future plans are not displayed as a whole-object capacity',()=>{
  for(const mode of ['component','planned']){
    const record=fixture();
    if(mode==='component')record.figures[0].scopeLevel='component';else record.figures[0].capacityKind='planned';
    const html=renderWagonCapacity(record);
    assert.match(html,/Единое значение для всего объекта.*не подтверждено/);
    assert.match(html,/Отдельные объекты и планы/);
    assert.ok(html.indexOf('capacity-context')<html.indexOf('wagon-capacity-value'));
    assert.ok(html.indexOf('Fictional whole port rail handling')<html.indexOf('до 500'));
  }
  const html=renderWagonCapacity(fixture());
  assert.doesNotMatch(html,/Единое значение для всего объекта/);
  assert.match(html,/Проектная пропускная способность/);
  assert.ok(html.indexOf('2019 год')<html.indexOf('до 500'));
  const unknown=renderWagonCapacity({status:'unverified',figures:[],note:'Проверка неполная.'});
  assert.match(unknown,/не подтверждено/);
  assert.doesNotMatch(unknown,/0 вагонов/);
});

test('ranges preserve published meaning and capacity evidence is escaped',()=>{
  const record=fixture(),figure=record.figures[0];
  figure.qualifier='range';figure.upperWagonsPerDay=700;
  assert.equal(formatWagonCapacity(figure),'500–700');
  figure.scope='<img src=x onerror=alert(1)>';
  const html=renderWagonCapacity(record);
  assert.ok(html.includes('&lt;img'));
  assert.ok(!html.includes('<img src=x'));
  assert.match(html,/01\.06\.2019/);
  assert.match(html,/06\.11\.2026/);
});
