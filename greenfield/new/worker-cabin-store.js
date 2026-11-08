import {CABIN_ITEMS,CLEANING_PRICE} from './worker-cabin-config.js';
export const CABIN_SAVE_KEY='quarry-worker-cabin-v1';
const validMoney=n=>Number.isSafeInteger(n)&&n>=0&&n<1e12;
export function freshCabin(){return {version:1,revision:0,epoch:1,earnings:{},spent:0,visited:false,items:Object.fromEntries(Object.keys(CABIN_ITEMS).map(id=>[id,0]))};}
export function normalizeCabin(data){
 const s=freshCabin();if(!data||data.version!==1)return s;
 s.revision=validMoney(data.revision)?data.revision:0;s.epoch=Number.isSafeInteger(data.epoch)&&data.epoch>0?data.epoch:1;s.spent=validMoney(data.spent)?data.spent:0;s.visited=data.visited===true;
 for(const [id,item]of Object.entries(CABIN_ITEMS))s.items[id]=Number.isInteger(data.items?.[id])?Math.max(0,Math.min(item.prices.length,data.items[id])):0;
 for(const [id,money]of Object.entries(data.earnings||{}))if(/^\d+:\d+$/.test(id)&&validMoney(money))s.earnings[id]=money;
 s.spent=Math.min(s.spent,Object.values(s.earnings).reduce((a,b)=>a+b,0));return s;
}
export const cabinBalance=s=>Object.values(s.earnings).reduce((a,b)=>a+b,0)-s.spent;
export function cabinQuote(s,id){
 if(id==='cleaning'){const remaining=['walls','floor','ceiling'].filter(k=>s.items[k]===0);return {id,name:'Уборка бытовки',level:3-remaining.length,current:remaining.length?'Требуется уборка':'Уборка завершена',next:'Очистить стены, пол и потолок',price:Math.min(CLEANING_PRICE,remaining.reduce((n,k)=>n+CABIN_ITEMS[k].prices[0],0)),available:remaining.length>0};}
 const item=CABIN_ITEMS[id];if(!item)return null;const level=s.items[id]||0;return {id,name:item.name,level,current:item.states[level],next:item.states[level+1]||'Максимальный уровень',price:item.prices[level]||0,available:level<item.prices.length};
}
export class CabinStore{
 constructor(storage){this.storage=storage;this.error='';this.read();}
 read(){let raw;try{raw=this.storage.getItem(CABIN_SAVE_KEY);const data=JSON.parse(raw||'null');if(data&&data.version!==1)throw Error('Unsupported save');this.state=normalizeCabin(data);this.raw=raw;this.error='';}catch{this.state=this.state||freshCabin();this.error='Не удалось прочитать сохранение бытовки';}return this.state;}
 commit(next){try{this.storage.setItem(CABIN_SAVE_KEY,JSON.stringify(next));this.state=next;this.raw=JSON.stringify(next);this.error='';return true}catch{this.error='Не удалось сохранить покупку. Деньги не списаны.';return false;}}
 observe(level){this.read();if(this.error)return false;if(!Number.isSafeInteger(level.number)||level.number<1||!Number.isFinite(level.money)||level.money<0)return false;const key=this.state.epoch+':'+level.number,amount=Math.round(level.money),previous=this.state.earnings[key]||0;if(!validMoney(amount)||amount<=previous)return false;return this.commit({...this.state,revision:this.state.revision+1,earnings:{...this.state.earnings,[key]:amount}});}
 visit(){this.read();if(this.error)return false;return this.state.visited||this.commit({...this.state,visited:true,revision:this.state.revision+1});}
 nextCareer(){this.read();if(this.error)return false;return this.commit({...this.state,epoch:this.state.epoch+1,revision:this.state.revision+1});}
 purchase(id,level,revision){
  this.read();if(this.error)return {ok:false,message:this.error};const s=this.state,q=cabinQuote(s,id);
  if(!q||!q.available)return {ok:false,message:'Улучшение уже установлено'};
  if(s.revision!==revision||q.level!==level)return {ok:false,message:'Состояние обновилось. Проверьте покупку ещё раз.'};
  if(cabinBalance(s)<q.price)return {ok:false,message:'Недостаточно средств. Продолжайте работу на разрезе.'};
  const items={...s.items};if(id==='cleaning'){for(const k of ['walls','floor','ceiling'])items[k]=Math.max(1,items[k]);}else items[id]++;
  const next={...s,revision:s.revision+1,spent:s.spent+q.price,items};
  return this.commit(next)?{ok:true,message:q.name+' — установлено',price:q.price}:{ok:false,message:this.error};
 }
}
