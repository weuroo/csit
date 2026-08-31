// Paojai Living World — City Layout v3
// PREPARED DURING FEATURE FREEZE. NOT LOADED BY worker.js.
// Activation requires post-stabilization review and explicit Preview wiring.

export function stableHash(input = '') {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededUnit(seed) {
  return (stableHash(seed) % 100000) / 100000;
}

function polarSlot(center, radius, index, count, seed) {
  const ring = 0.34 + 0.56 * seededUnit(seed + ':ring');
  const angle = (Math.PI * 2 * index / Math.max(count, 1)) + seededUnit(seed + ':angle') * 0.7;
  return [
    Math.round(center[0] + Math.cos(angle) * radius * ring),
    Math.round(center[1] + Math.sin(angle) * radius * ring)
  ];
}

function overlaps(a, b, gap = 44) {
  return a.x < b.x + b.w + gap && a.x + a.w + gap > b.x &&
    a.y < b.y + b.h + gap && a.y + a.h + gap > b.y;
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

export function buildDistrictIndex(plan) {
  return Object.fromEntries((plan.districts || []).map(d => [d.key, d]));
}

export function assignPlaces(plan, places, options = {}) {
  const width = plan.world.width;
  const height = plan.world.height;
  const size = options.placeSize || { w: 160, h: 92 };
  const gap = options.gap ?? 54;
  const districts = buildDistrictIndex(plan);
  const byDistrict = new Map();
  const out = {};
  const occupied = [];

  for (const p of places) {
    const districtKey = p.district || p.city_district || 'TOWN_CENTER';
    if (!byDistrict.has(districtKey)) byDistrict.set(districtKey, []);
    byDistrict.get(districtKey).push(p);
  }

  for (const [districtKey, bucket] of byDistrict) {
    const d = districts[districtKey] || districts.TOWN_CENTER;
    const ordered = bucket.slice().sort((a, b) =>
      stableHash((a.key || a.place_key) + ':place') - stableHash((b.key || b.place_key) + ':place')
    );

    ordered.forEach((p, idx) => {
      const key = p.key || p.place_key;
      const candidates = [];
      for (let attempt = 0; attempt < 28; attempt++) {
        const [cx, cy] = polarSlot(d.center, d.radius, idx + attempt * 3, ordered.length + 7, key + ':' + attempt);
        candidates.push([
          clamp(cx - size.w / 2, 70, width - size.w - 70),
          clamp(cy - size.h / 2, 120, height - size.h - 70)
        ]);
      }
      const xy = candidates.find(([x, y]) => {
        const box = { x, y, w: size.w, h: size.h };
        return !occupied.some(o => overlaps(box, o, gap));
      }) || candidates[0];
      const box = { x: xy[0], y: xy[1], w: size.w, h: size.h };
      occupied.push(box);
      out[key] = xy;
    });
  }
  return out;
}

export function assignResidences(plan, identities, options = {}) {
  const districts = buildDistrictIndex(plan);
  const residential = [districts.RESIDENTIAL_SOUTHWEST, districts.RESIDENTIAL_SOUTHEAST].filter(Boolean);
  const width = plan.world.width;
  const height = plan.world.height;
  const homeSize = options.homeSize || { w: 78, h: 54 };
  const gap = options.gap ?? 34;
  const occupied = [];
  const out = {};

  const ordered = identities.slice().sort((a, b) => stableHash(a.key) - stableHash(b.key));
  ordered.forEach((identity, idx) => {
    const d = residential[idx % residential.length];
    const localIndex = Math.floor(idx / residential.length);
    const candidates = [];
    for (let attempt = 0; attempt < 36; attempt++) {
      const [cx, cy] = polarSlot(d.center, d.radius, localIndex + attempt * 2, Math.ceil(ordered.length / residential.length) + 9, identity.key + ':' + attempt);
      candidates.push([
        clamp(cx - homeSize.w / 2, 70, width - homeSize.w - 70),
        clamp(cy - homeSize.h / 2, 120, height - homeSize.h - 70)
      ]);
    }
    const xy = candidates.find(([x, y]) => {
      const box = { x, y, w: homeSize.w, h: homeSize.h };
      return !occupied.some(o => overlaps(box, o, gap));
    }) || candidates[0];
    occupied.push({ x: xy[0], y: xy[1], w: homeSize.w, h: homeSize.h });
    out[identity.key] = {
      x: xy[0], y: xy[1],
      mode: identity.mode || 'VERIFIED',
      district: d.key,
      capacity: identity.capacity || 2
    };
  });
  return out;
}

export function capacityStatus(place, occupancy) {
  const cap = Number(place.capacity || 0);
  if (!cap) return { full: false, ratio: 0 };
  const count = Number(occupancy || 0);
  return { full: count >= cap, ratio: Math.min(1, count / cap) };
}

export function destinationScore(candidate, ctx) {
  if (!candidate) return -Infinity;
  if (candidate.closed) return -Infinity;
  if (candidate.capacity && candidate.occupancy >= candidate.capacity) return -Infinity;
  const w = {
    obligation: 6,
    preference: 3.2,
    time_of_day: 2.4,
    novelty: 1.5,
    distance: -1.8,
    occupancy: -1.2,
    relationship_opportunity: 1.5,
    cooldown: -4,
    recovery_need: 2.2
  };
  return (ctx.obligation || 0) * w.obligation +
    (ctx.preference || 0) * w.preference +
    (ctx.time_of_day || 0) * w.time_of_day +
    (ctx.novelty || 0) * w.novelty +
    (ctx.distance || 0) * w.distance +
    (ctx.occupancy || 0) * w.occupancy +
    (ctx.relationship_opportunity || 0) * w.relationship_opportunity +
    (ctx.cooldown || 0) * w.cooldown +
    (ctx.recovery_need || 0) * w.recovery_need;
}

export const CITY_LAYOUT_V3_STATUS = Object.freeze({
  mode: 'PREPARED_NOT_ACTIVE',
  production_effect: 'NONE',
  routes_default_visible: false,
  requires_post_stabilization_activation: true
});
