import './style.css';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);
const overlay = $('overlay'), upgradeModal = $('upgrade-modal');
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const rnd = (a,b)=>a+Math.random()*(b-a);
let W=innerWidth,H=innerHeight,dpr=1;
let state='menu', last=0, elapsed=0, spawnClock=0, flash=0, toastTimer=0;
let level=Number(localStorage.getItem('ar_level')||1);
let coins=Number(localStorage.getItem('ar_coins')||0);
let troopUpgrade=Number(localStorage.getItem('ar_tu')||0);
let damageUpgrade=Number(localStorage.getItem('ar_du')||0);
let troops=5, enemies=0, distance=0, playerX=0, targetX=0, gates=[], hazards=[], shots=[], particles=[], foes=[];
let runCoins=0, runKills=0, boss=null, pauseFrom='run';
const MAX_TROOPS=250;
const laneWidth=0.72;
const palette={sky:'#0c1c2e',ground:'#233d4b',lane:'#2c5260',edge:'#4c8993',blue:'#55d9ff',gold:'#ffca68',red:'#ff6378',green:'#79f5bb'};
function resize(){dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=Math.floor(W*dpr);canvas.height=Math.floor(H*dpr);canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();
function save(){localStorage.setItem('ar_level',level);localStorage.setItem('ar_coins',coins);localStorage.setItem('ar_tu',troopUpgrade);localStorage.setItem('ar_du',damageUpgrade)}
function hud(){ $('coins').textContent=coins.toLocaleString('tr-TR');$('troops').textContent=troops;$('level').textContent='BÖLÜM '+level;$('distance').textContent=Math.round(distance)+'%';$('progress-fill').style.width=distance+'%'}
function say(t){const el=$('toast');el.textContent=t;el.classList.add('show');toastTimer=1.2}
function showOverlay(title,text,action='BÖLÜMÜ BAŞLAT'){ $('overlay-title').textContent=title;$('overlay-text').textContent=text;$('main-action').innerHTML=action+' <span>→</span>';overlay.classList.remove('hidden');$('hint').style.display='none'}
function hideOverlay(){overlay.classList.add('hidden');$('hint').style.display='block'}
function openUpgrades(){upgradeModal.classList.remove('hidden');updateUpgrades()}
function updateUpgrades(){ $('troop-upgrade-info').textContent=`Seviye ${troopUpgrade} • +${troopUpgrade} başlangıç askeri`;$('damage-upgrade-info').textContent=`Seviye ${damageUpgrade} • +${damageUpgrade*8}% saldırı`;const tc=50+troopUpgrade*40,dc=75+damageUpgrade*55;$('upgrade-troops').textContent='🪙 '+tc;$('upgrade-damage').textContent='🪙 '+dc;$('upgrade-troops').disabled=coins<tc;$('upgrade-damage').disabled=coins<dc}
$('secondary-action').onclick=openUpgrades;$('close-upgrades').onclick=()=>upgradeModal.classList.add('hidden');
$('upgrade-troops').onclick=()=>{const c=50+troopUpgrade*40;if(coins>=c){coins-=c;troopUpgrade++;save();updateUpgrades();hud();say('Başlangıç birliği güçlendi!')}};
$('upgrade-damage').onclick=()=>{const c=75+damageUpgrade*55;if(coins>=c){coins-=c;damageUpgrade++;save();updateUpgrades();hud();say('Saldırı gücü arttı!')}};
$('pause').onclick=()=>{if(state==='run'){state='paused';pauseFrom='run';showOverlay('Oyun duraklatıldı','Birliğin hazır olduğunda devam et.','DEVAM ET')}else if(state==='paused'){state='run';hideOverlay()}};
$('main-action').onclick=()=>{if(state==='menu'||state==='won'||state==='lost'){startRun()}else if(state==='paused'){state='run';hideOverlay()}};
function startRun(){state='run';elapsed=0;spawnClock=0;distance=0;troops=Math.min(MAX_TROOPS,5+troopUpgrade);playerX=targetX=0;gates=[];hazards=[];shots=[];particles=[];foes=[];boss=null;runCoins=0;runKills=0;enemies=0;flash=0;hideOverlay();$('pause').style.display='block';makeCourse();hud()}
function makeCourse(){
  // Course events are spaced so the player has time to react on a phone.
  const types=['add','mult','add','hazard','mult','add','hazard','add','mult'];
  for(let i=0;i<types.length;i++){
    const z=12+i*8.3;
    const type=types[i];
    if(type==='add'){const n=[5,10,15,20][Math.floor(Math.random()*4)];gates.push({z,xs:[-.42,.42],choices:[{kind:'add',n,label:'+'+n,color:'#36c9ec'},{kind:'add',n:Math.max(2,n-3),label:'+'+Math.max(2,n-3),color:'#6c8bff'}],done:false})}
    else if(type==='mult'){gates.push({z,xs:[-.42,.42],choices:[{kind:'mult',n:2,label:'×2',color:'#4de5bd'},{kind:'mult',n:3,label:'×3',color:'#a78bfa'}],done:false})}
    else hazards.push({z,x:rnd(-.4,.4),hit:false,kind:Math.random()>.5?'barrier':'mine'});
  }
  foes.push({z:96,x:0,hp:Math.max(20,20+level*7),maxHp:Math.max(20,20+level*7),boss:true,fire:0});
}
function project(z,x=0){const depth=clamp(1-z/110,0,1);const y=H*(.21+depth*.77);const perspective=.22+depth*.9;return {x:W/2+x*W*.37*perspective,y,scale:perspective}}
function spawnParticle(x,y,color,n=7){for(let i=0;i<n;i++)particles.push({x,y,vx:rnd(-90,90),vy:rnd(-130,30),life:rnd(.25,.65),max:.65,color,size:rnd(2,5)})}
function loseTroops(n){const lost=Math.min(troops,n);troops-=lost;flash=.25;spawnParticle(W/2+playerX*W*.25,H*.72,palette.red,12);say('-'+lost+' asker');if(troops<=0)finish(false)}
function collectGate(g,side){if(g.done)return;g.done=true;const c=g.choices[side];if(c.kind==='add')troops=Math.min(MAX_TROOPS,troops+c.n);else troops=Math.min(MAX_TROOPS,troops*c.n);spawnParticle(W/2+playerX*W*.25,H*.7,c.color,14);say(c.kind==='add'?'+'+c.n+' asker':'×'+c.n+' BİRLİK!');hud()}
function finish(win){if(state!=='run')return;state=win?'won':'lost';if(win){const reward=Math.round(25+troops*.8+level*5);runCoins+=reward;coins+=runCoins;level++;save();showOverlay('ZAFER!','Düşman hattını geçtin. Ödüllerin kasana eklendi.','SONRAKİ BÖLÜM')}else{coins+=runCoins;save();showOverlay('BİRLİK DAĞILDI','Koşu sona erdi. Topladığın jetonlar sende kaldı.','TEKRAR DENE')}$('summary').innerHTML=`<div><b>${runKills}</b>Yenilen</div><div><b>${troops}</b>Kalan asker</div><div><b>🪙 ${runCoins}</b>Koşu ödülü</div>`;hud()}
function update(dt){
 if(state!=='run')return;
 elapsed+=dt;distance=clamp(elapsed/42*100,0,100);
 playerX+=(targetX-playerX)*Math.min(1,dt*10);
 spawnClock+=dt;
 if(spawnClock>.5){spawnClock=0;const sx=W/2+playerX*W*.25;for(let i=0;i<Math.min(8,Math.ceil(troops/10));i++)shots.push({x:sx+rnd(-14,14),y:H*.69+rnd(-8,8),vy:-rnd(230,350),life:1})}
 const worldSpeed=17+level*.25;
 gates.forEach(g=>{g.z-=worldSpeed*dt;if(!g.done&&g.z<7&&g.z>0){const side=playerX<0?0:1;collectGate(g,side)}});
 hazards.forEach(h=>{h.z-=worldSpeed*dt;if(!h.hit&&h.z<5&&h.z>0&&Math.abs(playerX-h.x)<.32){h.hit=true;loseTroops(Math.max(1,Math.ceil(troops*.13)));}});
 foes.forEach(f=>{f.z-=worldSpeed*dt;if(f.z<7){f.fire+=dt;if(f.fire>1.1){f.fire=0;const damage=Math.max(1,Math.ceil((f.boss?3:1)-damageUpgrade*.1));loseTroops(damage)}}});
 shots.forEach(s=>{s.y+=s.vy*dt;s.life-=dt;if(boss&&boss.hp>0&&s.y<H*.36){boss.hp-=Math.max(1,1+damageUpgrade*.08);s.life=0;spawnParticle(s.x,s.y,palette.gold,2)}});
 shots=shots.filter(s=>s.life>0&&s.y>0);
 if(foes.length&&foes[0].z<8&&!boss){boss=foes.shift();say('BOSS SAVAŞI!')}
 if(boss&&boss.hp>0){boss.fire+=dt;if(boss.fire>1.25){boss.fire=0;const dmg=Math.max(1,Math.ceil(2+level*.15));loseTroops(dmg)}if(boss.hp<=0){runKills++;spawnParticle(W/2,H*.34,palette.gold,35);boss.dead=true;boss=null;finish(true)}}
 particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=180*dt;p.life-=dt});particles=particles.filter(p=>p.life>0);
 if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('toast').classList.remove('show')}
 if(flash>0)flash-=dt;
 if(distance>=100&&state==='run'){if(boss&&boss.hp>0){boss.hp-=dt*(10+troops*.12)}else finish(true)}
 hud();
}
function rounded(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
function draw(){
 ctx.clearRect(0,0,W,H);
 const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#10233a');sky.addColorStop(.48,'#427b86');sky.addColorStop(1,'#182c3a');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 // stylized distant ridges
 ctx.fillStyle='#244655';ctx.beginPath();ctx.moveTo(0,H*.36);for(let x=0;x<=W;x+=W/6)ctx.lineTo(x,H*(.25+Math.abs(Math.sin(x*0.017))*0.08));ctx.lineTo(W,H*.55);ctx.lineTo(0,H*.55);ctx.fill();
 // perspective track
 ctx.fillStyle='#1b3645';ctx.beginPath();ctx.moveTo(W*.39,H*.19);ctx.lineTo(W*.61,H*.19);ctx.lineTo(W*1.05,H);ctx.lineTo(-W*.05,H);ctx.fill();
 ctx.strokeStyle='#74c3c6';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W*.39,H*.19);ctx.lineTo(-W*.05,H);ctx.moveTo(W*.61,H*.19);ctx.lineTo(W*1.05,H);ctx.stroke();
 // dashed lane markings
 ctx.strokeStyle='#9bd5d14d';ctx.lineWidth=1.5;ctx.setLineDash([14,14]);ctx.beginPath();ctx.moveTo(W*.5,H*.2);ctx.lineTo(W*.5,H);ctx.stroke();ctx.setLineDash([]);
 gates.forEach(g=>{if(g.z<0||g.z>105)return;const p=project(g.z);g.choices.forEach((c,i)=>{const x=p.x+cX(i,p);const w=clamp(42*p.scale,12,W*.23),h=clamp(46*p.scale,14,48);rounded(x-w/2,p.y-h,w,h,6,c.color);ctx.strokeStyle='#ffffffaa';ctx.lineWidth=1.5;ctx.strokeRect(x-w/2,p.y-h,w,h);ctx.fillStyle='#07182a';ctx.font=`900 ${Math.max(10,13*p.scale)}px system-ui`;ctx.textAlign='center';ctx.fillText(c.label,x,p.y-h/2+5*p.scale)})});
 hazards.forEach(h=>{if(h.z<0||h.z>105)return;const p=project(h.z,h.x);const w=24*p.scale;rounded(p.x-w/2,p.y-w/2,w,w,4,h.kind==='mine'?'#f15f6d':'#e4a84f');ctx.fillStyle='#172336';ctx.font=`bold ${Math.max(8,12*p.scale)}px system-ui`;ctx.textAlign='center';ctx.fillText('!',p.x,p.y+4*p.scale)});
 // little stylized troop formation
 const count=Math.min(troops,42),rows=Math.ceil(count/6);
 for(let i=0;i<count;i++){const row=Math.floor(i/6),col=i%6;const x=W/2+playerX*W*.25+(col-2.5)*Math.min(11,W*.025)+(row%2)*3;const y=H*.74+row*Math.min(9,H*.012);drawSoldier(x,y,Math.max(.55,Math.min(1,W/390)),i===0)}
 // boss
 if(boss){const p=project(Math.max(0,boss.z));const size=clamp(58*p.scale,35,95);ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(p.x,p.y,size*.8,size*.25,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#bb536c';ctx.beginPath();ctx.moveTo(p.x-size*.45,p.y-size*.8);ctx.lineTo(p.x+size*.45,p.y-size*.8);ctx.lineTo(p.x+size*.6,p.y);ctx.lineTo(p.x-size*.6,p.y);ctx.closePath();ctx.fill();ctx.fillStyle='#ffdb9c';ctx.fillRect(p.x-size*.24,p.y-size*.55,size*.13,5);ctx.fillRect(p.x+size*.1,p.y-size*.55,size*.13,5);rounded(W*.25,H*.19,W*.5,7,4,'#07121eaa');rounded(W*.25,H*.19,W*.5*clamp(boss.hp/boss.maxHp,0,1),7,4,'#ff617b');ctx.fillStyle='#fff';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillText('BOSS',W/2,H*.175)}
 shots.forEach(s=>{ctx.fillStyle='#ffe18c';ctx.shadowColor='#ffb84c';ctx.shadowBlur=8;ctx.beginPath();ctx.arc(s.x,s.y,2.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0});
 particles.forEach(p=>{ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size)});ctx.globalAlpha=1;
 if(flash>0){ctx.fillStyle=`rgba(255,60,80,${flash*.35})`;ctx.fillRect(0,0,W,H)}
 if(state==='run'){ctx.fillStyle='#fff';ctx.font='800 11px system-ui';ctx.textAlign='center';ctx.fillText('BİRLİK GÜCÜ  '+troops,W/2,H*.92)}
}
function cX(i,p){return (i===0?-.42:.42)*W*.37*p.scale+W/2}
function drawSoldier(x,y,s,lead=false){ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(0,2,6,3,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=lead?'#b8f9ff':'#3cc6f2';ctx.fillRect(-5,-14,10,13);ctx.fillStyle='#152f50';ctx.fillRect(-5,-3,4,7);ctx.fillRect(1,-3,4,7);ctx.fillStyle='#d8e9e7';ctx.beginPath();ctx.arc(0,-17,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#294c68';ctx.fillRect(-6,-22,12,4);ctx.fillStyle='#ffda8a';ctx.fillRect(4,-13,8,2);ctx.restore()}
function frame(t){const dt=Math.min(.04,(t-last)/1000||0);last=t;update(dt);draw();requestAnimationFrame(frame)}
requestAnimationFrame(frame);
let pointerDown=false,startPointerX=0,startPlayerX=0;
canvas.addEventListener('pointerdown',e=>{if(state!=='run')return;pointerDown=true;startPointerX=e.clientX;startPlayerX=targetX;canvas.setPointerCapture?.(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!pointerDown||state!=='run')return;const delta=(e.clientX-startPointerX)/(W*.36);targetX=clamp(startPlayerX+delta,-.9,.9)});
canvas.addEventListener('pointerup',()=>pointerDown=false);canvas.addEventListener('pointercancel',()=>pointerDown=false);
showOverlay('Birliğini büyüt!','Kapılardan doğru seçimler yap, engellerden kaç ve düşman hattını aş.','BÖLÜMÜ BAŞLAT');hud();
