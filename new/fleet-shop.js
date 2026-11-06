import {MACHINES,currentMachine,FREE_MACHINE_TRIAL} from './machine-config.js?build=traffic-20261106-25';
import {loadFleet,selectMachine} from './fleet-store.js?build=traffic-20261106-25';

function silhouette(machine){
 const shovel=machine.kind==='face-shovel',tall=shovel?7:0;
 return `<svg viewBox="0 0 230 110" fill="none" aria-hidden="true"><path d="M25 92H213" stroke="#73808a" opacity=".4"/><rect x="40" y="75" width="91" height="14" rx="7" fill="#10191d" stroke="#718088" stroke-width="2"/><path d="M47 81h77" stroke="#59666b" stroke-width="5" stroke-dasharray="4 3"/><path d="M39 71V${49-tall}h37v22Zm38 0V${44-tall}h29l8 27Z" fill="currentColor"/><path d="M80 ${48-tall}h21l5 17H80Z" fill="#20363e" stroke="#9fb8bb"/><path d="M108 64L132 28l29 2 33 37" stroke="#182329" stroke-width="15" stroke-linejoin="round"/><path d="M108 64L132 28l29 2 33 37" stroke="currentColor" stroke-width="10" stroke-linejoin="round"/><path d="M115 58l16-23m29 3 26 27" stroke="#c3c7bf" stroke-width="3"/>${shovel?'<path d="M187 65h23l9 14h-30Z" fill="#6c726b" stroke="#a5aaa0"/><path d="m189 80 29-1 6-4" stroke="#c1c3b5" stroke-width="3"/>':'<path d="m194 65-20 8 2 10q18 6 26-11Z" fill="#515c5c" stroke="#a2aaa0"/>'}<path d="M43 44h29M45 44V35m25 9V35m-25 1h25" stroke="#9da5a0" stroke-width="1.5"/></svg>`;
}

export function createFleetShop({onPause,onSelect,canSelect}){
 const button=document.createElement('button');
 button.id='fleetOpen';button.className='fleet-open';button.textContent='ПАРК ТЕХНИКИ';
 button.setAttribute('aria-label','Открыть магазин экскаваторов');
 (document.querySelector('.tool-bank')||document.body).append(button);
 const dialog=document.createElement('dialog');dialog.className='fleet-dialog';
 dialog.setAttribute('aria-labelledby','fleetTitle');
 dialog.innerHTML=`<header><div><small>КАРЬЕР / ПАРК ТЕХНИКИ</small><h2 id="fleetTitle">Следующая рабочая машина</h2></div><button type="button" class="fleet-close" aria-label="Закрыть магазин">×</button></header>
 <p class="fleet-progress"></p><div class="fleet-cards"></div><p class="fleet-rules">Новые машины открываются после прохождения рабочих участков. Прогресс сохраняется в этом браузере. Выбор машины начинает новую смену и сбрасывает текущую погрузку. Объём ковша и скорость — игровые характеристики.</p><p class="fleet-message" role="status"></p>`;
 document.body.append(dialog);
 const message=dialog.querySelector('.fleet-message');
 const cards=dialog.querySelector('.fleet-cards');
 const progress=dialog.querySelector('.fleet-progress');
 function refresh(){
  const fleet=loadFleet(),current=currentMachine().id;
  progress.textContent=(FREE_MACHINE_TRIAL?'ТЕСТОВЫЙ ПАРК · ':'')+fleet.unlocked.length+' / '+MACHINES.length+' машин открыто · '+fleet.deliveries+' полных отгрузок';
  cards.replaceChildren();
  for(const machine of MACHINES){
   const unlocked=FREE_MACHINE_TRIAL||fleet.unlocked.includes(machine.id),active=machine.id===current;
   const card=document.createElement('article');card.className='fleet-card'+(active?' active':'');
   card.style.setProperty('--machine',machine.color);
   const type=machine.kind==='face-shovel'?'Прямая лопата · донная выгрузка':'Обратная лопата';
   card.innerHTML=`<div class="fleet-model" aria-hidden="true">${silhouette(machine)}</div>
    <small>${type}</small><h3>${machine.name}</h3>
    <dl><div><dt>Ковш</dt><dd>${machine.capacity} м³</dd></div><div><dt>Гидравлика</dt><dd>${Math.round(machine.speed*100)}%</dd></div></dl>
    <p>${machine.unlock===0?'Стартовая машина':'Открывается после участка '+machine.unlockLevel}</p>
    <progress value="${Math.min(fleet.deliveries,machine.unlock)}" max="${machine.unlock||1}"></progress>`;
   const action=document.createElement('button');action.type='button';action.disabled=!unlocked||active;
   action.textContent=active?'Сейчас в работе':unlocked?'Начать смену':('Пройти участок '+machine.unlockLevel);
   action.onclick=()=>{
    const permitted=canSelect();
    if(permitted!==true){message.textContent=typeof permitted==='string'?permitted:'Завершите погрузку и дождитесь разгрузки машин.';return}
    if(!selectMachine(machine.id)){message.textContent='Не удалось сохранить выбор в браузере.';return}
    onSelect(machine.id);
   };
   card.append(action);cards.append(card);
  }
 }
 function close(){dialog.close()}
 button.onclick=()=>{refresh();message.textContent='';dialog.showModal();onPause(true)};
 dialog.querySelector('.fleet-close').onclick=close;
 dialog.addEventListener('close',()=>{onPause(false);button.focus()});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close()}});
 addEventListener('storage',()=>{if(dialog.open)refresh()});
 return {refresh,close,open(){button.click()},get isOpen(){return dialog.open}};
}
