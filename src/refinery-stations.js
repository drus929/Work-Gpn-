import stationData from './data/refinery-stations.json' with {type:'json'};

// Published commercial station relationships; no track geometry or current traffic.
export const refineryRailStations = stationData.records;
export const stationCoverage = {checkedAt:stationData.checkedAt, total:stationData.records.length,
  documented:stationData.records.filter(record=>record.status==='documented').length, reference:stationData.records.filter(record=>record.status==='reference').length};
const byPlant = new Map(refineryRailStations.map(record=>[record.plantId,record]));
export const refineryStationInfo = plantId => byPlant.get(plantId) || null;
export const refineryStationSearchText = plantId => (refineryStationInfo(plantId)?.stations || []).map(station=>station.name).join(' ');

export function validateStationInfo(record, plantIds) {
  const errors=[];
  const nonempty=value=>typeof value==='string'&&value.trim().length>0;
  const validDate=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;const date=new Date(value+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;};
  if(!record||typeof record!=='object'||Array.isArray(record))return {valid:false,errors:['record_required']};
  if(!(plantIds instanceof Set?plantIds:new Set(plantIds||[])).has(record.plantId))errors.push('unknown_plant');
  if(!['documented','reference','unverified'].includes(record.status))errors.push('invalid_status');
  if(!Array.isArray(record.stations))errors.push('stations_required');
  else {
    if(['documented','reference'].includes(record.status)&&!record.stations.length)errors.push('documented_station_required');
    if(record.status==='unverified'&&record.stations.length)errors.push('unverified_stations_must_be_empty');
    const names=new Set();
    for(const station of record.stations){
      if(!station||typeof station!=='object'){errors.push('station_required');continue;}
      if(!nonempty(station.name)||names.has(station.name))errors.push('station_name_invalid_or_duplicate');
      names.add(station.name);
      if(!['Станция примыкания','Станция отгрузки','Станция обслуживания','Станция назначения','Разрешённое примыкание'].includes(station.role))errors.push('station_role_invalid');
      if(!Array.isArray(station.sources)||!station.sources.length)errors.push('station_sources_required');
      else for(const source of station.sources){
        if(!source||typeof source!=='object'){errors.push('source_required');continue;}
        if(!nonempty(source.publisher)||!nonempty(source.basis))errors.push('source_provenance_required');
        if(!validDate(source.checkedAt))errors.push('source_review_date_invalid');
        if(source.sourceDate!==null&&(!validDate(source.sourceDate)||source.sourceDate>source.checkedAt))errors.push('source_date_invalid');
        try {const url=new URL(source.url);if(url.protocol!=='https:'||url.username||url.password)errors.push('source_url_invalid');}
        catch {errors.push('source_url_invalid');}
      }
    }
  }
  if(!nonempty(record.note))errors.push('record_note_required');
  return {valid:errors.length===0,errors};
}
