const ACTIVE_STATES=new Set(['coming','queueing','staging','backing','repositioning','ready']);
export const validActiveTruck=truck=>!!truck&&ACTIVE_STATES.has(truck.state);
export const parkedTruckIndex=trucks=>trucks.findIndex(truck=>truck.state==='parked');
