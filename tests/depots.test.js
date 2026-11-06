import test from 'node:test';
import assert from 'node:assert/strict';
import {depots,depotCoverage,validateDepot,storageLabel} from '../src/depots.js';
import {filterDepots,renderDepots,depotOptions,depotPanel,depotDetail} from '../src/depot-layer.js';

const fixture=()=>({id:'fictional-depot',name:'Тестовая нефтебаза',operator:'Тестовый оператор',region:'Тестовая область',locality:'Ёлочный',coordinates:[100.1,50.2],storage:{value:30000,unit:'tonnes',asOf:'Сведения 2020 года'},products:['Дизельное топливо'],description:'Учебная справочная запись.',source:{publisher:'Fictional source',url:'https://source.example.invalid/storage',publishedOn:'2020-06-01',checkedAt:'2026-11-06',basis:'Fictional source explicitly states aggregate tank storage in tonnes.'}});

test('depot catalogue requires source-dated aggregate storage at the accepted threshold',()=>{
  assert.equal(depotCoverage.state,'partial');
  assert.equal(new Set(depots.map(item=>item.id)).size,depots.length);
  for(const item of depots){const result=validateDepot(item);assert.equal(result.valid,true,item.id+': '+result.errors);}
  assert.equal(validateDepot(fixture(),{acceptedUnits:['tonnes']}).valid,true);
  for(const change of [
    r=>r.storage.value=29999,
    r=>r.storage.value=Infinity,
    r=>r.storage.unit='tonnes_per_year',
    r=>r.storage.unit='m3',
    r=>r.coordinates=[100.12345,50.23456],
    r=>r.source.url='javascript:alert(1)',
    r=>r.source.publishedOn='2026-11-07',
    r=>delete r.storage.asOf,
  ]){const item=fixture();change(item);assert.equal(validateDepot(item,{acceptedUnits:['tonnes']}).valid,false);}
  const cubic=fixture();cubic.storage.unit='m3';
  assert.equal(validateDepot(cubic,{acceptedUnits:['tonnes','m3']}).valid,true);
  assert.match(storageLabel(cubic.storage),/30\s000 м³/);
  assert.match(storageLabel(fixture().storage),/30\s000 т$/);
});

test('depot search combines region with names, operator, locality and products',()=>{
  const one=fixture(),two={...fixture(),id:'other',region:'Другая область',locality:'Другой город',operator:'Другой оператор',products:['Бензин']};
  assert.deepEqual(filterDepots([one,two],{query:'елочный',region:'Тестовая область'}).map(x=>x.id),[one.id]);
  assert.deepEqual(filterDepots([one,two],{query:'бензин'}).map(x=>x.id),[two.id]);
  assert.equal(filterDepots([one,two],{query:'елочный',region:'Другая область'}).length,0);
  assert.match(depotOptions([]),/Нет нефтебаз по фильтру/);
  assert.match(depotPanel([],{message:'Нет подходящих записей.'}),/id="depot-select"[^>]*disabled/);
  assert.match(depotPanel([],{message:'Подборка.',acceptedUnits:['tonnes','m3']}),/30 тыс. тонн или 30 тыс. м³/);
});

test('depot map points are separated and keyboard accessible at multiple zoom levels',()=>{
  const records=[fixture(),{...fixture(),id:'other'}];
  for(const zoom of [1,4]){
    const html=renderDepots({depots:records,projection:()=>[200,300],selectedId:records[0].id,zoom});
    assert.equal((html.match(/data-depot-id=/g)||[]).length,2);
    assert.equal((html.match(/tabindex="0"/g)||[]).length,2);
    assert.match(html,/aria-pressed="true"/);
    assert.match(html,/depot-leader/);
    assert.doesNotMatch(html,/NaN|Infinity/);
  }
  assert.equal(renderDepots({depots:records,projection:()=>[NaN,0]}),'');
  const occupied=[[200,300]];
  assert.match(renderDepots({depots:[fixture()],projection:()=>[200,300],occupied}),/depot-leader/);
  assert.deepEqual(occupied,[[200,300]]);
});

test('depot cards retain storage units, source period and escaped content without a fabricated status',()=>{
  const item=fixture();item.name='<img src=x onerror=alert(1)>';item.source.publishedOn=null;
  const html=depotDetail(item,'');
  assert.ok(html.includes('&lt;img'));
  assert.ok(!html.includes('<img src=x'));
  assert.match(html,/Общая вместимость резервуарного парка/);
  assert.match(html,/Сведения 2020 года/);
  assert.match(html,/Дата публикации: не указана/);
  assert.doesNotMatch(html,/report-red|report-yellow|status-badge|млн т \/ год/);
  item.source.url='javascript:alert(1)';
  assert.ok(!depotDetail(item,'').includes('href="javascript:'));
});
