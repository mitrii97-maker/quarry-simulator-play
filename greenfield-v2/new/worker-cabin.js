import {CABIN_ITEMS,CABIN_GREETING,roubles} from './worker-cabin-config.js';
import {CabinStore,cabinBalance,cabinQuote} from './worker-cabin-store.js';
import {showForemanMessage} from './foreman-intro.js?v=greenfield-boot-3';

export function installWorkerCabin({renderer,environment,storage=localStorage,readLevel,onPause,onReturn,getQuality}){
 const store=new CabinStore(storage);let open=false,room=null,selected='cleaning',frame=0,loaded=false,purchasing=false,disposed=false,clock=0,token=0,briefing=null,savedExposure=1,savedAuto=false;
 const root=document.createElement('section');root.id='workerCabin';root.className='worker-cabin';root.hidden=true;root.setAttribute('aria-label','Бытовка машиниста');
 root.innerHTML=`<header class="wc-top"><div><small>ПОСЛЕ СМЕНЫ</small><h1>Бытовка</h1></div><div><small>ДОСТУПНО</small><strong id="wcBalance">0 ₽</strong></div><button id="wcExit">Вернуться к работе ↗</button></header><p id="wcLoading" role="status">Открываем бытовку…</p><button id="wcCatalogToggle" class="wc-catalog-toggle" aria-expanded="false">Ремонт и обустройство</button><nav id="wcCatalog" class="wc-catalog" aria-label="Ремонт и предметы" hidden></nav><aside id="wcPurchase" class="wc-purchase" hidden><header><small>ОБУСТРОЙСТВО</small><button id="wcPanelClose" aria-label="Закрыть панель покупки">×</button></header><h2 id="wcItemTitle"></h2><dl><div><dt>Сейчас</dt><dd id="wcCurrent"></dd></div><div><dt>После ремонта</dt><dd id="wcNext"></dd></div></dl><div class="wc-price"><strong id="wcPrice"></strong><button id="wcBuy">Купить</button></div><p id="wcMessage" role="status"></p></aside><footer class="wc-controls"><span id="wcHint">Потяните экран — осмотритесь. Нажмите на предмет — выберите.</span><div><button data-step="0,-1" aria-label="Шаг влево">←</button><button data-step="1,0" aria-label="Шаг вперёд">↑</button><button data-step="-1,0" aria-label="Шаг назад">↓</button><button data-step="0,1" aria-label="Шаг вправо">→</button><button id="wcHome" aria-label="Вернуть исходный вид">⌂</button></div></footer><p id="wcHover" class="wc-hover" hidden></p>`;
 document.body.append(root);const $=id=>root.querySelector('#'+id),purchase=$('wcPurchase'),catalog=$('wcCatalog');
 for(const id of ['cleaning',...Object.keys(CABIN_ITEMS)]){const button=document.createElement('button');button.dataset.item=id;button.textContent=id==='cleaning'?'Уборка бытовки':CABIN_ITEMS[id].name;button.onclick=()=>select(id);catalog.append(button);}
 const buttons=[];for(const parent of [document.querySelector('#quarryMenu .menu-actions'),document.querySelector('.level-card')]){if(!parent)continue;const b=document.createElement('button');b.textContent='Бытовка';b.className='worker-cabin-entry';b.onclick=()=>visit();parent.append(b);buttons.push(b);}
 let activeEvents=null,previousFocus=null;const uiElements=[...document.querySelectorAll('.telemetry,.tool-bank,.travel-controls,.joystick,#levelFinish,#foremanIntro')],inertValues=new Map();
 function syncIncome(){store.observe(readLevel());}
 function updatePanel(){
  const s=store.read(),q=cabinQuote(s,selected);$('wcBalance').textContent=roubles(cabinBalance(s));if(!q)return;
  $('wcItemTitle').textContent=q.name;$('wcCurrent').textContent=q.current;$('wcNext').textContent=q.next;$('wcPrice').textContent=q.available?roubles(q.price):'Установлено';$('wcBuy').disabled=!q.available||purchasing;$('wcBuy').textContent=q.available?'Купить':'Готово';
  $('wcBuy').dataset.level=q.level;$('wcBuy').dataset.revision=s.revision;for(const b of catalog.querySelectorAll('button')){const quote=cabinQuote(s,b.dataset.item);b.setAttribute('aria-pressed',String(b.dataset.item===selected));b.dataset.complete=String(!quote.available);}
 }
 function select(id){selected=id;purchase.hidden=false;catalog.hidden=true;$('wcCatalogToggle').setAttribute('aria-expanded','false');$('wcMessage').textContent='';updatePanel();room?.focus(id);requestDraw();}
 function requestDraw(){if(frame||!open||!room)return;frame=requestAnimationFrame(()=>{frame=0;if(!open||!room)return;renderer.info.reset();renderer.render(room.scene,room.camera);const s=room.stats();root.dataset.triangles=s.triangles;root.dataset.objects=s.objects;root.dataset.drawCalls=renderer.info.render.calls;root.dataset.pose=JSON.stringify(room.pose);});}
 function resize(){if(!room)return;const w=Math.round(window.visualViewport?.width||innerWidth),h=Math.round(window.visualViewport?.height||innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,getQuality().dpr));renderer.setSize(w,h);room.resize(w,h);requestDraw();}
 async function visit(){
  if(open||disposed)return;syncIncome();open=true;const mine=++token;previousFocus=document.activeElement;root.hidden=false;document.body.classList.add('worker-cabin-active');for(const el of uiElements){inertValues.set(el,el.inert);el.inert=true;}onPause(true);$('wcExit').focus();$('wcLoading').hidden=false;$('wcLoading').textContent='Открываем бытовку…';savedExposure=renderer.toneMappingExposure;savedAuto=renderer.shadowMap.autoUpdate;
  try{
   const {createCabinScene}=await import('./worker-cabin-scene.js');if(!open||token!==mine)return;
   room=createCabinScene({renderer,environment,items:{...store.state.items},onSelect:select,onHover(id){$('wcHover').hidden=!id;$('wcHover').textContent=CABIN_ITEMS[id]?.name||'';},onRender:requestDraw});
   const sun=room.scene.children.find(o=>o.isDirectionalLight);if(getQuality().name==='economy')sun.shadow.mapSize.set(512,512);
   renderer.toneMappingExposure=.86;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;resize();attach();loaded=true;$('wcLoading').hidden=true;updatePanel();requestDraw();
   if(!store.state.visited){briefing=showForemanMessage({text:CABIN_GREETING,onClose(){briefing=null;store.visit();$('wcExit').focus();}});}
  }catch(error){$('wcLoading').textContent='Не удалось открыть помещение. Можно вернуться к работе.';root.dataset.error=String(error.message);}
 }
 function close(){
  if(!open)return;open=false;token++;briefing?.close();briefing=null;activeEvents?.abort();activeEvents=null;cancelAnimationFrame(frame);frame=0;room?.dispose();room=null;renderer.renderLists.dispose();renderer.toneMappingExposure=savedExposure;renderer.shadowMap.autoUpdate=savedAuto;renderer.shadowMap.needsUpdate=true;loaded=false;root.hidden=true;purchase.hidden=true;catalog.hidden=true;document.body.classList.remove('worker-cabin-active');for(const [el,v]of inertValues)el.inert=v;inertValues.clear();onPause(false);onReturn();previousFocus?.focus();
 }
 function attach(){
  activeEvents=new AbortController();const signal=activeEvents.signal,canvas=renderer.domElement;let drag=null;
  canvas.addEventListener('pointerdown',e=>{if(!open||briefing||e.button>0||drag)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);},{signal});
  canvas.addEventListener('pointermove',e=>{if(!open||briefing)return;if(drag&&e.pointerId===drag.id){const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.moved||=Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>6;if(drag.moved){room.rotate(dx,dy);requestDraw();}drag.x=e.clientX;drag.y=e.clientY;}else if(e.pointerType==='mouse')room.hover(e.clientX,e.clientY);},{signal});
  canvas.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;const click=!drag.moved;drag=null;if(click)room.select(e.clientX,e.clientY);},{signal});for(const name of ['pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>{drag=null;},{signal});
  window.addEventListener('resize',resize,{signal});window.visualViewport?.addEventListener('resize',resize,{signal});window.addEventListener('keydown',e=>{if(!open||briefing||e.target?.tagName==='SELECT')return;if(e.key==='Escape'){e.preventDefault();close();return;}const step={KeyW:[1,0],KeyS:[-1,0],KeyA:[0,-1],KeyD:[0,1],ArrowUp:[1,0],ArrowDown:[-1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]}[e.code];if(step){e.preventDefault();room.move(...step);requestDraw();}}, {signal});
 }
 $('wcExit').onclick=close;$('wcHome').onclick=()=>{room?.home();requestDraw();};for(const b of root.querySelectorAll('[data-step]'))b.onclick=()=>{room?.move(...b.dataset.step.split(',').map(Number));requestDraw();};
 $('wcPanelClose').onclick=()=>{purchase.hidden=true;room?.focus(null);};$('wcCatalogToggle').onclick=()=>{catalog.hidden=!catalog.hidden;$('wcCatalogToggle').setAttribute('aria-expanded',String(!catalog.hidden));};
 $('wcBuy').onclick=async()=>{
  if(purchasing||!room)return;purchasing=true;const id=selected,level=Number($('wcBuy').dataset.level),revision=Number($('wcBuy').dataset.revision);updatePanel();
  const run=()=>store.purchase(id,level,revision);let result;try{result=globalThis.navigator?.locks?await navigator.locks.request('quarry-worker-cabin-wallet',run):run();}catch{result={ok:false,message:'Покупка не выполнена. Попробуйте ещё раз.'};}
  purchasing=false;if(result.ok&&open&&room)room.update(store.state.items);updatePanel();$('wcMessage').textContent=result.message;requestDraw();
 };
 const storageChanged=e=>{if(e.key==='quarry-worker-cabin-v1'&&open){store.read();room?.update(store.state.items);updatePanel();}};window.addEventListener('storage',storageChanged);
 return {get isOpen(){return open},get store(){return store},open:visit,close,observe(dt){clock+=dt;if(clock<1)return;clock=0;syncIncome();},beforeNextLevel:syncIncome,newCareer(){store.nextCareer();},snapshot(){return {enabled:true,open,loaded,balance:cabinBalance(store.read()),items:{...store.state.items},stats:room?.stats()||null,error:store.error}},dispose(){close();disposed=true;window.removeEventListener('storage',storageChanged);root.remove();for(const b of buttons)b.remove();}};
}
