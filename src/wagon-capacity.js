import data from './data/wagon-capacity.json' with {type:'json'};

export const wagonCapacityRecords=data.records;
const indexed=new Map(data.records.map(record=>[`${record.kind}:${record.objectId}`,record]));
export const wagonCapacityFor=(kind,id)=>indexed.get(`${kind}:${id}`)||null;
export const capacityKinds={published:'Опубликованная мощность',design:'Проектная пропускная способность',handling:'Мощность обработки вагонов',planned:'Заявленная проектная цель'};
export const capacityCoverage={
  checkedAt:data.checkedAt,
  total:data.records.length,
  portsWithFigures:data.records.filter(r=>r.kind==='port'&&r.figures.length).length,
  bordersWithFigures:data.records.filter(r=>r.kind==='border'&&r.figures.length).length,
  withWholeObjectFigures:data.records.filter(r=>r.figures.some(f=>f.scopeLevel==='object'&&f.capacityKind!=='planned')).length,
};

export function validateWagonCapacity(record, knownKeys) {
  const errors=[];
  const text=value=>typeof value==='string'&&value.trim().length>0;
  const date=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;const d=new Date(value+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;};
  const positive=value=>Number.isSafeInteger(value)&&value>0;
  if(!record||typeof record!=='object'||Array.isArray(record))return {valid:false,errors:['record_required']};
  const keys=knownKeys instanceof Set?knownKeys:new Set(knownKeys||[]);
  if(!keys.has(`${record.kind}:${record.objectId}`))errors.push('unknown_object');
  if(!['documented','unverified'].includes(record.status))errors.push('invalid_status');
  if(!date(record.checkedAt))errors.push('invalid_review_date');
  if(!text(record.note))errors.push('note_required');
  if(!Array.isArray(record.figures))errors.push('figures_required');
  else {
    if(record.status==='documented'&&!record.figures.length)errors.push('documented_figure_required');
    if(record.status==='unverified'&&record.figures.length)errors.push('unverified_figures_must_be_empty');
    for(const figure of record.figures){
      if(!figure||typeof figure!=='object'){errors.push('figure_required');continue;}
      if(!positive(figure.wagonsPerDay))errors.push('positive_wagon_count_required');
      if(figure.unit!=='wagons_per_day'||figure.valueBasis!=='direct_source')errors.push('direct_wagon_unit_required');
      if(!['exact','up_to','about','range','at_least'].includes(figure.qualifier))errors.push('invalid_qualifier');
      if(figure.qualifier==='range'){
        if(!positive(figure.upperWagonsPerDay)||figure.upperWagonsPerDay<=figure.wagonsPerDay)errors.push('invalid_range');
      }else if(figure.upperWagonsPerDay!==null)errors.push('unexpected_upper_bound');
      if(!Object.hasOwn(capacityKinds,figure.capacityKind))errors.push('invalid_capacity_kind');
      if(!['object','component'].includes(figure.scopeLevel))errors.push('scope_level_required');
      for(const key of ['scope','direction','asOf'])if(!text(figure[key]))errors.push(`${key}_required`);
      const source=figure.source;
      if(!source||typeof source!=='object'){errors.push('source_required');continue;}
      for(const key of ['publisher','basis'])if(!text(source[key]))errors.push(`source_${key}_required`);
      if(!date(source.checkedAt)||source.checkedAt>record.checkedAt)errors.push('source_review_date_invalid');
      if(source.publishedOn!==null&&(!date(source.publishedOn)||source.publishedOn>source.checkedAt))errors.push('source_date_invalid');
      try{const url=new URL(source.url);if(url.protocol!=='https:'||url.username||url.password)errors.push('source_url_invalid');}catch{errors.push('source_url_invalid');}
    }
  }
  return {valid:!errors.length,errors};
}
