(() => {
  const PLACE_W = 155;
  const PLACE_H = 88;
  const OFFICE_BOX = { x: 1015, y: 610, w: 380, h: 275 };

  const DISTRICT_SLOTS = {
    west: [
      [130,350],[350,350],[570,350],
      [130,500],[350,500],[570,500],
      [130,650],[350,650],[570,650]
    ],
    north: [
      [835,310],[1050,310],[1270,310],[1490,310],
      [835,455],[1050,455],[1270,455],[1490,455],
      [835,590],[1490,590]
    ],
    east: [
      [1640,350],[1860,350],[2080,350],
      [1640,505],[1860,505],[2080,505],
      [1640,660],[1860,660],[2080,660]
    ],
    south: [
      [330,915],[545,915],[760,915],[975,915],[1400,915],[1615,915],[1830,915],[2045,915],
      [330,1060],[545,1060],[760,1060],[975,1060],[1400,1060],[1615,1060],[1830,1060],[2045,1060],
      [330,1205],[545,1205],[760,1205],[975,1205],[1400,1205],[1615,1205],[1830,1205],[2045,1205]
    ]
  };

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
  function stableSort(items, suffix) {
    return items.slice().sort((a,b) => (hash(a.place_key + suffix) - hash(b.place_key + suffix)) || a.place_key.localeCompare(b.place_key));
  }

  function buildAssignments(places, originalPlacePos) {
    const assignments = {};
    const occupied = [];
    const buckets = { west: [], north: [], east: [], south: [] };

    places.forEach((p, i) => {
      if (p.place_key === 'PM_STUDIO_WORK_HUB') {
        assignments[p.place_key] = [1080, 660];
        return;
      }
      const base = originalPlacePos(p, i);
      buckets[districtFor(base)].push(p);
    });

    Object.entries(buckets).forEach(([district, bucket]) => {
      const orderedPlaces = stableSort(bucket, ':district-order');
      const slots = DISTRICT_SLOTS[district].slice();
      const shift = slots.length ? hash('slots:' + district) % slots.length : 0;
      const orderedSlots = slots.slice(shift).concat(slots.slice(0, shift));

      orderedPlaces.forEach((p, idx) => {
        let candidate = orderedSlots[idx];
        if (candidate) {
          const b = boxAt(candidate[0], candidate[1]);
          if (!overlaps(b, OFFICE_BOX, 48, 42) && !occupied.some(o => overlaps(b, o))) {
            assignments[p.place_key] = candidate;
            occupied.push(b);
            return;
          }
        }

        // Deterministic whole-map fallback. This is only used if a district outgrows its planned capacity.
        const fallback = [];
        for (let row = 0; row < 6; row++) {
          for (let col = 0; col < 10; col++) fallback.push([95 + col * 220, 315 + row * 180]);
        }
        const fshift = hash(p.place_key + ':fallback') % fallback.length;
        const scan = fallback.slice(fshift).concat(fallback.slice(0, fshift));
        for (const xy of scan) {
          const b = boxAt(xy[0], xy[1]);
          if (overlaps(b, OFFICE_BOX, 48, 42) || occupied.some(o => overlaps(b, o))) continue;
          assignments[p.place_key] = xy;
          occupied.push(b);
          return;
        }
      });
    });
    return assignments;
  }

  function nearestPlaceKey(x, y) {
    let best = null, bestD = Infinity;
    Object.entries(PLACEPOS || {}).forEach(([key, xy]) => {
      const cx = xy[0] + PLACE_W / 2;
      const cy = xy[1] + PLACE_H / 2;
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      if (d < bestD) { bestD = d; best = key; }
    });
    return bestD <= 380 * 380 ? best : null;
  }

  function occupantOffsets(count, radiusBase) {
    if (count <= 1) return [[0,0]];
    const out = [];
    for (let i = 0; i < count; i++) {
      const ring = 1 + Math.floor(i / 8);
      const inRing = i % 8;
      const angle = (Math.PI * 2 * inRing / 8) + ring * 0.28;
      const radius = radiusBase + (ring - 1) * 54;
      out.push([Math.round(Math.cos(angle) * radius), Math.round(Math.sin(angle) * radius * 0.72)]);
    }
    return out;
  }

  let spacingScheduled = false;
  function spreadOccupants() {
    spacingScheduled = false;
    if (!window.PLACEPOS) return;
    const all = Array.from(document.querySelectorAll('#agents .agent, #npcs .npc-avatar'));
    const groups = new Map();

    all.forEach((el, index) => {
      if (el.classList.contains('commute')) return;
      const left = parseFloat(el.style.left || '0');
      const top = parseFloat(el.style.top || '0');
      const key = el.classList.contains('work') ? 'PM_STUDIO_WORK_HUB' : nearestPlaceKey(left, top);
      if (!key) return;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ el, index });
    });

    groups.forEach((items, key) => {
      const xy = PLACEPOS[key];
      if (!xy) return;
      items.sort((a,b) => {
        const at = (a.el.textContent || '') + ':' + a.index;
        const bt = (b.el.textContent || '') + ':' + b.index;
        return hash(at) - hash(bt);
      });
      const office = key === 'PM_STUDIO_WORK_HUB';
      const centerX = office ? 1205 : xy[0] + PLACE_W / 2;
      const centerY = office ? 760 : xy[1] + PLACE_H + 34;
      const offsets = occupantOffsets(items.length, office ? 78 : 66);
      items.forEach((item, i) => {
        const w = item.el.classList.contains('agent') ? 58 : 46;
        const h = item.el.classList.contains('agent') ? 78 : 62;
        item.el.style.left = Math.round(centerX - w/2 + offsets[i][0]) + 'px';
        item.el.style.top = Math.round(centerY - h/2 + offsets[i][1]) + 'px';
      });
    });
  }

  function scheduleOccupantSpacing() {
    if (spacingScheduled) return;
    spacingScheduled = true;
    setTimeout(spreadOccupants, 30);
  }

  function applySpatialFix() {
    if (typeof renderPlaces !== 'function' || typeof placePos !== 'function' || typeof Q !== 'function') return false;
    if (window.__paojaiSpatialFixApplied) return true;

    const originalPlacePos = placePos;
    renderPlaces = function renderPlacesDistributed() {
      const layer = Q('#places');
      if (!layer) return;
      layer.innerHTML = '';
      PLACEPOS = {};
      const places = (S.places || []).slice();
      const assignments = buildAssignments(places, originalPlacePos);

      places.forEach((p, i) => {
        if (p.place_key === 'PM_STUDIO_WORK_HUB') {
          PLACEPOS[p.place_key] = [1080, 660];
          return;
        }
        const xy = assignments[p.place_key] || originalPlacePos(p, i);
        PLACEPOS[p.place_key] = xy;
        const d = document.createElement('div');
        d.className = 'place ' + (p.place_type === 'PRIVATE' ? 'private ' : '') + (p.place_key.startsWith('DAILY_') ? 'daily' : '');
        d.style.left = xy[0] + 'px';
        d.style.top = xy[1] + 'px';
        d.title = p.purpose_th || p.display_name_th;
        d.innerHTML = '<span class="type">' + E(p.place_type) + '</span><span class="label">' + E(p.display_name_th) + '</span>';
        layer.appendChild(d);
      });
      applyLayerVisibility();
      scheduleOccupantSpacing();
    };

    const agentLayer = document.querySelector('#agents');
    const npcLayer = document.querySelector('#npcs');
    const observer = new MutationObserver(scheduleOccupantSpacing);
    if (agentLayer) observer.observe(agentLayer, { childList:true, subtree:true });
    if (npcLayer) observer.observe(npcLayer, { childList:true, subtree:true });

    window.__paojaiSpatialFixApplied = true;
    if (S && Array.isArray(S.places) && S.places.length) {
      render();
      resetView();
      scheduleOccupantSpacing();
    }
    return true;
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries++;
    if (applySpatialFix() || tries > 80) clearInterval(timer);
  }, 100);
})();
