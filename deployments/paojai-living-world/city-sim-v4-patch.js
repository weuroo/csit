/* v4.1 compatibility patch — backend-only daily/home places must not stack at map center. */
(function(){
'use strict';
const oldSlot=slotPos;
slotPos=function(a,placeKey){
  if(P.has(placeKey)) return oldSlot(a,placeKey);
  const e=a?.v4||{};
  const bx=Number(e.position_x),by=Number(e.position_y);
  if(Number.isFinite(bx)&&Number.isFinite(by)){
    const peers=actors.filter(x=>x?.v4?.movement_state!=='WALKING'&&x?.v4?.current_place_key===placeKey).sort((x,y)=>x.id.localeCompare(y.id));
    const idx=Math.max(0,peers.findIndex(x=>x.id===a.id));
    const ang=(idx%8)/8*Math.PI*2;
    const ring=idx<8?26:42+Math.floor(idx/8)*14;
    return{x:90+bx*.55+Math.cos(ang)*ring,y:80+by*.55+Math.sin(ang)*ring*.55};
  }
  const h=hash(a?.id||placeKey||'fallback');
  return{x:620+(h%180),y:470+((h>>4)%150)};
};

const oldShowPlace=showPlace;
showPlace=function(k){
  if(P.has(k)) return oldShowPlace(k);
  const here=actors.filter(a=>a?.v4?.current_place_key===k&&a?.v4?.movement_state!=='WALKING');
  const going=actors.filter(a=>a?.v4?.destination_place_key===k&&a?.v4?.movement_state==='WALKING');
  const sample=here[0]?.v4||going[0]?.v4;
  if(!sample) return;
  const z=slotPos(here[0]||going[0],k);focus(z.x,z.y,1.3);
  const title=sample.current_place_key===k?(sample.current_place_th||k):(sample.destination_place_th||k);
  $('#st').textContent='✨ '+title;
  $('#sm').innerHTML='Daily / Personal Life Place · <span class="v4source">SIMULATION STATE</span>';
  const rows=[...here.map(a=>({a,s:'อยู่ที่นี่'})),...going.map(a=>({a,s:'กำลังเดินมา'}))];
  $('#sb').innerHTML=`<div class="event"><b>${here.length}</b> คนอยู่ที่นี่ · <b>${going.length}</b> กำลังมา</div>${rows.map(x=>`<button class="result" data-v4a="${esc(x.a.id)}"><b>${x.a.t==='AI'?'🤖':'👤'} ${esc(x.a.v4?.display_name_th||x.a.n)}</b><small>${esc(x.s)} · ${esc(x.a.v4?.current_activity_th||'')}</small></button>`).join('')}<div class="note"><b>PUBLIC-SAFE PERSONAL PLACE</b><br>สถานที่นี้มาจาก persistent Living World layout แม้ไม่ได้อยู่ใน technical city-map layer ปัจจุบัน</div>`;
  $$('[data-v4a]').forEach(b=>b.onclick=()=>{closeSheet();showActor(b.dataset.v4a)});openSheet();
};
})();