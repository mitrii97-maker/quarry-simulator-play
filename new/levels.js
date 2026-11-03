import {loadCareer} from './operator.js';
export const TRUCK_CAPACITY=100;
export let TRUCKS_PER_LEVEL=10;
export let LEVEL_TONNES=TRUCK_CAPACITY*TRUCKS_PER_LEVEL;
const EPS=1e-6;
const fresh=number=>({number,remaining:LEVEL_TONNES,excavated:0,shipped:0,dumped:0,trips:0,status:'playing'});
let current=fresh(loadCareer().nextLevel);
export function levelState(){return {...current,progress:current.excavated/LEVEL_TONNES,shippingProgress:current.shipped/LEVEL_TONNES}}
// The terrain owns its real reserve. Never squeeze a larger working face into
// the former ten-load quota; the last truck can carry a partial load.
export function setLevelReserve(tonnes){if(!Number.isFinite(tonnes)||tonnes<=EPS)throw Error('Bench geometry must contain a positive finite reserve');LEVEL_TONNES=tonnes;TRUCKS_PER_LEVEL=Math.ceil((tonnes-EPS)/TRUCK_CAPACITY);current=fresh(current.number);}
export function takeRock(requested){if(current.status!=='playing'||!Number.isFinite(requested)||requested<=0)return 0;const amount=Math.min(requested,current.remaining);current.excavated=Math.min(LEVEL_TONNES,current.excavated+amount);current.remaining=Math.max(0,LEVEL_TONNES-current.excavated);if(current.remaining<EPS){current.remaining=0;current.excavated=LEVEL_TONNES}return amount;}
export function recordDispatch(tonnes){if(current.status!=='playing'||!Number.isFinite(tonnes)||tonnes<=0)return 0;const mass=Math.min(TRUCK_CAPACITY,tonnes);current.shipped=Math.min(LEVEL_TONNES,current.shipped+mass);current.trips++;return mass;}
export function recordTransportSpill(tonnes){if(current.status!=='playing'||!Number.isFinite(tonnes)||tonnes<=0)return;current.shipped=Math.max(0,current.shipped-tonnes);}
export function recordDump(tonnes){if(current.status!=='playing'||!Number.isFinite(tonnes)||tonnes<=0)return 0;const amount=Math.min(tonnes,LEVEL_TONNES-current.dumped);current.dumped+=amount;return amount;}
export function finishIfReady(payload,inFlight){if(current.status==='playing'&&current.remaining<=EPS&&current.dumped>=LEVEL_TONNES-EPS&&payload<=.0001&&inFlight<=.0001){current.status='complete';return true}return false}
export function nextLevel(){if(current.status!=='complete')return false;current=fresh(current.number+1);return true}
