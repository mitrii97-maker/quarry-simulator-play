import {loadCareer} from './operator.js?build=career-20261106-19';
import {levelConfig} from './career-config.js?build=career-20261106-19';
export const TRUCK_CAPACITY=100;
export let LEVEL_TONNES=levelConfig(loadCareer().nextLevel).targetTonnes;
export let TRUCKS_PER_LEVEL=Math.ceil(LEVEL_TONNES/TRUCK_CAPACITY);
const EPS=1e-6;
const fresh=number=>({number,target:levelConfig(number).targetTonnes,remaining:0,reserve:0,excavated:0,loaded:0,shipped:0,dumped:0,trips:0,status:'playing'});
let current=fresh(loadCareer().nextLevel);
export function levelState(){return {...current,title:levelConfig(current.number).title,goalRemaining:Math.max(0,current.target-current.loaded),progress:Math.min(1,current.loaded/current.target),shippingProgress:Math.min(1,current.dumped/current.target),money:Math.round(current.dumped*levelConfig(current.number).payPerTonne)}}
export function setLevelReserve(tonnes){if(!Number.isFinite(tonnes)||tonnes<=EPS)throw Error('Invalid bench reserve');current.reserve=tonnes;current.remaining=Math.max(0,tonnes-current.excavated);LEVEL_TONNES=current.target;TRUCKS_PER_LEVEL=Math.ceil(LEVEL_TONNES/TRUCK_CAPACITY);}
export function takeRock(requested){if(current.status!=='playing'||!Number.isFinite(requested)||requested<=0)return 0;const mass=Math.min(requested,current.remaining);current.excavated+=mass;current.remaining=Math.max(0,current.remaining-mass);return mass;}
export function recordLoaded(mass){if(current.status==='playing'&&Number.isFinite(mass)&&mass>0)current.loaded+=mass;}
export function recordDispatch(mass){if(current.status!=='playing'||!Number.isFinite(mass)||mass<=0)return 0;mass=Math.min(TRUCK_CAPACITY,mass);current.shipped+=mass;current.trips++;return mass;}
export function recordTransportSpill(mass){if(Number.isFinite(mass)&&mass>0)current.shipped=Math.max(0,current.shipped-mass);}
export function recordDump(mass){if(current.status!=='playing'||!Number.isFinite(mass)||mass<=0)return 0;current.dumped+=mass;return mass;}
export function finishIfReady(payload,inFlight){if(current.status==='playing'&&current.dumped>=current.target-EPS&&payload<=.0001&&inFlight<=.0001){current.status='complete';return true;}return false;}
export function nextLevel(){if(current.status!=='complete')return false;current=fresh(current.number+1);LEVEL_TONNES=current.target;TRUCKS_PER_LEVEL=Math.ceil(LEVEL_TONNES/TRUCK_CAPACITY);return true;}
export function restoreLevel(saved){if(!saved||!Number.isSafeInteger(saved.number)||saved.number<1)throw Error('Invalid saved level');for(const k of ['remaining','excavated','shipped','dumped','trips'])if(!Number.isFinite(saved[k])||saved[k]<0)throw Error('Invalid counters');current={...fresh(saved.number),...saved,target:levelConfig(saved.number).targetTonnes,loaded:saved.loaded??saved.shipped};LEVEL_TONNES=current.target;TRUCKS_PER_LEVEL=Math.ceil(LEVEL_TONNES/TRUCK_CAPACITY);}
