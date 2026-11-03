import '@fontsource/manrope/cyrillic-400.css';
import '@fontsource/manrope/cyrillic-600.css';
import '@fontsource/manrope/cyrillic-800.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-800.css';
import './style.css';
import {geoConicConformal,geoPath,geoGraticule10} from 'd3-geo';
import {feature} from 'topojson-client';
import world from 'world-atlas/countries-110m.json';
import {plants,ownerSources} from './data.js';
import {railways} from './railways.js';
import {renderRailwayAreas, renderRailwayLabels} from './railway-layer.js';
import {ports, pipelines} from './infrastructure.js';
import {infrastructureKinds, renderPipelines, renderPorts, infrastructureDetail} from './infrastructure-layer.js';
import railNetwork from './data/rail-network.json';
import {portRailConnections} from './rail-connections.js';
import {createRailNetworkMarkup, renderRailAccess, railAccessGeometry, railAccessDetail} from './rail-network-layer.js';
import {pipelineScopes, filterPipelines, summarizePipelines, escapeHtml} from './pipeline-catalog.js';
const icon=(name,size=20)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',factory:'<path d="M3 21V10l6 3V8l6 4V5h4l2 16H3Z"/><path d="M7 17h1m4 0h1m4 0h1"/>',arrow:'<path d="m9 5 7 7-7 7"/>',rail:'<rect x="6" y="3" width="12" height="14" rx="3"/><path d="M6 10h12M9 17l-3 4m9-4 3 4M9 14h.01M15 14h.01"/>',layers:'<path d="m12 3 10 6-10 6L2 9l10-6Zm-9 11 9 5 9-5M3 18l9 5 9-5"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',external:'<path d="M14 3h7v7m0-7L10 14m1-10H4v16h16v-7"/>',reset:'<path d="M3 10a9 9 0 1 1 1 8M3 4v6h6"/>'})[name]||''}</svg>`;
let selected=null,query='',owner='',status='',activeRailway='',showRailAreas=true,showRail=true,showRailAccess=true,showLabels=true,zoom=1,pan=[0,0];
const infrastructureLayers={ports:true,oil:false,products:false};
let selectedInfrastructure=null;
let railMapOnly=false;
let infrastructureOpener=null;
let pipelineQuery='',pipelineScope='all';
const visiblePipelines=()=>filterPipelines(pipelines,{query:pipelineQuery,scope:pipelineScope});
const n=v=>v.toLocaleString('ru-RU',{maximumFractionDigits:2});
const countries=feature(world,world.objects.countries);
const russia=countries.features.find(country=>country.id==='643');
const projection=geoConicConformal().parallels([49,67]).rotate([-100,0]).center([0,62]).scale(650).translate([650,300]).clipExtent([[0,0],[1200,720]]);
const path=geoPath(projection);
const railNetworkMarkup=createRailNetworkMarkup(railNetwork,path);
const portRailConnection=id=>portRailConnections.find(connection=>connection.portId===id);
const mapTransform=()=>`translate(${pan}) translate(600 360) scale(${zoom}) translate(-600 -360)`;
const filtered=()=>plants.filter(p=>(!query||`${p.name} ${p.region} ${p.rail}`.toLowerCase().includes(query.toLowerCase()))&&(!owner||p.owner===owner)&&(!status||p.status===status)&&(!activeRailway||p.rail===activeRailway));
document.querySelector('#app').innerHTML=`<header><a class="brand" href="./"><span class="brand-icon">${icon('factory',24)}</span>нефте<span>атлас</span><i>РОССИЯ</i></a><nav><a class="active" href="#map">Карта НПЗ</a><button id="about">О проекте ${icon('external',13)}</button></nav><div class="header-right"><span class="live-dot"></span>Справочный атлас<span class="avatar">RU</span></div></header>
<main><section class="heading"><div><div class="eyebrow">НЕФТЕПЕРЕРАБОТКА · РОССИЯ</div><h1>НПЗ на карте России<span class="count-tag">29 заводов</span></h1><p>НПЗ, железные дороги, порты и трубопроводные направления</p></div><button class="outline" id="sources">${icon('info',17)} О данных</button></section>
<section class="stats"><article><span class="stat-icon">${icon('factory',24)}</span><div><small>Заводов в атласе</small><strong>${plants.length}<em>НПЗ</em></strong></div><span class="stat-note">от 3 млн т / год</span></article><article><span class="stat-icon">◴</span><div><small>Проектная мощность</small><strong>${n(plants.reduce((s,p)=>s+p.capacity,0))}<em>млн т / год</em></strong></div><span class="stat-note">суммарно</span></article><article><span class="stat-icon">◎</span><div><small>География присутствия</small><strong>${new Set(plants.map(p=>p.region)).size}<em>регионов</em></strong></div></article><article><span class="stat-icon amber">${icon('info',23)}</span><div><small>Текущий статус заводов</small><strong class="status-stat">Требует проверки</strong></div></article></section>
<section class="workspace" id="map"><aside class="sidebar"><div class="side-title"><h2>Нефтеперерабатывающие заводы</h2><span id="result-count">29</span></div><label class="search">${icon('search',18)}<input id="search" placeholder="Завод, регион или железная дорога" aria-label="Поиск завода"><kbd>⌕</kbd></label><div class="filters"><select id="owner" aria-label="Владелец"><option value="">Все компании</option>${[...new Set(plants.map(p=>p.owner))].sort().map(o=>`<option>${o}</option>`).join('')}</select><select id="status" aria-label="Статус"><option value="">Все статусы</option><option value="unknown">Не проверен</option><option value="outage">Остановлен</option></select></div><div class="list-heading"><span>ЗАВОД / РЕГИОН</span><span>МЛН Т / ГОД</span></div><div id="plant-list" class="plant-list"></div><div class="sidebar-foot"><span class="unknown-dot"></span>Мощность от 3 млн тонн в год</div></aside>
<div class="map-area"><div class="map-top"><span class="map-label"><span class="live-dot"></span>КАРТА ПРОИЗВОДСТВЕННЫХ МОЩНОСТЕЙ</span><button id="layers" class="map-button" aria-expanded="false" aria-controls="layer-menu">${icon('layers',17)} Слои</button><div id="layer-menu" hidden><strong class="layer-section-title">НПЗ и железные дороги</strong><label><input id="rail-area-toggle" type="checkbox" checked> Районы железных дорог</label><label><input id="rail-toggle" data-rail-layer="network" type="checkbox" checked> Железнодорожная сеть</label><label><input id="rail-access-toggle" data-rail-layer="access" type="checkbox" checked> ЖД к портовым районам</label><label><input id="label-toggle" type="checkbox" checked> Названия НПЗ</label><strong class="layer-section-title">Дополнительная инфраструктура</strong>${Object.entries(infrastructureKinds).map(([key,kind])=>`<label><input id="${key}-toggle" data-infra-toggle="${key}" type="checkbox" ${infrastructureLayers[key]?'checked':''}><i class="infra-swatch swatch-${key}"></i>${kind.title}</label>`).join('')}</div></div><svg id="atlas" viewBox="0 0 1200 720" role="group" aria-label="Интерактивная карта нефтеперерабатывающих заводов России"><defs><pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".6" fill="#304151"/></pattern><filter id="glow"><feGaussianBlur stdDeviation="5"/></filter></defs><rect width="1200" height="720" fill="url(#dots)"/><g id="map-content"></g></svg><div class="map-controls"><button id="zoom-in" aria-label="Приблизить">+</button><button id="zoom-out" aria-label="Отдалить">−</button><button id="reset-map" aria-label="Сбросить масштаб">${icon('reset',17)}</button></div><div class="legend"><span><i class="legend-dot"></i>НПЗ · статус не проверен</span><span><i class="legend-dot red"></i>Подтверждённая остановка</span><span id="rail-network-legend"><i class="rail-line"></i>Железнодорожная сеть</span><span id="rail-access-legend"><i class="rail-access-swatch"></i>К портовым районам · схема</span><span id="infrastructure-legend"></span></div><div class="map-caption">ЖД: Natural Earth · подходы к портам схематичны</div><div id="detail"></div></div></section>
<section class="infrastructure-panel" aria-label="Портовая и трубопроводная инфраструктура"><div class="railway-key-heading"><div><h2>Порты и трубопроводы</h2><p>Включайте слои независимо друг от друга. Выберите объект на карте или в списке, чтобы открыть карточку.</p></div><span class="railway-schematic">Обзорная схема · системы и региональные линии</span></div><div class="pipeline-catalog-tools"><label class="pipeline-search">${icon('search',17)}<input id="pipeline-search" type="search" placeholder="Трубопровод, направление или регион" aria-label="Поиск трубопроводов"></label><label class="pipeline-scope-label"><span>Масштаб обзора</span><select id="pipeline-scope" aria-label="Масштаб трубопроводов"><option value="all">Все направления</option>${Object.entries(pipelineScopes).map(([key,label])=>`<option value="${key}">${label}</option>`).join('')}</select></label><button id="pipeline-reset" class="outline" disabled>Сбросить</button></div><div id="pipeline-summary" class="pipeline-summary" aria-live="polite"></div><div class="infrastructure-controls">${Object.entries(infrastructureKinds).map(([key,kind])=>`<div class="infrastructure-control"><label class="infrastructure-switch"><i class="infra-swatch swatch-${key}"></i><span>${kind.title}<small data-infra-count="${key}">${key==='ports'?ports.length:pipelines.filter(p=>p.kind===key).length} ${key==='ports'?'объектов':'направлений'}</small></span><input type="checkbox" data-infra-toggle="${key}" aria-label="Показать слой: ${kind.title}" ${infrastructureLayers[key]?'checked':''}></label><select id="${key}-select" data-infra-select="${key}" aria-label="Выбрать: ${kind.title}"><option value="">${key==='ports'?'Выбрать порт / терминал':'Выбрать направление'}</option>${(key==='ports'?ports:pipelines.filter(p=>p.kind===key)).map(item=>`<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('')}</select></div>`).join('')}</div><details class="pipeline-methodology"><summary>Аналитика покрытия и источники</summary><p>Добавлены 20 региональных нефтяных направлений по 22 записям опубликованного рабочего снимка Global Energy Monitor. Параллельные нитки объединены. Всего в каталоге 26 нефтяных и 3 нефтепродуктовых направления.</p><p>Даты сведений новых записей: 2022–2025 годы. Они подтверждают наличие описания в источнике, а не текущую работу объектов. Геометрия обзорная, длина и пропускная способность не рассчитываются.</p><p><strong>Нефтепродуктовые линии требуют дальнейшей проверки.</strong> Этот map-экспорт GEM исключает самостоятельные нефтепродуктовые категории. Новые линии этого типа пока не добавлены; исходные 3 справочные записи сохранены.</p><a href="https://github.com/drus929/Work-Gpn-/blob/main/docs/pipeline-analysis.md" target="_blank" rel="noopener noreferrer">Методика, перечень направлений и источники ↗</a></details><p class="infrastructure-caption">Поиск и масштаб применяются только к трубопроводам. «Региональные» — уровень детализации карты, а не юридический класс или оценка диаметра трубы. Фильтр железных дорог применяется к НПЗ; порты и трубопроводы отображаются независимо.</p></section>
<section class="rail-network-panel" aria-label="Железнодорожная сеть и портовые подходы"><div class="railway-key-heading"><div><h2>Железнодорожная сеть и порты</h2><p>Россия и приграничные участки. Выберите порт, чтобы увидеть подход, названия узлов и сведения о подключении.</p></div><span class="railway-schematic">Natural Earth · обзорная картография</span></div><div class="rail-network-tools"><label><input type="checkbox" data-rail-layer="network" checked> Железнодорожная сеть</label><label><input type="checkbox" data-rail-layer="access" checked> Подходы к портовым районам</label><select id="rail-port-select" data-infra-select="ports" aria-label="Показать железнодорожный подход к порту"><option value="">Выбрать порт и приблизить</option>${ports.map(port=>`<option value="${port.id}">${escapeHtml(port.name)}${railAccessGeometry(portRailConnection(port.id))?'':' · подключение не подтверждено'}</option>`).join('')}</select></div><div class="rail-coverage"><span><strong>${portRailConnections.filter(connection=>railAccessGeometry(connection)).length}</strong> схематичных подходов</span><span><strong>${portRailConnections.filter(connection=>!railAccessGeometry(connection)).length}</strong> подключения не подтверждены</span><a href="https://github.com/drus929/Work-Gpn-/blob/main/docs/rail-network-source.md" target="_blank" rel="noopener noreferrer">Источники и охват ↗</a></div><p class="infrastructure-caption">Сплошные линии — картографическая сеть; голубой пунктир — схема по именованным узлам до портового района. Подъезды к отдельным причалам и текущее движение не подтверждены. Районы обслуживания можно выключить в меню «Слои», чтобы лучше рассмотреть пути.</p></section>
<section class="railway-key" aria-label="Железные дороги"><div class="railway-key-heading"><div><h2>Районы железных дорог</h2><p id="railway-description" aria-live="polite">Выберите цветную область или название дороги, чтобы увидеть связанные НПЗ.</p></div><span class="railway-schematic">Схематичные районы обслуживания</span></div><div id="railway-options" class="railway-options"></div></section>
<footer><span>НЕФТЕАТЛАС <b> / </b> Промышленная география России</span><span>Проектная мощность ≠ фактическая переработка ${icon('info',13)}</span></footer></main><dialog id="modal"><div class="modal-head"><h2>О данных атласа</h2><button id="close-modal" aria-label="Закрыть">${icon('close')}</button></div><p>Справочный каталог крупных НПЗ России с проектной мощностью от 3 млн тонн нефти в год. Мощность и структура владения могут меняться; перед деловым использованием сверяйте данные с отчётностью компаний.</p><h3>Статусы и красные отметки</h3><p>Оперативный источник не подключён. Все текущие статусы обозначены как «Не проверен». Красный цвет предусмотрен только для подтверждённой остановки из-за внешнего воздействия с источником и датой проверки. Отсутствие красной отметки не означает, что завод работает.</p><h3>Железные дороги и география</h3><p>Цветные области — схематичные районы обслуживания 16 железных дорог. Это не официальные границы филиалов РЖД: районы могут пересекаться и не совпадают с границами субъектов РФ. Выбор области выделяет дорогу и фильтрует НПЗ по указанной в каталоге магистрали. Линии показывают обобщённые направления магистралей, а не точные пути или действующие подъездные соединения. Названия дорог приведены в карточках. Координаты НПЗ приблизительные. Основа карты: Natural Earth, public domain.</p><h3>Порты и трубопроводы</h3><p>Показаны основные нефтеналивные порты, терминалы и выбранные магистральные направления перевозки нефти и нефтепродуктов. Каталог не исчерпывающий. Координаты портов обзорные; линии трубопроводов соединяют опорные города и не показывают точную трассу. Ссылки в карточках ведут на справочные сайты операторов. Текущая загрузка, работа объектов и связи с конкретными НПЗ не подтверждаются.</p><h3>Источники для сверки</h3><div class="source-links">${Object.entries(ownerSources).map(([o,url])=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${o} ↗</a>`).join('')}</div><p class="muted">Сведения об остановках на 2 ноября 2026 года не подтверждены. Данные каталога требуют актуализации; это не мониторинг в реальном времени.</p></dialog>`;
function drawMap(){const visible=filtered();const symbolZoom=zoom*Math.max(1,document.querySelector('#atlas').getBoundingClientRect().width)/1200;document.querySelector('#map-content').innerHTML=`<g transform="${mapTransform()}"><path d="${path(geoGraticule10())}" class="graticule"/>${countries.features.map(f=>`<path d="${path(f)||''}" class="${f.id==='643'?'russia':'country'}"/>`).join('')}${showRailAreas?renderRailwayAreas({railways,path,russia,activeRailway}):''}${showRail?railNetworkMarkup:''}<text x="650" y="245" class="country-label">Р О С С И Я</text><text x="340" y="560" class="neighbor-label">КАЗАХСТАН</text><text x="795" y="590" class="neighbor-label">КИТАЙ</text><text x="750" y="120" class="sea-label">СЕВЕРНЫЙ ЛЕДОВИТЫЙ ОКЕАН</text>${renderPipelines({pipelines:visiblePipelines(),path,enabled:infrastructureLayers,selected:selectedInfrastructure,zoom:symbolZoom})}${showRailAreas?renderRailwayLabels({railways,projection,activeRailway,plants:visible,showPlantLabels:showLabels,selected,zoom:symbolZoom}):''}${visible.map(p=>{const [x,y]=projection([p.lon,p.lat]);const active=p.id===selected;return `<g class="map-marker ${active?'selected':''} ${p.status==='outage'?'outage':''}" data-id="${p.id}" tabindex="0" role="button" aria-label="${p.name}, ${p.region}" transform="translate(${x},${y}) scale(${1/symbolZoom})"><circle class="marker-halo" r="${active?16:9}"/><circle class="marker-dot" r="${active?6:4}"/>${showLabels&&(['omsk','kirishi','perm','ang','khab','ach','volg','norsi','moscow','tan'].includes(p.id)||active)?`<text x="12" y="${p.id==='tan'?-12:4}" class="marker-label">${p.name.replace(' НПЗ','')}</text>${active?`<text x="12" y="19" class="marker-region">${p.region}</text>`:''}`:''}</g>`}).join('')}${showRailAccess?renderRailAccess({connections:portRailConnections,projection,path,selectedPort:selectedInfrastructure?.type==='port'?selectedInfrastructure.id:null,zoom:symbolZoom}):''}${infrastructureLayers.ports?renderPorts({ports,projection,selected:selectedInfrastructure,zoom:symbolZoom}):''}</g>`;bindInfrastructureMap();document.querySelectorAll('.map-marker').forEach(el=>{el.onclick=()=>selectPlant(el.dataset.id);el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectPlant(el.dataset.id)}}});document.querySelectorAll('.railway-label').forEach(el=>{el.onclick=()=>selectRailway(el.dataset.railway);el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectRailway(el.dataset.railway)}}});}
function renderList(){const items=filtered();document.querySelector('#result-count').textContent=items.length;document.querySelector('#plant-list').innerHTML=items.length?items.map(p=>`<button class="plant-row ${selected===p.id?'active':''}" data-id="${p.id}"><span class="plant-status ${p.status==='outage'?'red':''}"></span><span class="plant-text"><strong>${p.name}</strong><small>${p.region}</small></span><span class="capacity">${n(p.capacity)}</span>${icon('arrow',14)}</button>`).join(''):`<div class="empty">Ничего не найдено<small>В каталоге нет НПЗ от 3 млн т/год для выбранных условий. Попробуйте изменить фильтры</small><button id="clear-filters">Сбросить все фильтры</button></div>`;document.querySelectorAll('.plant-row').forEach(el=>el.onclick=()=>selectPlant(el.dataset.id));document.querySelector('#clear-filters')?.addEventListener('click',()=>{query=owner=status=activeRailway='';document.querySelector('#search').value='';document.querySelector('#owner').value='';document.querySelector('#status').value='';renderRailwayKey();renderList();drawMap()});}
function renderDetail(){if(selectedInfrastructure){renderInfrastructureDetail();return;}const p=plants.find(p=>p.id===selected);const el=document.querySelector('#detail');if(!p){el.innerHTML='';return}el.innerHTML=`<article class="detail-card"><div class="detail-top"><span class="card-eyebrow">ПАСПОРТ ПРЕДПРИЯТИЯ</span><button id="close-detail" aria-label="Закрыть карточку">${icon('close',17)}</button></div><div class="detail-name"><span class="detail-icon">${icon('factory',25)}</span><div><h2>${p.name}</h2><p>${p.region}</p></div></div><span class="status-badge ${p.status==='outage'?'outage-badge':''}"><i></i>${p.status==='outage'?'Остановлен · внешнее воздействие':'Текущий статус не проверен'}</span>${p.status==='outage'?`<a class="status-evidence" href="${encodeURI(p.statusSource).replaceAll('"','%22')}" target="_blank" rel="noopener noreferrer">Источник · проверено ${p.statusCheckedAt} ↗</a>`:''}<div class="detail-metrics"><div><small>КОМПАНИЯ / ВЛАДЕЛЕЦ</small><strong>${p.owner}</strong></div><div><small>ПРОЕКТНАЯ МОЩНОСТЬ</small><strong>${n(p.capacity)} <span>млн т / год</span></strong></div></div><div class="products"><h3>Основная продукция</h3><div>${p.products.map(s=>`<span>${s}</span>`).join('')}</div></div><div class="rail-detail">${icon('rail',21)}<div><small>ПРИМЫКАЮЩАЯ МАГИСТРАЛЬ</small><strong>${p.rail} железная дорога</strong><p>Сеть в районе завода; точный подъезд не подтверждён</p><button type="button" id="show-plant-rail">Железные дороги рядом ↗</button></div></div><button class="detail-source" id="detail-source">Сведения и источники ${icon('external',14)}</button></article>`;document.querySelector('#close-detail').onclick=()=>{selected=null;renderDetail();renderList();drawMap()};document.querySelector('#detail-source').onclick=openModal;document.querySelector('#show-plant-rail').onclick=()=>{showRail=true;syncRailControls();const [x,y]=projection([p.lon,p.lat]);zoom=6;pan=[450-600-zoom*(x-600),330-360-zoom*(y-360)];drawMap()};}
function renderRailwayKey(){
  document.querySelector('#railway-options').innerHTML=`<button class="railway-chip ${!activeRailway?'is-active':''}" data-railway="" aria-pressed="${!activeRailway}">Все дороги <span>${railways.length}</span></button>${railways.map(rail=>`<button class="railway-chip ${activeRailway===rail.name?'is-active':''}" style="--rail-color:${rail.color}" data-railway="${rail.name}" aria-pressed="${activeRailway===rail.name}"><i></i>${rail.name}<span>${plants.filter(p=>p.rail===rail.name).length}</span></button>`).join('')}`;
  document.querySelectorAll('.railway-chip').forEach(el=>el.onclick=()=>selectRailway(el.dataset.railway));
  const rail=railways.find(rail=>rail.name===activeRailway);
  document.querySelector('#railway-description').textContent=rail?`${rail.name} ЖД · ${rail.description} · НПЗ в каталоге: ${plants.filter(p=>p.rail===rail.name).length}`:'Выберите цветную область или название дороги, чтобы увидеть связанные НПЗ.';
}
function selectRailway(name){
  const focused=document.activeElement;
  const focusClass=focused?.classList.contains('railway-chip')?'railway-chip':focused?.classList.contains('railway-label')?'railway-label':null;
  const focusRailway=focused?.dataset.railway;
  activeRailway=name;
  if(name){showRailAreas=true;document.querySelector('#rail-area-toggle').checked=true;}
  if(selected&&!filtered().some(p=>p.id===selected))selected=null;
  renderRailwayKey();renderList();renderDetail();drawMap();
  if(focusClass)Array.from(document.querySelectorAll(`.${focusClass}`)).find(el=>el.dataset.railway===focusRailway)?.focus({preventScroll:true});
}
function selectPlant(id){selectedInfrastructure=null;syncInfrastructureControls();selected=id;renderList();renderDetail();drawMap();}
function openModal(){document.querySelector('#modal').showModal()}
document.querySelector('#search').oninput=e=>{query=e.target.value;renderList();drawMap()};document.querySelector('#owner').onchange=e=>{owner=e.target.value;renderList();drawMap()};document.querySelector('#status').onchange=e=>{status=e.target.value;renderList();drawMap()};
for(const id of ['about','sources'])document.querySelector('#'+id).onclick=openModal;
document.querySelector('#close-modal').onclick=()=>document.querySelector('#modal').close();document.querySelector('#modal').onclick=e=>{if(e.target===e.currentTarget)e.currentTarget.close()};document.querySelector('#layers').onclick=()=>{const el=document.querySelector('#layer-menu');el.hidden=!el.hidden;document.querySelector('#layers').setAttribute('aria-expanded',String(!el.hidden))};document.querySelector('#rail-area-toggle').onchange=e=>{showRailAreas=e.target.checked;drawMap()};document.querySelectorAll('[data-rail-layer]').forEach(input=>input.onchange=e=>{if(input.dataset.railLayer==='network')showRail=e.target.checked;else showRailAccess=e.target.checked;syncRailControls();drawMap()});document.querySelector('#label-toggle').onchange=e=>{showLabels=e.target.checked;drawMap()};document.querySelector('#zoom-in').onclick=()=>{zoom=Math.min(zoom*1.35,16);drawMap()};document.querySelector('#zoom-out').onclick=()=>{zoom=Math.max(zoom/1.35,0.7);drawMap()};document.querySelector('#reset-map').onclick=()=>{zoom=1;pan=[0,0];drawMap()};
window.addEventListener('resize',drawMap);
const svg=document.querySelector('#atlas');
let drag=null;
svg.onpointerdown=e=>{
  if(e.target.closest('.map-marker, .railway-label, .infrastructure-marker, .pipeline'))return;
  drag={x:e.clientX,y:e.clientY,pan:[...pan],moved:false,railway:e.target.closest('[data-railway]')?.dataset.railway};
  svg.setPointerCapture(e.pointerId);
};
svg.onpointermove=e=>{
  if(!drag)return;
  if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<4&&!drag.moved)return;
  drag.moved=true;
  const scale=1200/svg.getBoundingClientRect().width;
  pan=[drag.pan[0]+(e.clientX-drag.x)*scale,drag.pan[1]+(e.clientY-drag.y)*scale];
  document.querySelector('#map-content>g').setAttribute('transform',mapTransform());
};
svg.onpointerup=e=>{
  const clickedRailway=drag&&!drag.moved?drag.railway:null;
  drag=null;
  if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);
  if(clickedRailway)selectRailway(clickedRailway);
};
svg.onpointercancel=()=>{drag=null};
initInfrastructureControls();updatePipelineCatalog();renderRailwayKey();renderList();drawMap();renderDetail();

