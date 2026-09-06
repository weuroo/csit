(()=>{
  const map=document.querySelector('#mapbox');
  const world=document.querySelector('#world');
  if(!map||!world)return;
  document.documentElement.classList.add('v6-ready');

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
  function profile(el){
    const npc=el.classList.contains('npc-avatar');
    const commute=el.classList.contains('commute');
    const work=el.classList.contains('work');
    if(commute)return{radius:165,minSpeed:27,maxSpeed:40,pause:80};
    if(npc)return{radius:96,minSpeed:10,maxSpeed:17,pause:120};
    if(work)return{radius:38,minSpeed:5,maxSpeed:9,pause:260};
    return{radius:125,minSpeed:8,maxSpeed:15,pause:100};
  }
  function chooseTarget(el,st,immediate=false){
    const p=profile(el);
    const a=rand(st)*Math.PI*2;
    const r=p.radius*(.42+rand(st)*.58);
    st.tx=Math.cos(a)*r;
    st.ty=Math.sin(a)*r*.66;
    st.speed=p.minSpeed+rand(st)*(p.maxSpeed-p.minSpeed);
    st.pauseUntil=immediate?0:performance.now()+rand(st)*p.pause;
  }
  function attach(el){
    if(states.has(el))return states.get(el);
    const st={seed:seedFor(el),x:0,y:0,tx:0,ty:0,speed:10,pauseUntil:0,phase:Math.random()*Math.PI*2};
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
          if(dist<2){chooseTarget(el,st);}
          else{
            const step=Math.min(dist,st.speed*dt);
            st.x+=dx/dist*step;
            st.y+=dy/dist*step;
          }
        }
        st.phase+=dt*.72;
        const breathe=Math.sin(st.phase)*.7;
        el.style.setProperty('--mx',`${st.x.toFixed(2)}px`);
        el.style.setProperty('--my',`${(st.y+breathe).toFixed(2)}px`);
      });
    }
    requestAnimationFrame(frame);
  }

  const flow=document.createElement('div');
  flow.className='v6-flow-layer';
  flow.setAttribute('aria-hidden','true');
  const lanes=[['8%','50%','91%','50%',25],['49%','18%','49%','89%',28],['10%','22%','88%','78%',31],['13%','80%','86%','25%',34]];
  lanes.forEach((lane,li)=>{
    for(let i=0;i<2;i++){
      const d=document.createElement('i');
      d.style.cssText=`--x1:${lane[0]};--y1:${lane[1]};--x2:${lane[2]};--y2:${lane[3]};--dur:${lane[4]+i*4}s;--delay:${-(li*4+i*9)}s`;
      flow.appendChild(d);
    }
  });
  map.appendChild(flow);

  const style=document.createElement('style');
  style.textContent=`
    .v6-flow-layer{position:absolute;inset:0;z-index:113;pointer-events:none;overflow:hidden}
    .v6-flow-layer i{position:absolute;width:5px;height:5px;border-radius:50%;background:rgba(48,146,126,.52);box-shadow:0 0 8px rgba(48,146,126,.28);left:var(--x1);top:var(--y1);animation:v6traffic var(--dur) linear var(--delay) infinite}
    @keyframes v6traffic{0%{left:var(--x1);top:var(--y1);opacity:0}8%{opacity:.55}92%{opacity:.55}100%{left:var(--x2);top:var(--y2);opacity:0}}
    .agent[data-living-motion],.npc-avatar[data-living-motion]{transform:translate3d(var(--mx,0px),var(--my,0px),0)!important}
    @media(prefers-reduced-motion:reduce){.v6-flow-layer{display:none}.agent[data-living-motion],.npc-avatar[data-living-motion]{transform:none!important}}
  `;
  document.head.appendChild(style);

  scan();
  requestAnimationFrame(frame);
})();