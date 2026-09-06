(()=>{
  const map=document.querySelector('#mapbox');
  if(!map)return;
  document.documentElement.classList.add('v4-ready');

  const motes=document.createElement('div');
  motes.className='ambient-motes';
  motes.setAttribute('aria-hidden','true');
  for(let i=0;i<26;i++){
    const s=document.createElement('i');
    const size=2+Math.random()*3;
    s.style.cssText=`--x:${Math.random()*100}%;--y:${20+Math.random()*75}%;--d:${7+Math.random()*10}s;--delay:${-Math.random()*12}s;--size:${size}px`;
    motes.appendChild(s);
  }
  map.appendChild(motes);

  const scan=document.createElement('div');
  scan.className='world-scan';
  scan.setAttribute('aria-hidden','true');
  map.appendChild(scan);

  const cursor=document.createElement('div');
  cursor.className='world-cursor-glow';
  cursor.setAttribute('aria-hidden','true');
  map.appendChild(cursor);
  map.addEventListener('pointermove',e=>{
    const r=map.getBoundingClientRect();
    cursor.style.transform=`translate(${e.clientX-r.left-90}px,${e.clientY-r.top-90}px)`;
  });
  map.addEventListener('pointerleave',()=>cursor.style.opacity='0');
  map.addEventListener('pointerenter',()=>cursor.style.opacity='1');

  document.addEventListener('click',e=>{
    const a=e.target.closest('a');
    if(!a)return;
    const raw=a.getAttribute('href')||'';
    if(raw==='./mission-world.html'){
      e.preventDefault();
      location.href='../mission-world.html';
    }
  });

  const observer=new MutationObserver(()=>{
    document.querySelectorAll('.item').forEach((el,i)=>{
      if(el.dataset.v4enhanced)return;
      el.dataset.v4enhanced='1';
      el.style.setProperty('--delay',`${Math.min(i,9)*18}ms`);
    });
  });
  observer.observe(document.body,{childList:true,subtree:true});

  const style=document.createElement('style');
  style.textContent=`
    .v4-ready body{animation:v4Boot .65s cubic-bezier(.2,.8,.2,1) both}
    @keyframes v4Boot{from{opacity:.2;filter:blur(5px)}to{opacity:1;filter:none}}
    .ambient-motes{position:absolute;inset:0;z-index:119;pointer-events:none;overflow:hidden}
    .ambient-motes i{position:absolute;left:var(--x);top:var(--y);width:var(--size);height:var(--size);border-radius:50%;background:rgba(213,255,227,.7);box-shadow:0 0 8px rgba(110,240,183,.55);animation:mote var(--d) ease-in-out var(--delay) infinite}
    @keyframes mote{0%,100%{transform:translate(0,0);opacity:.08}35%{opacity:.65}50%{transform:translate(16px,-32px);opacity:.4}75%{transform:translate(-8px,-57px);opacity:.12}}
    .world-scan{position:absolute;left:0;right:0;top:-15%;height:16%;z-index:118;pointer-events:none;background:linear-gradient(180deg,transparent,rgba(104,229,181,.035),rgba(104,229,181,.09),transparent);filter:blur(1px);animation:worldScan 11s linear infinite}
    @keyframes worldScan{to{top:112%}}
    .world-cursor-glow{position:absolute;left:0;top:0;width:180px;height:180px;border-radius:50%;z-index:117;pointer-events:none;background:radial-gradient(circle,rgba(126,255,207,.09),rgba(126,255,207,.025) 42%,transparent 70%);mix-blend-mode:screen;transition:opacity .25s}
    .item[data-v4enhanced]{animation:itemIn .26s ease var(--delay) both}
    @keyframes itemIn{from{opacity:0;transform:translateX(7px)}to{opacity:1;transform:none}}
    @media(prefers-reduced-motion:reduce){.ambient-motes,.world-scan,.world-cursor-glow{display:none}.v4-ready body,.item[data-v4enhanced]{animation:none}}
  `;
  document.head.appendChild(style);
})();