// Retrospective news assessments, separate from a refinery's operating status.
// Dates in the journal are calendar dates in Europe/Moscow.
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const nonempty = value => typeof value === 'string' && value.trim().length > 0;

function parseDate(value) {
  if (!ISO_DATE.test(value || '')) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

export function moscowDate(now = new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new RangeError('Invalid date');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = type => parts.find(part => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function calendarMonthWindow(asOfISO = moscowDate()) {
  const end = parseDate(asOfISO);
  if (!end) throw new RangeError('Expected a valid ISO calendar date');
  const start = new Date(end);
  const day = start.getUTCDate();
  start.setUTCDate(1);
  start.setUTCMonth(start.getUTCMonth() - 1);
  const lastDay = new Date(start);
  lastDay.setUTCMonth(lastDay.getUTCMonth() + 1);
  lastDay.setUTCDate(0);
  start.setUTCDate(Math.min(day, lastDay.getUTCDate()));
  return {from: start.toISOString().slice(0, 10), to: asOfISO};
}

function sourceIdentity(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:' || url.username || url.password || !url.hostname) return null;
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_/i.test(key) || /^(fbclid|gclid)$/i.test(key)) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    return {url: url.href, host: url.hostname.toLowerCase().replace(/^www\./, '')};
  } catch {
    return null;
  }
}

export function validateIncident(record, plantIds) {
  const errors = [];
  if (!record || typeof record !== 'object' || Array.isArray(record)) return {valid: false, errors: ['record_required']};
  const ids = plantIds instanceof Set ? plantIds : new Set(plantIds || []);
  for (const key of ['id', 'plantId', 'title', 'summary']) if (!nonempty(record[key])) errors.push(`${key}_required`);
  if (!ids.has(record.plantId)) errors.push('unknown_plant');
  if (!parseDate(record.occurredOn)) errors.push('invalid_occurredOn');
  if (!parseDate(record.reviewedOn)) errors.push('invalid_reviewedOn');
  if (!['reported_disruption', 'unspecified'].includes(record.impact)) errors.push('invalid_impact');
  if (parseDate(record.occurredOn) && parseDate(record.reviewedOn) && record.reviewedOn < record.occurredOn) errors.push('review_before_incident');
  if (!Array.isArray(record.sources) || !record.sources.length) errors.push('sources_required');
  const urls = new Set();
  for (const [index, source] of (Array.isArray(record.sources) ? record.sources : []).entries()) {
    const prefix = `source_${index}_`;
    if (!source || typeof source !== 'object' || Array.isArray(source)) { errors.push(prefix + 'required'); continue; }
    for (const key of ['publisher', 'originKey']) if (!nonempty(source[key])) errors.push(prefix + key + '_required');
    const identity = sourceIdentity(source.url);
    if (!identity) errors.push(prefix + 'invalid_url');
    else if (urls.has(identity.url)) errors.push(prefix + 'duplicate_url');
    else urls.add(identity.url);
    if (!['russian', 'western'].includes(source.perspective)) errors.push(prefix + 'invalid_perspective');
    if (typeof source.confirmsIncident !== 'boolean') errors.push(prefix + 'incident_confirmation_required');
    if (typeof source.confirmsImpact !== 'boolean') errors.push(prefix + 'impact_confirmation_required');
    if (source.confirmsImpact && !source.confirmsIncident) errors.push(prefix + 'impact_without_incident');
    if (!parseDate(source.publishedOn)) errors.push(prefix + 'invalid_publishedOn');
    else {
      if (parseDate(record.occurredOn) && source.publishedOn < record.occurredOn) errors.push(prefix + 'published_before_incident');
      if (parseDate(record.reviewedOn) && source.publishedOn > record.reviewedOn) errors.push(prefix + 'published_after_review');
    }
  }
  return {valid: errors.length === 0, errors};
}

// Two outlets repeating one original account are not independent corroboration.
function corroborated(sources, field) {
  const relevant = sources.filter(source => source.confirmsIncident && source[field]);
  return relevant.some(left => relevant.some(right =>
    left.perspective !== right.perspective
    && left.originKey.trim().toLowerCase() !== right.originKey.trim().toLowerCase()
    && left.publisher.trim().toLowerCase() !== right.publisher.trim().toLowerCase()
    && sourceIdentity(left.url).host !== sourceIdentity(right.url).host
    && sourceIdentity(left.url).url !== sourceIdentity(right.url).url));
}

export function assessIncidents(records, plantId, asOfISO = moscowDate()) {
  if (!Array.isArray(records)) throw new TypeError('Incident records must be an array');
  const window = calendarMonthWindow(asOfISO);
  const result = {status: 'unknown', window, recent: [], archive: [], pending: [], rejected: []};
  const occurrences = new Map();
  for (const record of records) if (nonempty(record?.id)) occurrences.set(record.id, (occurrences.get(record.id) || 0) + 1);
  for (const record of records) {
    if (record?.plantId !== plantId) continue;
    const validation = validateIncident(record, new Set([plantId]));
    const errors = [...validation.errors];
    if (occurrences.get(record.id) > 1) errors.push('duplicate_id');
    if (validation.valid && (record.occurredOn > asOfISO || record.reviewedOn > asOfISO || record.sources.some(source => source.publishedOn > asOfISO))) errors.push('future_record');
    if (errors.length) { result.rejected.push({record, errors}); continue; }
    if (!corroborated(record.sources, 'confirmsIncident')) {
      result.pending.push({...record, reason: 'independent_confirmation_missing'});
      continue;
    }
    const assessment = record.impact === 'reported_disruption' && corroborated(record.sources, 'confirmsImpact')
      ? 'reported_impact' : 'reported_incident';
    const entry = {...record, assessment};
    (record.occurredOn >= window.from ? result.recent : result.archive).push(entry);
  }
  const newestFirst = (a, b) => b.occurredOn.localeCompare(a.occurredOn) || a.id.localeCompare(b.id);
  for (const key of ['recent', 'archive', 'pending']) result[key].sort(newestFirst);
  if (result.recent.some(record => record.assessment === 'reported_impact')) result.status = 'reported_impact';
  else if (result.recent.length) result.status = 'reported_incident';
  return result;
}
