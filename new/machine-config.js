// Selection is read once by module consumers. Changing machines starts a new
// shift so physics constants, the shell and the capacity always use one model.
export const FREE_MACHINE_TRIAL = false;
export const MACHINES = Object.freeze([
  {id:'volvo', name:'Volvo EC750', unlock:0, capacity:7, scale:1, speed:1, kind:'backhoe', color:'#e6b631',unlockLevel:0,mass:75,engineKw:397,digForce:1.0,response:.11,slewInertia:.23,vibration:.020,tank:800,idleFuel:16,fullFuel:72,hydraulics:{boom:.44,stick:.60,curl:1.02,yaw:.55}},
  {id:'hitachi', name:'Hitachi EX1200', unlock:5, capacity:14, scale:Math.cbrt(2), speed:.86, kind:'backhoe', color:'#e97821',unlockLevel:1,mass:118,engineKw:567,digForce:1.35,response:.13,slewInertia:.31,vibration:.016,tank:1400,idleFuel:23,fullFuel:104,hydraulics:{boom:.40,stick:.55,curl:.90,yaw:.46}},
  {id:'komatsu', name:'Komatsu PC1200', unlock:10, capacity:14, scale:Math.cbrt(2), speed:1.12, kind:'backhoe', color:'#e6bd35',unlockLevel:2,mass:120,engineKw:578,digForce:1.55,response:.10,slewInertia:.26,vibration:.017,tank:1500,idleFuel:24,fullFuel:112,hydraulics:{boom:.53,stick:.73,curl:1.17,yaw:.61}},
  {id:'liebherr', name:'Liebherr R 9200', unlock:15, capacity:18, scale:Math.cbrt(18/7), speed:.88, kind:'face-shovel', color:'#e8dfc5',unlockLevel:3,mass:210,engineKw:810,digForce:2.0,response:.15,slewInertia:.38,vibration:.013,tank:2400,idleFuel:34,fullFuel:152,hydraulics:{boom:.42,stick:.64,curl:.88,yaw:.39}}
].map(Object.freeze));

export function getMachineConfig(id) {
  return MACHINES.find(machine => machine.id === id) || MACHINES[0];
}

export function currentMachine() {
  try {
    const machine = getMachineConfig(globalThis.localStorage?.getItem('quarry-machine-v1'));
    const fleet = JSON.parse(globalThis.localStorage?.getItem('quarry-fleet-v1') || '{}');
    const deliveries = Number.isSafeInteger(fleet?.deliveries) && fleet.deliveries >= 0 ? fleet.deliveries : 0;
    const career=JSON.parse(globalThis.localStorage?.getItem('quarry-career-v1')||'{}');
    return FREE_MACHINE_TRIAL || (Number(career.completed)||0)>=machine.unlockLevel ? machine : MACHINES[0];
  } catch {
    return MACHINES[0];
  }
}
