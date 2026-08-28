(() => {
  const PLACE_W = 155;
  const PLACE_H = 88;
  const OFFICE_BOX = { x: 1015, y: 610, w: 380, h: 275 };
  const COLLECTIVE_RESIDENCE_KEYS = new Set([
    'NPC_RESIDENCE_EAST','NPC_RESIDENCE_NORTH','NPC_RESIDENCE_SOUTH','NPC_RESIDENCE_WEST','RESIDENTIAL_DISTRICT'
  ]);

  const DISTRICT_SLOTS = {
    west: [[90,315],[330,315],[570,315],[90,500],[330,500],[570,500],[90,685],[330,685],[570,685]],
    north: [[810,275],[1050,275],[1290,275],[1530,275],[810,455],[1050,455],[1290,455],[1530,455]],
    east: [[1690,315],[1930,315],[2170,315],[1690,500],[1930,500],[2170,500],[1690,685],[1930,685],[2170,685]],
    south: [[180,900],[430,900],[680,900],[930,900],[1430,900],[1680,900],[1930,900],[2180,900],[180,1090],[430,1090],[680,1090],[930,1090],[1430,1090],[1680,1090],[1930,1090],[2180,1090]]
  };

  const HOME_SLOTS = (() => {
    const slots = [];
    for (let x = 95; x <= 2250; x += 92) slots.push([x, 1290]);
    for (let x = 120; x <= 2220; x += 96) slots.push([x, 1380]);
    for (let y = 850; y <= 1230; y += 82) slots.push([55, y], [2290, y]);
    return slots;
  })();

  function boxAt(x, y) { return { x, y, w: PLACE_W, h: PLACE_H }; }
  function overlaps(a, b, gx = 34, gy = 28) {
    return a.x < b.x + b.w + gx && a.x + a.w + gx > b.x &&
      a.y < b.y + b.h + gy && a.y + a.h + gy > b.y;
  }
  function districtFor(base) {
    const [x, y] = base;
    if (y >= 820) return 'south';
    if (x < 780) return 'west';
    if (x > 1580) return 'east';
    return 'north';
  }
  function stableSort(items, suffix, keyFn = x => x.place_key || x.identity_key || x.npc_key || x.display_name_th || '') {
    return items.slice().sort((a,b) => {
      const ak = String(keyFn(a) || ''), bk = String(keyFn(b) || '');
      return (hash(ak + suffix) - hash(bk + suffix)) || ak.localeCompare(bk);
    });
  }
  function entityName(x, fallback) {
    return x.display_name_th || x.display_name || x.name_th || x.name || x.npc_display_name_th || fallback;
  }
  function entityKey(x, fallback) {
    return x.identity_key || x.npc_key || x.npc_ephemeral_key || x.person_key || x.id || fallback;
  }

  function buildAssignments(places, originalPlacePos) {
    const assignments = {};
    const occupied = [];
    const buckets = { west: [], north: [], east: [], south: [] };
    places.forEach((p, i) => {
      if (p.place_key === 'PM_STUDIO_WORK_HUB') { assignments[p.place_key] = [1080,660]; return; }
      if (COLLECTIVE_RESIDENCE_KEYS.has(p.place_key)) return;
      buckets[districtFor(originalPlacePos(p, i))].push(p);
    });
    Object.entries(buckets).forEach(([district,bucket]) => {
      const ordered = stableSort(bucket, ':city-spread');
      const slots = DISTRICT_SLOTS[district];
      ordered.forEach((p,idx) => {
        const scan = slots.slice(idx % slots.length).concat(slots.slice(0, idx % slots.length));
        for (const xy of scan) {
          const b = boxAt(xy[0],xy[1]);
          if (overlaps(b,OFFICE_BOX,55,48) || occupied.some(o => overlaps(b,o,45,38))) continue;
          assignments[p.place_key] = xy; occupied.push(b); break;
        }
      });
    });
    return assignments;
  }

  function ensureResidenceStyles() {
    if (document.querySelector('#paojaiResidenceStyles')) return;
    const style = document.createElement('style');
    style.id = 'paojaiResidenceStyles';
    style.textContent = `
      #residences{position:absolute;inset:0;z-index:4;pointer-events:none}
      .residence-home{position:absolute;width:54px;height:46px;border-radius:11px;background:#f8ead7;border:1px solid rgba(89,72,53,.18);box-shadow:0 6px 13px rgba(43,69,55,.13);display:grid;place-items:center;font-size:18px;pointer-events:auto;cursor:default}
      .residence-home.ai-home{background:#eaf4ff;border-color:rgba(55,101,140,.22)}
      .residence-home .home-label{position:absolute;top:48px;left:50%;transform:translateX(-50%);max-width:94px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:rgba(255,255,255,.92);padding:2px 5px;border-radius:7px;font-size:7px;font-weight:850;color:#506773;box-shadow:0 2px 6px rgba(30,60,70,.08)}
      .residence-home.shadow-home{opacity:.82;border-style:dashed}
      .work-truth-badge{position:absolute;left:50%;top:-35px;transform:translateX(-50%);min-width:92px;max-width:132px;padding:4px 6px;border-radius:9px;background:rgba(255,255,255,.96);border:1px solid rgba(55,83,98,.16);box-shadow:0 4px 12px rgba(31,57,70,.13);font-size:7px;line-height:1.3;text-align:center;white-space:nowrap;z-index:3}
      .work-truth-badge b{font-size:7px;letter-spacing:.03em}
      .work-truth-badge.active{border-color:rgba(38,145,94,.35);background:#f1fbf5}
      .work-truth-badge.watching{border-color:rgba(199,151,32,.35);background:#fffaf0}
      .work-truth-badge.degraded,.work-truth-badge.stale{border-color:rgba(196,80,69,.32);background:#fff4f1}
    `;
    document.head.appendChild(style);
  }

  function getState() {
    try { return (typeof S !== 'undefined' && S) ? S : null; } catch (_) { return null; }
  }
  function getPlacePos() {
    try { return (typeof PLACEPOS !== 'undefined' && PLACEPOS) ? PLACEPOS : null; } catch (_) { return null; }
  }

  function renderIndividualHomes() {
    const world = document.querySelector('#world');
    const state = getState();
    if (!world || !state) return;
    ensureResidenceStyles();
    let layer = document.querySelector('#residences');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'residences';
      const npcs = document.querySelector('#npcs');
      world.insertBefore(layer, npcs || null);
    }
    layer.innerHTML = '';

    const agents = stableSort((state.agents || []).slice(), ':home-ai', x => entityKey(x,''));
    const npcs = stableSort((state.npcs || []).slice(), ':home-npc', x => entityKey(x,''));
    const entities = [
      ...agents.map((x,i) => ({kind:'ai', data:x, key:entityKey(x,'AI_'+i), name:entityName(x,'AI '+(i+1)), source:'BACKEND_HOME_IDENTITY_EXISTS'})),
      ...npcs.map((x,i) => ({kind:'npc', data:x, key:entityKey(x,'NPC_'+i), name:entityName(x,'NPC '+(i+1)), source:'SHADOW_PREVIEW_ALLOCATION'}))
    ];

    entities.forEach((e,i) => {
      const baseIndex = hash(e.key + ':home-slot') % HOME_SLOTS.length;
      const xy = HOME_SLOTS[(baseIndex + i) % HOME_SLOTS.length];
      const d = document.createElement('div');
      d.className = 'residence-home ' + (e.kind === 'ai' ? 'ai-home' : 'shadow-home');
      d.style.left = xy[0] + 'px'; d.style.top = xy[1] + 'px';
      d.dataset.residenceSource = e.source;
      d.title = e.kind === 'ai' ? ('บ้านของ ' + e.name + ' · มี home identity ในระบบจริง') : ('บ้านของ ' + e.name + ' · Shadow residence allocation สำหรับ Preview');
      d.innerHTML = '<span>🏠</span><span class="home-label">' + E(e.name) + '</span>';
      layer.appendChild(d);
    });
  }

  function findWorkPresenceRows(state) {
    if (!state) return [];
    for (const value of Object.values(state)) {
      if (!Array.isArray(value) || !value.length) continue;
      const sample = value.find(x => x && typeof x === 'object');
      if (sample && ('active_contracts' in sample) && ('runtime_state' in sample) && ('identity_key' in sample)) return value;
    }
    return [];
  }
  function minutesAgo(ts) {
    if (!ts) return null;
    const t = new Date(ts).getTime();
    if (!Number.isFinite(t)) return null;
    return Math.max(0, Math.round((Date.now() - t) / 60000));
  }
  function truthState(row) {
    const age = minutesAgo(row.updated_at);
    const runtime = String(row.runtime_state || '').toUpperCase();
    if (runtime === 'DEGRADED') return {key:'degraded',label:'DEGRADED',age};
    if (age == null || age > 60) return {key:'stale',label:'STALE',age};
    if (runtime === 'ACTIVE' && age <= 15) return {key:'active',label:'ACTIVE',age};
    return {key:'watching',label:'WATCHING',age};
  }
  function renderWorkTruth() {
    const state = getState();
    if (!state) return;
    ensureResidenceStyles();
    const rows = findWorkPresenceRows(state);
    if (!rows.length) return;
    const byKey = new Map(rows.map(r => [String(r.identity_key || ''), r]));
    const agents = Array.from(document.querySelectorAll('#agents .agent.work'));
    const stateAgents = (state.agents || []).filter(a => a && a.identity_key);
    agents.forEach((el, idx) => {
      const text = (el.textContent || '').trim();
      let a = stateAgents.find(x => text.includes(entityName(x,''))) || stateAgents[idx];
      if (!a) return;
      const row = byKey.get(String(a.identity_key || ''));
      if (!row) return;
      const s = truthState(row);
      let badge = el.querySelector('.work-truth-badge');
      if (!badge) { badge = document.createElement('div'); badge.className = 'work-truth-badge'; el.appendChild(badge); }
      badge.className = 'work-truth-badge ' + s.key;
      const jobs = Number(row.active_contracts || 0);
      const ageText = s.age == null ? 'เวลาไม่ทราบ' : (s.age === 0 ? 'อัปเดตเมื่อสักครู่' : `อัปเดต ${s.age} นาทีที่แล้ว`);
      badge.innerHTML = `<b>${s.label}</b> · ${jobs} งาน<br>${ageText}`;
      badge.title = `สถานะจาก work presence แบบ public-safe · ${ageText} · รายละเอียดภารกิจดูใน Mission World`;
    });
  }

  function nearestPlaceKey(x,y) {
    const pos = getPlacePos();
    if (!pos) return null;
    let best=null,bestD=Infinity;
    Object.entries(pos).forEach(([key,xy]) => {
      const cx=xy[0]+PLACE_W/2, cy=xy[1]+PLACE_H/2;
      const d=(x-cx)**2+(y-cy)**2;
      if(d<bestD){bestD=d;best=key;}
    });
    return bestD<=380*380?best:null;
  }
  function occupantOffsets(count,radiusBase){
    if(count<=1)return [[0,0]];
    const out=[];
    for(let i=0;i<count;i++){
      const ring=1+Math.floor(i/8), inRing=i%8, angle=(Math.PI*2*inRing/8)+ring*.28, radius=radiusBase+(ring-1)*54;
      out.push([Math.round(Math.cos(angle)*radius),Math.round(Math.sin(angle)*radius*.72)]);
    }
    return out;
  }
  let spacingScheduled=false;
  function spreadOccupants(){
    spacingScheduled=false;
    const pos = getPlacePos();
    if(!pos)return;
    const all=Array.from(document.querySelectorAll('#agents .agent,#npcs .npc-avatar'));
    const groups=new Map();
    all.forEach((el,index)=>{
      if(el.classList.contains('commute'))return;
      const left=parseFloat(el.style.left||'0'),top=parseFloat(el.style.top||'0');
      const key=el.classList.contains('work')?'PM_STUDIO_WORK_HUB':nearestPlaceKey(left,top);
      if(!key)return;if(!groups.has(key))groups.set(key,[]);groups.get(key).push({el,index});
    });
    groups.forEach((items,key)=>{
      const xy=pos[key];if(!xy)return;
      items.sort((a,b)=>hash((a.el.textContent||'')+a.index)-hash((b.el.textContent||'')+b.index));
      const office=key==='PM_STUDIO_WORK_HUB',centerX=office?1205:xy[0]+PLACE_W/2,centerY=office?760:xy[1]+PLACE_H+34;
      const offsets=occupantOffsets(items.length,office?78:68);
      items.forEach((item,i)=>{
        const w=item.el.classList.contains('agent')?58:46,h=item.el.classList.contains('agent')?78:62;
        item.el.style.left=Math.round(centerX-w/2+offsets[i][0])+'px';item.el.style.top=Math.round(centerY-h/2+offsets[i][1])+'px';
      });
    });
    renderWorkTruth();
  }
  function scheduleOccupantSpacing(){if(spacingScheduled)return;spacingScheduled=true;setTimeout(spreadOccupants,40);}

  function applySpatialFix(){
    if(typeof renderPlaces!=='function'||typeof placePos!=='function'||typeof Q!=='function')return false;
    if(window.__paojaiSpatialFixApplied)return true;
    const originalPlacePos=placePos;
    renderPlaces=function renderPlacesDistributed(){
      const layer=Q('#places');if(!layer)return;layer.innerHTML='';PLACEPOS={};
      const state = getState();
      const places=(state && state.places || []).slice(),assignments=buildAssignments(places,originalPlacePos);
      places.forEach((p,i)=>{
        if(p.place_key==='PM_STUDIO_WORK_HUB'){PLACEPOS[p.place_key]=[1080,660];return;}
        if(COLLECTIVE_RESIDENCE_KEYS.has(p.place_key))return;
        const xy=assignments[p.place_key]||originalPlacePos(p,i);PLACEPOS[p.place_key]=xy;
        const d=document.createElement('div');d.className='place '+(p.place_type==='PRIVATE'?'private ':'')+(p.place_key.startsWith('DAILY_')?'daily':'');
        d.style.left=xy[0]+'px';d.style.top=xy[1]+'px';d.title=p.purpose_th||p.display_name_th;
        d.innerHTML='<span class="type">'+E(p.place_type)+'</span><span class="label">'+E(p.display_name_th)+'</span>';layer.appendChild(d);
      });
      applyLayerVisibility();renderIndividualHomes();scheduleOccupantSpacing();renderWorkTruth();
    };
    const agentLayer=document.querySelector('#agents'),npcLayer=document.querySelector('#npcs');
    let observerTimer = null;
    const observer=new MutationObserver(()=>{
      clearTimeout(observerTimer);
      observerTimer=setTimeout(()=>{renderIndividualHomes();scheduleOccupantSpacing();renderWorkTruth();},80);
    });
    if(agentLayer)observer.observe(agentLayer,{childList:true,subtree:true});if(npcLayer)observer.observe(npcLayer,{childList:true,subtree:true});
    window.__paojaiSpatialFixApplied=true;
    const state = getState();
    if(state&&Array.isArray(state.places)&&state.places.length){render();resetView();renderIndividualHomes();scheduleOccupantSpacing();renderWorkTruth();}
    setInterval(renderWorkTruth, 60000);
    return true;
  }
  let tries=0;const timer=setInterval(()=>{tries++;if(applySpatialFix()||tries>80)clearInterval(timer);},100);
})();
