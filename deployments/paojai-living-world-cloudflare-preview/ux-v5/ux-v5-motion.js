(()=>{
  const map=document.querySelector('#mapbox');
  const world=document.querySelector('#world');
  if(!map||!world)return;
  document.documentElement.classList.add('v5-ready');

  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const states=new WeakMap();
  let last=performance.now();

  function seedFor(el){
    const s=(el.querySelector('.name')?.textContent||el.textContent||'entity').trim();
    let h=2166136261;
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}
    return Math.abs(h>>>0)||1;
  }
  function rand(st){st.seed=(Math.imul(st.seed,1664525)+1013904223)>>>0;return st.seed/4294967296}
  function profile(el,st){
    const npc=el.classList.contains('npc-avatar');
    const commute=el.classList.contains('commute');
    const work=el.classList.contains('work');
    if(commute)return{radius:145,minSpeed:25,maxSpeed:43,pause:180};
    if(npc)return{radius:82,minSpeed:12,maxSpeed:23,pause:700};
    if(work)return{radius:34,minSpeed:7,maxSpeed:13,pause:900};
    return{radius:105,minSpeed:11,maxSpeed:22,pause:550};
  }
  function chooseTarget(el,st,immediate=false){
    const p=profile(el,st);
    const a=rand(st)*Math.PI*2;
    const r=p.radius*(.35+rand(st)*.65);
    st.tx=Math.cos(a)*r;
    st.ty=Math.sin(a)*r*.72;
    st.speed=p.minSpeed+rand(st)*(p.maxSpeed-p.minSpeed);
    st.pauseUntil=immediate?0:performance.now()+rand(st)*p.pause;
    st.turn=rand(st)*Math.PI*2;
  }
  function attach(el){
    if(states.has(el))return states.get(el);
    const st={seed:seedFor(el),x:0,y:0,tx:0,ty:0,speed:12,pauseUntil:0,turn:0,phase:Math.random()*Math.PI*2};
    states.set(el,st);
    el.dataset.livingMotion='ambient-visual';
    chooseTarget(el,st,true);
    return st;
  }
  function scan(){document.querySelectorAll('.agent,.npc-avatar').forEach(attach)}

  function frame(now){
    const dt=Math.min(.045,(now-last)/1000);last=now;
    scan();
    if(!reduce){
      document.querySelectorAll('.agent,.npc-avatar').forEach(el=>{
        const st=attach(el);
        const dx=st.tx-st.x,dy=st.ty-st.y,dist=Math.hypot(dx,dy);
        if(now>=st.pauseUntil){
          if(dist<2.4){chooseTarget(el,st);}
          else{
            const step=Math.min(dist,st.speed*dt);
            st.x+=dx/dist*step;
            st.y+=dy/dist*step;
          }
        }
        st.phase+=dt*(el.classList.contains('npc-avatar')?1.35:1.05);
        const breathe=Math.sin(st.phase)*1.5;
        const sway=Math.cos(st.phase*.67)*1.15;
        el.style.setProperty('--mx',`${(st.x+sway).toFixed(2)}px`);
        el.style.setProperty('--my',`${(st.y+breathe).toFixed(2)}px`);
      });
    }
    requestAnimationFrame(frame);
  }

  // Mature ambient motion layer: subtle traffic flow, not operational evidence.
  const flow=document.createElement('div');
  flow.className='v5-flow-layer';flow.setAttribute('aria-hidden','true');
  const lanes=[
    ['8%','50%','91%','50%',18],['49%','18%','49%','89%',21],['10%','22%','88%','78%',24],['13%','80%','86%','25%',26]
  ];
  lanes.forEach((lane,li)=>{
    for(let i=0;i<4;i++){
      const d=document.createElement('i');
      d.style.cssText=`--x1:${lane[0]};--y1:${lane[1]};--x2:${lane[2]};--y2:${lane[3]};--dur:${lane[4]+i*2}s;--delay:${-(li*3+i*4)}s`;
      flow.appendChild(d);
    }
  });
  map.appendChild(flow);

  const motes=document.createElement('div');motes.className='ambient-motes';motes.setAttribute('aria-hidden','true');
  for(let i=0;i<20;i++){
    const s=document.createElement('i');const size=1.5+Math.random()*2.2;
    s.style.cssText=`--x:${Math.random()*100}%;--y:${18+Math.random()*76}%;--d:${10+Math.random()*15}s;--delay:${-Math.random()*15}s;--size:${size}px`;
    motes.appendChild(s);
  }
  map.appendChild(motes);

  const style=document.createElement('style');
  style.textContent=`
    .v5-ready body{animation:v5Boot .55s cubic-bezier(.2,.8,.2,1) both}
    @keyframes v5Boot{from{opacity:.35;filter:blur(3px)}to{opacity:1;filter:none}}
    .v5-flow-layer{position:absolute;inset:0;z-index:113;pointer-events:none;overflow:hidden}
    .v5-flow-layer i{position:absolute;width:4px;height:4px;border-radius:50%;background:rgba(119,224,199,.68);box-shadow:0 0 8px rgba(99,220,193,.62);left:var(--x1);top:var(--y1);animation:v5traffic var(--dur) linear var(--delay) infinite}
    @keyframes v5traffic{0%{left:var(--x1);top:var(--y1);opacity:0}7%{opacity:.7}92%{opacity:.7}100%{left:var(--x2);top:var(--y2);opacity:0}}
    .ambient-motes{position:absolute;inset:0;z-index:112;pointer-events:none;overflow:hidden}
    .ambient-motes i{position:absolute;left:var(--x);top:var(--y);width:var(--size);height:var(--size);border-radius:50%;background:rgba(166,225,205,.42);box-shadow:0 0 7px rgba(104,216,184,.28);animation:v5mote var(--d) ease-in-out var(--delay) infinite}
    @keyframes v5mote{0%,100%{transform:translate(0,0);opacity:.06}35%{opacity:.42}60%{transform:translate(14px,-42px);opacity:.2}80%{transform:translate(-8px,-65px);opacity:.05}}
    .agent[data-living-motion],.npc-avatar[data-living-motion]{transform:translate3d(var(--mx,0px),var(--my,0px),0)!important}
    @media(prefers-reduced-motion:reduce){.v5-flow-layer,.ambient-motes{display:none}.v5-ready body{animation:none}.agent[data-living-motion],.npc-avatar[data-living-motion]{transform:none!important}}
  `;
  document.head.appendChild(style);

  scan();
  requestAnimationFrame(frame);
})();