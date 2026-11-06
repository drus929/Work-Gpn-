import data from './data/depots.json' with {type:'json'};

export const depots = data.records;
export const depotCoverage = {...data.coverage, checkedAt:data.checkedAt, acceptedUnits:data.acceptedUnits || ['tonnes'], threshold:30000};
const unitLabels = {tonnes:'т', m3:'м³'};
export function storageLabel(storage) {
  return `${storage.value.toLocaleString('ru-RU')} ${unitLabels[storage.unit] || storage.unit}`;
}

export function validateDepot(record, {acceptedUnits = depotCoverage.acceptedUnits} = {}) {
  const errors = [];
  const text = value => typeof value === 'string' && value.trim().length > 0;
  const date = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const parsed = new Date(value+'T00:00:00Z');
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10) === value;
  };
  if (!record || typeof record !== 'object' || Array.isArray(record)) return {valid:false,errors:['record_required']};
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id || '')) errors.push('invalid_id');
  for (const key of ['name','operator','region','locality','description']) if (!text(record[key])) errors.push(`${key}_required`);
  if (!Array.isArray(record.coordinates) || record.coordinates.length !== 2
    || !record.coordinates.every(value => Number.isFinite(value) && Math.abs(value*10-Math.round(value*10)) < 1e-8)
    || record.coordinates[0] < 19 || record.coordinates[0] > 180 || record.coordinates[1] < 40 || record.coordinates[1] > 80) errors.push('approximate_coordinates_required');
  if (!Array.isArray(record.products) || !record.products.every(text)) errors.push('products_required');
  const storage = record.storage;
  if (!storage || typeof storage !== 'object') errors.push('storage_required');
  else {
    if (!Number.isFinite(storage.value) || storage.value < 30000) errors.push('storage_below_threshold');
    if (!Object.hasOwn(unitLabels,storage.unit) || !acceptedUnits.includes(storage.unit)) errors.push('storage_unit_not_accepted');
    if (!text(storage.asOf)) errors.push('storage_period_required');
  }
  const source = record.source;
  if (!source || typeof source !== 'object') errors.push('source_required');
  else {
    for (const key of ['publisher','basis']) if (!text(source[key])) errors.push(`source_${key}_required`);
    if (!date(source.checkedAt) || source.checkedAt > data.checkedAt) errors.push('source_review_date_invalid');
    if (source.publishedOn !== null && (!date(source.publishedOn) || source.publishedOn > source.checkedAt)) errors.push('source_date_invalid');
    try {
      const url = new URL(source.url);
      if (url.protocol !== 'https:' || url.username || url.password) errors.push('source_url_invalid');
    } catch { errors.push('source_url_invalid'); }
  }
  return {valid:errors.length === 0,errors};
}
