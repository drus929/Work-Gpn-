export const pipelineScopes = {
  system: 'Основные системы',
  regional: 'Региональные направления и отводы',
};

const normalize = value => String(value).toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').trim();

export function filterPipelines(pipelines, {query = '', scope = 'all'} = {}) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return pipelines.filter(pipeline => {
    if (scope !== 'all' && pipeline.scope !== scope) return false;
    const searchable = normalize([pipeline.name, pipeline.route, ...(pipeline.regions || [])].join(' '));
    return terms.every(term => searchable.includes(term));
  });
}

export function summarizePipelines(pipelines) {
  return {
    total: pipelines.length,
    oil: pipelines.filter(pipeline => pipeline.kind === 'oil').length,
    products: pipelines.filter(pipeline => pipeline.kind === 'products').length,
    regional: pipelines.filter(pipeline => pipeline.scope === 'regional').length,
    documented: pipelines.filter(pipeline => pipeline.evidence?.status === 'documented').length,
  };
}

export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);
