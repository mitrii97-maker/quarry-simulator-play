import {BENCH_HEIGHT} from './layout.js?build=hotfix-20261106-20';
export function rockContact(bucket){return bucket.x>=-5&&bucket.x<=-.5&&bucket.z>=-5.5&&bucket.z<=-.5&&bucket.y>=2.7&&bucket.y<=BENCH_HEIGHT+1.5}
export function stepLoading(state,{contact,work=0,overTruck,open,truckLoads},dt){
 let {filled,fill,dump}=state;let event=null;
 if(!filled){dump=0;if(contact&&work>0){fill=Math.min(4,fill+work);if(fill>=4-1e-6){filled=true;fill=0;event='filled'}}}
 if(filled&&overTruck&&open&&truckLoads<4){dump=Math.min(1.2,dump+dt);if(dump>=1.2-1e-6){filled=false;fill=0;dump=0;event='unloaded'}}
 return {filled,fill,dump,event};
}
