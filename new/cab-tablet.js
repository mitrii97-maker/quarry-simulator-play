import * as T from '../three.module.js?build=fix-20261106-22';
import {roundedBlock} from './sculpted.js?build=fix-20261106-22';
const pages=['ПОГРУЗКА','МАШИНА','СМЕНА'];
const n=(v,d=0)=>Number(v||0).toLocaleString('ru-RU',{maximumFractionDigits:d});
export function tabletRows(data,page){const s=data.systems||{},l=data.level||{};
 if(page===1)return [['Обороты',n(s.rpm)+' об/мин'],['Охлаждение / масло',n(s.temperature)+' / '+n(s.hydraulicTemperature)+' °C'],['Гидравлика',n(s.load*100)+'%'],['Топливо',n(s.fuel,1)+' / '+n(s.tank)+' л'],['Состояние',n(s.condition*100)+'%']];
 if(page===2)return [['Погружено',n(l.loaded,1)+' / '+n(l.target)+' т'],['Доставлено',n(l.dumped,1)+' т'],['Рейсы за смену',n(data.trips)],['Заработано',n(l.money)+' ₽'],['Участок',n(l.number)+' · '+(l.title||'')]];
 const capacity=data.truckCapacity||100;
 return [['КОВШ',n(Math.max(0,Math.min(1,data.fill||0))*100)+'%'],['КУЗОВ',data.truckPresent===false?'—':n(Math.max(0,Math.min(1,(data.truckMass||0)/capacity))*100)+'%'],['Масса в ковше',n(data.bucketMass,1)+' т'],['Масса в кузове',data.truckPresent===false?'Самосвал не подан':n(data.truckMass,1)+' / '+n(capacity)+' т'],['Очередь',data.queue||'Свободна']];
}
export function makeCabTablet(cab,M,machine){
 const group=new T.Group();group.position.set(.56,.80,.46);group.scale.setScalar(1.45);group.rotation.y=-Math.PI/2;cab.add(group);
 roundedBlock(group,M.dark,[.48,.35,.055],[0,0,0],.025);
 const canvas=document.createElement('canvas');canvas.width=960;canvas.height=640;const ctx=canvas.getContext('2d'),map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
 const material=new T.MeshBasicMaterial({map,toneMapped:false});const screen=new T.Mesh(new T.PlaneGeometry(.425,.283),material);screen.position.z=.031;screen.name='Interactive industrial cab tablet';group.add(screen);
 let page=0,key='',lastData={};
 function update(data={}){lastData=data;const rows=tabletRows(data,page),next=JSON.stringify([page,rows]);if(next===key)return;key=next;
  ctx.fillStyle='#102329';ctx.fillRect(0,0,960,640);ctx.fillStyle='#88aaa9';ctx.font='bold 30px Arial';ctx.fillText(machine.name.toUpperCase(),32,43);
  for(let i=0;i<3;i++){ctx.fillStyle=i===page?'#d2b56d':'#264047';ctx.fillRect(20+i*310,65,300,61);ctx.fillStyle=i===page?'#14262b':'#b7cdcb';ctx.font='bold 27px Arial';ctx.fillText(pages[i],42+i*310,106);}
  if(page===0){for(let i=0;i<2;i++){const x=24+i*470;ctx.fillStyle='#1d373e';ctx.fillRect(x,150,442,300);ctx.fillStyle='#97b9b8';ctx.font='bold 36px Arial';ctx.fillText(rows[i][0],x+22,203);ctx.fillStyle='#f2e6ba';ctx.font='bold 112px Arial';ctx.fillText(rows[i][1],x+22,326);ctx.fillStyle='#e3ece5';ctx.font='bold 36px Arial';ctx.fillText(rows[i+2][1],x+22,405);}ctx.fillStyle='#9ab8b7';ctx.font='32px Arial';ctx.fillText(rows[4][1],32,518);}
  else for(let i=0;i<rows.length;i++){const y=182+i*87;ctx.fillStyle='#7fa3a5';ctx.font='27px Arial';ctx.fillText(rows[i][0],32,y);ctx.fillStyle='#edf2e6';ctx.font=i===4?'bold 26px Arial':'bold 37px Arial';ctx.fillText(rows[i][1],32,y+42);}
  ctx.fillStyle='#d4bb7c';ctx.font='22px Arial';ctx.fillText('КОСНУТЬСЯ ДЛЯ УВЕЛИЧЕНИЯ · TAB',32,620);map.needsUpdate=true;
 }
 update();return {group,screen,update,setPage(value){page=Math.max(0,Math.min(2,value));key='';update(lastData);},get page(){return page},pick(uv){if(uv.y>.80){page=Math.min(2,Math.floor(uv.x*3));key='';update(lastData);return 'tab';}return 'expand';}};
}
export function createTabletPanel({readData,onPause,onFleet,onOptions,onCamera,physical}){
 const dialog=document.createElement('dialog');dialog.className='cab-tablet-dialog';dialog.setAttribute('aria-label','Бортовой планшет экскаватора');
 dialog.innerHTML='<header><div><small>QUARRY SYSTEMS / БОРТОВОЙ КОНТРОЛЛЕР</small><h2>Рабочая смена</h2></div><button class="tablet-close" aria-label="Закрыть планшет">×</button></header><nav aria-label="Разделы планшета"></nav><dl class="tablet-readings"></dl><p class="tablet-goal"></p><footer><button data-action="fleet">Парк техники</button><button data-action="options">Настройки</button><button data-action="camera">Камера</button></footer>';
 document.body.append(dialog);let page=0;
 const nav=dialog.querySelector('nav');for(const [i,title]of pages.entries()){const b=document.createElement('button');b.textContent=title;b.onclick=()=>{page=i;physical.setPage(i);refresh();};nav.append(b);}
 function refresh(){if(!dialog.open)return;const data=readData(),rows=tabletRows(data,page);dialog.dataset.page=String(page);dialog.querySelector('h2').textContent=data.machine;const dl=dialog.querySelector('dl');dl.replaceChildren();for(const [index,[name,value]]of rows.entries()){const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');if(page===0&&index<2)row.className='tablet-primary';dt.textContent=name;dd.textContent=value;row.append(dt,dd);dl.append(row);}dialog.querySelector('.tablet-goal').textContent='Участок '+data.level.number+' · '+data.level.title+' · цель '+n(data.level.target)+' т';[...nav.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===page)));}
 function open(){page=physical.page;dialog.showModal();onPause(true);refresh();}function close(){dialog.close();}
 dialog.querySelector('.tablet-close').onclick=close;dialog.addEventListener('close',()=>onPause(false));
 for(const [action,fn]of [['fleet',onFleet],['options',onOptions],['camera',onCamera]])dialog.querySelector('[data-action='+action+']').onclick=()=>{close();fn();};
 setInterval(refresh,400);return {open,close,refresh,get isOpen(){return dialog.open}};
}
