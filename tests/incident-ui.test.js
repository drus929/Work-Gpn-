import test from 'node:test';
import assert from 'node:assert/strict';
import {incidentCoverage, incidentRecords} from '../src/incident-data.js';
import {assessIncidents} from '../src/incidents.js';
import {incidentCoverageLabel, renderIncidentPanel, renderPlantIncidents} from '../src/incident-ui.js';

test('partial coverage shows the fixed research period without claiming a completed survey', () => {
  assert.equal(incidentCoverageLabel(incidentCoverage), 'Проверка неполная');
  const panel = renderIncidentPanel(incidentCoverage, '2026-11-04');
  assert.match(panel, /04\.10\.2026 — 04\.11\.2026/);
  assert.match(panel, /03\.10–03\.11\.2026/);
  assert.match(panel, /Дата завершённой проверки публикаций не установлена/);
  assert.match(panel, /Отчёт о проверке/);
  assert.doesNotMatch(panel, /Публикации проверены по/);
});

test('Ryazan keeps the one-sided production report without marking independently confirmed impact', () => {
  const records = incidentRecords.filter(record => record.plantId === 'ryazan');
  const assessment = assessIncidents(records, 'ryazan', '2026-11-03');
  assert.equal(assessment.status, 'reported_incident');
  assert.ok(assessment.recent[0].sources.some(source => source.confirmsImpact));
  assert.ok(assessment.recent[0].sources.filter(source => source.perspective === 'russian').every(source => !source.confirmsImpact));
  const rendered = renderPlantIncidents(assessment, incidentCoverage);
  assert.match(rendered, /Два отраслевых источника Reuters/);
  assert.match(rendered, /16\.10\.2026/);
  const expired = assessIncidents(records, 'ryazan', '2026-11-16');
  assert.equal(expired.status, 'unknown');
  assert.equal(expired.archive.length, 1);
  assert.match(renderPlantIncidents(expired, incidentCoverage), /Снятие отметки по сроку не подтверждает восстановление/);
});