function infrastructureItem(selection){
  return selection?(selection.type==='port'?ports:pipelines).find(item=>item.id===selection.id):null;
}
function syncInfrastructureControls(){
  document.querySelectorAll('[data-infra-toggle]').forEach(input=>input.checked=infrastructureLayers[input.dataset.infraToggle]);
  const selectedItem=infrastructureItem(selectedInfrastructure);
  document.querySelectorAll('[data-infra-select]').forEach(select=>{
    const key=select.dataset.infraSelect;
    select.value=selectedItem&&((selectedInfrastructure.type==='port'&&key==='ports')||selectedItem.kind===key)?selectedItem.id:'';
  });
  document.querySelector('#infrastructure-legend').innerHTML=Object.entries(infrastructureKinds).filter(([key])=>infrastructureLayers[key]).map(([key,kind])=>`<span><i class="infra-swatch swatch-${key}"></i>${kind.title}</span>`).join('');
}
function setInfrastructureLayer(key,enabled){
  infrastructureLayers[key]=enabled;
  const item=infrastructureItem(selectedInfrastructure);
  if(!enabled&&item&&((key==='ports'&&selectedInfrastructure.type==='port')||item.kind===key)){
    selectedInfrastructure=null;renderDetail();
  }
  syncInfrastructureControls();drawMap();
}
function selectInfrastructure(type,id,{reveal=false,openerId=null}={}){
  const selection={type,id};
  const item=infrastructureItem(selection);
  if(!item)return;
  const focused=document.activeElement;
  const focusId=focused?.dataset.infraId;
  infrastructureOpener=reveal?{selectId:openerId||`${type==='port'?'ports':item.kind}-select`}:{mapId:id};
  selected=null;
  selectedInfrastructure=selection;
  railMapOnly=false;
  infrastructureLayers[type==='port'?'ports':item.kind]=true;
  syncInfrastructureControls();renderList();renderDetail();drawMap();
  if(focusId)Array.from(document.querySelectorAll('[data-infra-id]')).find(el=>el.dataset.infraId===focusId)?.focus({preventScroll:true});
  if(reveal){
    focusInfrastructureItem(item,type);drawMap();
    const card=document.querySelector('.infrastructure-detail');
    card.scrollIntoView({block:'center',behavior:'instant'});
    card.focus({preventScroll:true});
  }
}
function renderInfrastructureDetail(){
  const item=infrastructureItem(selectedInfrastructure);
  if(!item)return;
  const mapOnly=railMapOnly&&selectedInfrastructure.type==='port';
  document.querySelector('#detail').innerHTML=mapOnly?`<div class="rail-map-toolbar" role="region" aria-label="Просмотр железнодорожного подхода"><span>ЖД · ${escapeHtml(item.name)}</span><button id="restore-port-card">Карточка порта</button><button id="close-infra-detail" aria-label="Закрыть просмотр подхода">${icon('close',17)}</button></div>`:infrastructureDetail(item,selectedInfrastructure.type,icon('close',17),selectedInfrastructure.type==='port'?railAccessDetail(portRailConnection(item.id)):'');
  document.querySelector('#restore-port-card')?.addEventListener('click',()=>{railMapOnly=false;renderDetail();document.querySelector('.infrastructure-detail').focus({preventScroll:true});});
  document.querySelector('#show-port-rail')?.addEventListener('click',()=>{showRail=true;showRailAccess=true;syncRailControls();focusInfrastructureItem(item,'port');railMapOnly=true;renderDetail();drawMap();document.querySelector('.map-area').scrollIntoView({block:'center',behavior:'instant'});document.querySelector('#restore-port-card').focus({preventScroll:true});});
  document.querySelector('#close-infra-detail').onclick=()=>{
    selectedInfrastructure=null;syncInfrastructureControls();renderDetail();drawMap();
    if(infrastructureOpener?.selectId)document.getElementById(infrastructureOpener.selectId)?.focus();
    else Array.from(document.querySelectorAll('[data-infra-id]')).find(el=>el.dataset.infraId===infrastructureOpener?.mapId)?.focus({preventScroll:true});
  };
}
function bindInfrastructureMap(){
  document.querySelectorAll('[data-infra-id]').forEach(el=>{
    el.onclick=()=>selectInfrastructure(el.dataset.infraType,el.dataset.infraId);
    el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectInfrastructure(el.dataset.infraType,el.dataset.infraId)}};
  });
}
function focusInfrastructureItem(item,type){
  const access=type==='port'?railAccessGeometry(portRailConnection(item.id)):null;
  const [[x0,y0],[x1,y1]]=type==='port'?(access?path.bounds(access):(()=>{const p=projection(item.coordinates);return [p,p]})()):path.bounds(item.geometry);
  if(![x0,y0,x1,y1].every(Number.isFinite))return;
  zoom=type==='port'?(access?Math.max(2.2,Math.min(12,550/Math.max(x1-x0,25),330/Math.max(y1-y0,25))):4):Math.max(.7,Math.min(5,Math.min(650/Math.max(x1-x0,40),420/Math.max(y1-y0,40))));
  pan=[450-600-zoom*((x0+x1)/2-600),330-360-zoom*((y0+y1)/2-360)];
}
function updatePipelineCatalog(){
  const visible=visiblePipelines();
  const summary=summarizePipelines(visible);
  document.querySelector('#pipeline-summary').innerHTML=`<span><strong>${summary.total}</strong> из ${pipelines.length} направлений по фильтру</span><span><i class="infra-swatch swatch-oil"></i>${summary.oil} нефтяных</span><span><i class="infra-swatch swatch-products"></i>${summary.products} продуктовых</span><span><strong>${summary.regional}</strong> региональных / отводов</span><span class="pipeline-evidence-count">${summary.documented} записей с проверенным документом</span>`;
  for(const kind of ['oil','products']){
    const items=visible.filter(item=>item.kind===kind);
    const select=document.getElementById(`${kind}-select`);
    select.innerHTML=`<option value="">${items.length?'Выбрать направление':'Нет направлений по фильтру'}</option>${Object.entries(pipelineScopes).map(([scope,label])=>{const group=items.filter(item=>item.scope===scope);return group.length?`<optgroup label="${label}">${group.map(item=>`<option value="${item.id}">${escapeHtml(item.name)}</option>`).join('')}</optgroup>`:''}).join('')}`;
    select.disabled=!items.length;
    document.querySelector(`[data-infra-count="${kind}"]`).textContent=`${items.length} направлений по фильтру`;
  }
  document.querySelector('#pipeline-reset').disabled=!pipelineQuery&&pipelineScope==='all';
  if(selectedInfrastructure?.type==='pipeline'&&!visible.some(item=>item.id===selectedInfrastructure.id)){selectedInfrastructure=null;renderDetail()}
  syncInfrastructureControls();drawMap();
}
function initInfrastructureControls(){
  document.querySelector('#pipeline-search').oninput=e=>{pipelineQuery=e.target.value;updatePipelineCatalog()};
  document.querySelector('#pipeline-scope').onchange=e=>{pipelineScope=e.target.value;updatePipelineCatalog()};
  document.querySelector('#pipeline-reset').onclick=()=>{pipelineQuery='';pipelineScope='all';document.querySelector('#pipeline-search').value='';document.querySelector('#pipeline-scope').value='all';updatePipelineCatalog();document.querySelector('#pipeline-search').focus()};
  document.querySelectorAll('[data-infra-toggle]').forEach(input=>input.onchange=e=>setInfrastructureLayer(input.dataset.infraToggle,e.target.checked));
  document.querySelectorAll('[data-infra-select]').forEach(select=>select.onchange=e=>{
    if(e.target.value)selectInfrastructure(select.dataset.infraSelect==='ports'?'port':'pipeline',e.target.value,{reveal:true,openerId:select.id});
    else{selectedInfrastructure=null;syncInfrastructureControls();renderDetail();drawMap()}
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.querySelector('#layer-menu').hidden){document.querySelector('#layer-menu').hidden=true;document.querySelector('#layers').setAttribute('aria-expanded','false');document.querySelector('#layers').focus()}});
  syncInfrastructureControls();
}

function syncRailControls(){
  document.querySelectorAll('[data-rail-layer]').forEach(input=>input.checked=input.dataset.railLayer==='network'?showRail:showRailAccess);
  document.querySelector('#rail-network-legend').hidden=!showRail;
  document.querySelector('#rail-access-legend').hidden=!showRailAccess;
}
