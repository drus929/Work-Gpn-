import test from 'node:test';
import assert from 'node:assert/strict';
import {renderIncidentMonitor} from '../src/incident-monitor-ui.js';

const monitor={status:'failed',lastAttemptAt:'2026-11-06T06:00:00Z',lastSuccessfulRun:{finishedAt:'2026-11-05T06:00:00Z'},counts:{eligible:0,available:0,checked:0},items:[]};

test('failed daily search shows its failure and separates the previous successful run',()=>{
  const html=renderIncidentMonitor(monitor,new Date('2026-11-08T06:00:00Z'));
  assert.match(html,/Поиск не выполнен/);
  assert.match(html,/данные сбора устарели/);
  assert.match(html,/06\.11\.2026, 09:00/);
  assert.match(html,/Последний успешный поиск: 05\.11\.2026, 09:00/);
  assert.match(html,/не означают отсутствие происшествий/);
});

test('unreviewed candidate links cannot inject markup or claim editorial confirmation',()=>{
  const input={...monitor,status:'complete',items:[{publisher:'<img onerror=alert(1)>',publishedAt:'2026-11-06T05:00:00Z',url:'javascript:alert(1)',discoveryUrl:'https://news.example.invalid/source',availability:{status:'available'}}]};
  const html=renderIncidentMonitor(input,new Date('2026-11-06T08:00:00Z'));
  assert.ok(html.includes('&lt;img'));
  assert.ok(!html.includes('<img onerror'));
  assert.ok(!html.includes('href="javascript:'));
  assert.match(html,/не проверены редактором/);
  assert.match(html,/не меняют отметки предприятий/);
});
