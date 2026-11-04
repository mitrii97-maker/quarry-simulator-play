// Selection is read once by module consumers. Changing machines starts a new
// shift so physics constants, the shell and the capacity always use one model.
export const FREE_MACHINE_TRIAL = true;
export const MACHINES = Object.freeze([
  {id:'volvo', name:'Volvo EC750', unlock:0, capacity:7, scale:1, speed:1, kind:'backhoe', color:'#e6b631'},
  {id:'hitachi', name:'Hitachi EX1200', unlock:5, capacity:14, scale:Math.cbrt(2), speed:.86, kind:'backhoe', color:'#e97821'},
  {id:'komatsu', name:'Komatsu PC1200', unlock:10, capacity:14, scale:Math.cbrt(2), speed:1.12, kind:'backhoe', color:'#e6bd35'},
  {id:'liebherr', name:'Liebherr R 9200', unlock:15, capacity:18, scale:Math.cbrt(18/7), speed:.88, kind:'face-shovel', color:'#e8dfc5'}
].map(Object.freeze));

export function getMachineConfig(id) {
  return MACHINES.find(machine => machine.id === id) || MACHINES[0];
}

export function currentMachine() {
  try {
    const machine = getMachineConfig(globalThis.localStorage?.getItem('quarry-machine-v1'));
    const fleet = JSON.parse(globalThis.localStorage?.getItem('quarry-fleet-v1') || '{}');
    const deliveries = Number.isSafeInteger(fleet?.deliveries) && fleet.deliveries >= 0 ? fleet.deliveries : 0;
    return FREE_MACHINE_TRIAL || deliveries >= machine.unlock ? machine : MACHINES[0];
  } catch {
    return MACHINES[0];
  }
}
