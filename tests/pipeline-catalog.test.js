import test from 'node:test';
import assert from 'node:assert/strict';
import {filterPipelines, summarizePipelines, escapeHtml} from '../src/pipeline-catalog.js';
import {readFileSync} from 'node:fs';
import {pipelines} from '../src/infrastructure.js';
import {regionalPipelines} from '../src/pipeline-regional.js';

const records = [
  {id:'oil',name:'Орёл — Рязань',route:'Орёл — Рязань',regions:['Орловская область'],kind:'oil',scope:'regional',evidence:{status:'documented'}},
  {id:'product',name:'Север',route:'Второво — Приморск',regions:['Ленинградская область'],kind:'products',scope:'system',evidence:{status:'reference'}},
];

test('pipeline search combines name, route and region, including ё/е and multiple terms',()=>{
  assert.deepEqual(filterPipelines(records,{query:'ОРЕЛ орловская'}).map(r=>r.id),['oil']);
  assert.deepEqual(filterPipelines(records,{query:'приморск',scope:'regional'}),[]);
  assert.deepEqual(filterPipelines(records,{query:'Ленинградская',scope:'system'}).map(r=>r.id),['product']);
  assert.equal(filterPipelines(records,{query:'   '}).length,2);
});

test('catalog summaries count records without treating them as network capacity or length',()=>{
  assert.deepEqual(summarizePipelines(records),{total:2,oil:1,products:1,regional:1,documented:1});
  assert.deepEqual(summarizePipelines([]),{total:0,oil:0,products:0,regional:0,documented:0});
});

test('external evidence text is escaped before it enters the interface',()=>{
  assert.equal(escapeHtml('<x a="b">&\''),'&lt;x a=&quot;b&quot;&gt;&amp;&#39;');
});

test('new regional directions retain distinct source evidence without counting parallel lines twice',()=>{
  const proof=JSON.parse(readFileSync(new URL('../docs/pipeline-evidence.json',import.meta.url),'utf8'));
  const sourceIds=[];
  for(const pipeline of regionalPipelines){
    const record=proof.records.find(record=>record.id===pipeline.id);
    assert.ok(record,pipeline.id);
    assert.equal(pipeline.scope,'regional');
    assert.equal(pipeline.evidence.status,'documented');
    assert.deepEqual(pipeline.sourceRecordIds,record.sourceRecords.map(source=>source.ProjectID));
    for(const source of record.sourceRecords){
      assert.equal(source.Status,'operating',pipeline.id);
      assert.equal(source.Fuel,'Oil',pipeline.id);
      assert.match(source.PipelineName,/Oil Pipeline/i);
      assert.ok(pipeline.evidence.sourceDates.includes(source.LastUpdated));
      sourceIds.push(source.ProjectID);
    }
    assert.ok(pipeline.source.url.includes(proof.methodology.snapshotCommit));
    assert.ok(pipeline.regions.length&&pipeline.purpose);
  }
  assert.equal(new Set(sourceIds).size,sourceIds.length);
  assert.equal(sourceIds.length,proof.methodology.selectedSourceRecords);
  for(const pipeline of pipelines){
    assert.ok(['regional','system'].includes(pipeline.scope));
    assert.ok(pipeline.regions.length);
    assert.ok(['reference','documented'].includes(pipeline.evidence.status));
  }
});
