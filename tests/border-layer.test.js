import test from 'node:test';
import assert from 'node:assert/strict';
import {filterBorderCrossings,renderBorderCrossings,borderOptions,borderDetail} from '../src/border-layer.js';

const records = [
  {id:'one',name:'Тестовый переход',country:'Страна А',region:'Тестовая область',counterpart:'Ёлочная',coordinates:[100,50],description:'Справочная пара станций.',source:{name:'Fictional source',url:'https://source.example.invalid/reference'},evidence:{checkedAt:'2026-11-06',basis:'Fictional published record.'}},
  {id:'two',name:'Другой переход',country:'Страна Б',region:'Иной регион',coordinates:[100,50]},
];

test('crossing search combines country and station or region without mutating the catalogue',()=>{
  assert.deepEqual(filterBorderCrossings(records,{query:'елочная',country:'Страна А'}).map(x=>x.id),['one']);
  assert.deepEqual(filterBorderCrossings(records,{query:'ИНОЙ'}).map(x=>x.id),['two']);
  assert.equal(filterBorderCrossings(records,{query:'елочная',country:'Страна Б'}).length,0);
  assert.equal(records.length,2);
});

test('nearby crossing points stay keyboard accessible and separate at different zoom levels',()=>{
  for(const zoom of [1,4]){
    const html=renderBorderCrossings({crossings:records,projection:()=>[200,300],selectedId:'one',zoom});
    assert.equal((html.match(/data-border-id=/g)||[]).length,2);
    assert.equal((html.match(/tabindex="0"/g)||[]).length,2);
    assert.match(html,/aria-pressed="true"/);
    assert.match(html,/border-leader/);
    assert.doesNotMatch(html,/NaN|Infinity/);
  }
  assert.equal(renderBorderCrossings({crossings:records,projection:()=>[NaN,0],zoom:1}), '');
});

test('crossing cards retain reference limits and escape source text',()=>{
  const item=structuredClone(records[0]);item.name='<img onerror=alert(1)>';
  const html=borderDetail(item,'');
  assert.ok(html.includes('&lt;img'));
  assert.ok(!html.includes('<img onerror'));
  assert.match(html,/не подтверждает текущую работу/);
  assert.match(html,/https:\/\/source\.example\.invalid\/reference/);
  assert.match(borderOptions([]),/Нет переходов по фильтру/);
});
