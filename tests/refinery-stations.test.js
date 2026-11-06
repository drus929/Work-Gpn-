import test from 'node:test';
import assert from 'node:assert/strict';
import {plants} from '../src/data.js';
import {refineryRailStations,refineryStationInfo,refineryStationSearchText,validateStationInfo} from '../src/refinery-stations.js';
import {renderRefineryStations} from '../src/refinery-station-ui.js';

const fixture=()=>({plantId:'fictional',status:'documented',stations:[{name:'Тестовая станция',role:'Станция отгрузки',sources:[{publisher:'Fictional commercial source',url:'https://source.example.invalid/reference',checkedAt:'2026-11-06',sourceDate:null,basis:'The fictional shipping list explicitly names this plant and station.'}]}],note:'Справочная связь; текущие отправки не проверены.'});

test('each catalogue refinery has one station assessment and published names have explicit sources',()=>{
  assert.equal(new Set(refineryRailStations.map(item=>item.plantId)).size,refineryRailStations.length);
  assert.deepEqual(new Set(refineryRailStations.map(item=>item.plantId)),new Set(plants.map(item=>item.id)));
  for(const plant of plants){
    const item=refineryStationInfo(plant.id);
    assert.ok(item,plant.id);
    const result=validateStationInfo(item,plants.map(p=>p.id));
    assert.equal(result.valid,true,`${plant.id}: ${result.errors}`);
    for(const station of item.stations)assert.ok(refineryStationSearchText(plant.id).includes(station.name));
  }
});

test('invalid evidence cannot turn proximity or unsafe links into a station relationship',()=>{
  for(const change of [
    record=>record.stations[0].sources=[],
    record=>record.stations[0].sources[0].url='javascript:alert(1)',
    record=>record.stations[0].sources[0].checkedAt='2026-13-01',
    record=>record.stations[0].sources[0].sourceDate='2026-11-07',
    record=>record.status='unverified',
    record=>record.stations[0].role='Ближайшая станция',
  ]){
    const record=fixture();change(record);
    assert.equal(validateStationInfo(record,['fictional']).valid,false);
  }
  const documented=fixture();assert.equal(validateStationInfo(documented,['fictional']).valid,true);
});

test('cards show station role, evidence date limits, and an honest unknown assessment',()=>{
  const info=fixture();const html=renderRefineryStations(info);
  assert.match(html,/Тестовая станция/);
  assert.match(html,/Станция отгрузки/);
  assert.match(html,/Дата исходных сведений: не указана/);
  assert.match(html,/06\.11\.2026/);
  info.stations[0].name='<img onerror=alert(1)>';
  assert.ok(!renderRefineryStations(info).includes('<img onerror'));
  assert.ok(renderRefineryStations(info).includes('&lt;img'));
  const unknown=renderRefineryStations({status:'unverified',stations:[],note:'Проверка не завершена.'});
  assert.match(unknown,/пока не подтверждена/);
  assert.doesNotMatch(unknown,/Тестовая станция/);
});


test('commercial references remain visible while permission and destination roles stay explicit',()=>{
  const reference=refineryStationInfo('novok');
  assert.equal(reference.status,'reference');
  assert.match(renderRefineryStations(reference),/Коммерческие справочные сведения/);
  assert.match(renderRefineryStations(reference),/Новокуйбышевская/);
  const permit=refineryStationInfo('tup').stations.find(station=>station.name==='Туапсе-Сортировочная');
  assert.equal(permit.role,'Разрешённое примыкание');
  assert.equal(refineryStationInfo('taif').stations[0].role,'Станция назначения');
});
