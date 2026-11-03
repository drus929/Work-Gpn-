import test from 'node:test';
import assert from 'node:assert/strict';
import {moscowDate, calendarMonthWindow, validateIncident, assessIncidents} from '../src/incidents.js';

// Fictional fixtures only. No test record describes an actual refinery or event.
const plantId = 'fictional-test-refinery';
const plantIds = new Set([plantId]);
function incident(overrides = {}) {
  return {
    id: 'fictional-event', plantId, occurredOn: '2026-10-20',
    title: 'Вымышленное сообщение для теста', summary: 'Тестовые данные, не реальное событие.',
    impact: 'reported_disruption', reviewedOn: '2026-10-22',
    sources: [
      {publisher: 'Fictional Russian outlet', url: 'https://russian.example.invalid/story', publishedOn: '2026-10-20', perspective: 'russian', originKey: 'independent-account-a', confirmsIncident: true, confirmsImpact: true},
      {publisher: 'Fictional Western outlet', url: 'https://western.example.invalid/story', publishedOn: '2026-10-21', perspective: 'western', originKey: 'independent-account-b', confirmsIncident: true, confirmsImpact: true},
    ],
    ...overrides,
  };
}

test('journal dates use Moscow midnight and a clamped calendar month, not 30 days', () => {
  assert.equal(moscowDate(new Date('2026-11-03T20:59:59Z')), '2026-11-03');
  assert.equal(moscowDate(new Date('2026-11-03T21:00:00Z')), '2026-11-04');
  assert.deepEqual(calendarMonthWindow('2026-11-03'), {from: '2026-10-03', to: '2026-11-03'});
  assert.deepEqual(calendarMonthWindow('2026-03-31'), {from: '2026-02-28', to: '2026-03-31'});
  assert.deepEqual(calendarMonthWindow('2024-03-31'), {from: '2024-02-29', to: '2024-03-31'});
  assert.deepEqual(calendarMonthWindow('2026-01-31'), {from: '2025-12-31', to: '2026-01-31'});
  for (const invalid of ['2026-02-30', '2026-13-01', '2026-1-1', 'not-a-date']) assert.throws(() => calendarMonthWindow(invalid), RangeError);
});

test('incident validation rejects invalid plants, dates and unsafe source URLs', () => {
  assert.equal(validateIncident(incident(), plantIds).valid, true);
  for (const override of [
    {plantId: 'missing'}, {occurredOn: '2026-02-30'}, {reviewedOn: '2026-10-19'},
    {impact: 'restored'}, {summary: ''}, {sources: []},
  ]) assert.equal(validateIncident(incident(override), plantIds).valid, false);
  for (const url of ['javascript:alert(1)', 'http://russian.example.invalid/story', 'https://user:secret@russian.example.invalid/story']) {
    const record = incident(); record.sources[0].url = url;
    assert.equal(validateIncident(record, plantIds).valid, false);
  }
  const invalidSource = incident(); invalidSource.sources[0].publishedOn = '2026-10-23';
  assert.equal(validateIncident(invalidSource, plantIds).valid, false);
});

test('both perspectives must independently corroborate the incident and its impact', () => {
  assert.equal(assessIncidents([incident()], plantId, '2026-11-03').status, 'reported_impact');
  const onlyRussian = incident(); onlyRussian.sources[1].perspective = 'russian';
  assert.equal(assessIncidents([onlyRussian], plantId, '2026-11-03').status, 'unknown');
  const oneUnconfirmed = incident(); oneUnconfirmed.sources[1].confirmsIncident = false; oneUnconfirmed.sources[1].confirmsImpact = false;
  assert.equal(assessIncidents([oneUnconfirmed], plantId, '2026-11-03').pending.length, 1);
  const impactUnconfirmed = incident(); impactUnconfirmed.sources[1].confirmsImpact = false;
  assert.equal(assessIncidents([impactUnconfirmed], plantId, '2026-11-03').status, 'reported_incident');
  assert.equal(assessIncidents([incident({impact: 'unspecified'})], plantId, '2026-11-03').status, 'reported_incident');
});

test('syndication, duplicate URLs and two labels on one publisher do not count as independent evidence', () => {
  const syndicated = incident(); syndicated.sources[1].originKey = syndicated.sources[0].originKey;
  const samePublisher = incident(); samePublisher.sources[1].publisher = samePublisher.sources[0].publisher;
  const sameHost = incident(); sameHost.sources[1].url = 'https://russian.example.invalid/another-story';
  const duplicate = incident(); duplicate.sources[1].url = duplicate.sources[0].url + '?utm_source=another#section';
  for (const record of [syndicated, samePublisher, sameHost, duplicate]) assert.equal(assessIncidents([record], plantId, '2026-11-03').status, 'unknown');
  assert.equal(validateIncident(duplicate, plantIds).valid, false);
});

test('events at the month boundary remain recent; older events become history without implying recovery', () => {
  const older = incident({id: 'older', occurredOn: '2026-10-02'});
  const boundary = incident({id: 'boundary', occurredOn: '2026-10-03'});
  const result = assessIncidents([older, boundary], plantId, '2026-11-03');
  assert.deepEqual(result.recent.map(record => record.id), ['boundary']);
  assert.deepEqual(result.archive.map(record => record.id), ['older']);
  const expired = assessIncidents([boundary], plantId, '2026-11-04');
  assert.equal(expired.status, 'unknown');
  assert.equal(expired.archive.length, 1);
  assert.equal('restored' in expired, false);
});

test('future incidents and future publications never activate historical map colors', () => {
  const futureEvent = incident({occurredOn: '2026-11-04', reviewedOn: '2026-11-05'});
  futureEvent.sources.forEach(source => source.publishedOn = '2026-11-04');
  const futurePublication = incident({reviewedOn: '2026-11-05'});
  futurePublication.sources[1].publishedOn = '2026-11-04';
  const futureReview = incident({reviewedOn: '2026-11-04'});
  for (const record of [futureEvent, futurePublication, futureReview]) {
    const result = assessIncidents([record], plantId, '2026-11-03');
    assert.equal(result.status, 'unknown');
    assert.ok(result.rejected[0].errors.includes('future_record'));
  }
});

test('a newer incident without impact details does not erase stronger evidence within the month', () => {
  const olderImpact = incident({id: 'older-impact'});
  const newer = incident({id: 'newer-incident', occurredOn: '2026-10-25', reviewedOn: '2026-10-26', impact: 'unspecified'});
  newer.sources.forEach(source => source.publishedOn = '2026-10-25');
  const records = [olderImpact, newer];
  const before = structuredClone(records);
  const result = assessIncidents(records, plantId, '2026-11-03');
  assert.equal(result.status, 'reported_impact');
  assert.deepEqual(result.recent.map(record => record.id), ['newer-incident', 'older-impact']);
  assert.deepEqual(records, before);
});

test('duplicate event identifiers cannot inflate the journal and other plants do not affect a plant assessment', () => {
  const duplicates = assessIncidents([incident(), incident()], plantId, '2026-11-03');
  assert.equal(duplicates.status, 'unknown');
  assert.equal(duplicates.rejected.length, 2);
  const unrelated = assessIncidents([incident({plantId: 'other-fictional-plant'})], plantId, '2026-11-03');
  assert.equal(unrelated.status, 'unknown');
  assert.equal(unrelated.recent.length, 0);
});
