import {loadCareer} from './operator.js?build=career-20261106-19';
import {MACHINES,currentMachine,FREE_MACHINE_TRIAL} from './machine-config.js?build=career-20261106-19';
const KEY='quarry-fleet-v1';
export function loadFleet(){
 let data={};
 try{data=JSON.parse(globalThis.localStorage?.getItem(KEY)||'{}')||{}}catch{}
 const deliveries=Number.isSafeInteger(data.deliveries)&&data.deliveries>=0?data.deliveries:0;
 const credited=Array.isArray(data.credited)?data.credited.filter(id=>typeof id==='string'&&id.length<=120):[];
 return {deliveries,credited,selected:currentMachine().id,unlocked:MACHINES.filter(m=>FREE_MACHINE_TRIAL||loadCareer().completed>=m.unlockLevel).map(m=>m.id)};
}
export function recordDelivery(id,tonnes){
 const fleet=loadFleet();
 if(typeof id!=='string'||!id||id.length>120||!Number.isFinite(tonnes)||tonnes<98||fleet.credited.includes(id))return {...fleet,awarded:false};
 const next={version:1,deliveries:fleet.deliveries+1,credited:[...fleet.credited,id]};
 try{globalThis.localStorage.setItem(KEY,JSON.stringify(next));return {...loadFleet(),awarded:true}}
 catch{return {...fleet,awarded:false,storageError:true}}
}
export function selectMachine(id){
 const machine=MACHINES.find(m=>m.id===id),fleet=loadFleet();
 if(!machine||!FREE_MACHINE_TRIAL&&!fleet.unlocked.includes(machine.id))return false;
 try{globalThis.localStorage.setItem('quarry-machine-v1',id);return true}catch{return false}
}
