(() => {
  const PLACE_W = 155;
  const PLACE_H = 88;
  const GAP_X = 42;
  const GAP_Y = 34;
  const MIN_X = 70;
  const MAX_X = 2170;
  const MIN_Y = 285;
  const MAX_Y = 1325;
  const OFFICE_BOX = { x: 1015, y: 610, w: 380, h: 275 };

  function overlaps(a, b) {
    return a.x < b.x + b.w + GAP_X &&
      a.x + a.w + GAP_X > b.x &&
      a.y < b.y + b.h + GAP_Y &&
      a.y + a.h + GAP_Y > b.y;
  }

  function clampCandidate(x, y) {
    return {
      x: Math.max(MIN_X, Math.min(MAX_X, x)),
      y: Math.max(MIN_Y, Math.min(MAX_Y, y)),
      w: PLACE_W,
      h: PLACE_H
    };
  }

  function spiralOffsets(seed) {
    const out = [[0, 0]];
    const sx = 205;
    const sy = 132;
    for (let ring = 1; ring <= 7; ring++) {
      for (let dx = -ring; dx <= ring; dx++) {
        out.push([dx * sx, -ring * sy], [dx * sx, ring * sy]);
      }
      for (let dy = -ring + 1; dy <= ring - 1; dy++) {
        out.push([-ring * sx, dy * sy], [ring * sx, dy * sy]);
      }
    }
    const shift = seed % out.length;
    return out.slice(shift).concat(out.slice(0, shift));
  }

  function choosePosition(place, index, occupied, originalPlacePos) {
    const base = originalPlacePos(place, index);
    const jitterX = (hash(place.place_key + ':spread-x') % 41) - 20;
    const jitterY = (hash(place.place_key + ':spread-y') % 31) - 15;
    const offsets = spiralOffsets(hash(place.place_key + ':spread'));

    for (const [dx, dy] of offsets) {
      const box = clampCandidate(base[0] + dx + jitterX, base[1] + dy + jitterY);
      if (overlaps(box, OFFICE_BOX)) continue;
      if (occupied.some(other => overlaps(box, other))) continue;
      occupied.push(box);
      return [box.x, box.y];
    }

    // Deterministic fallback grid across the whole usable map.
    for (let slot = 0; slot < 80; slot++) {
      const col = slot % 10;
      const row = Math.floor(slot / 10);
      const box = clampCandidate(95 + col * 215, 310 + row * 132);
      if (overlaps(box, OFFICE_BOX)) continue;
      if (occupied.some(other => overlaps(box, other))) continue;
      occupied.push(box);
      return [box.x, box.y];
    }

    return base;
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
      const occupied = [];
      const places = (S.places || []).slice();

      places.forEach((p, i) => {
        if (p.place_key === 'PM_STUDIO_WORK_HUB') {
          PLACEPOS[p.place_key] = [1080, 660];
          return;
        }

        const xy = choosePosition(p, i, occupied, originalPlacePos);
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
    };

    window.__paojaiSpatialFixApplied = true;
    if (S && Array.isArray(S.places) && S.places.length) {
      render();
      resetView();
    }
    return true;
  }

  let tries = 0;
  const timer = setInterval(() => {
    tries++;
    if (applySpatialFix() || tries > 80) clearInterval(timer);
  }, 100);
})();
