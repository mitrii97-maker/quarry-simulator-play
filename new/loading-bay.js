import {bucketWorldPoint} from './rig.js?build=lighting-20261106-26';
import {BUCKET} from './bucket-config.js?build=lighting-20261106-26';
import {BED} from './truck-load.js?build=lighting-20261106-26';

// A comfortable, raised unloading posture at 90 degrees to the tracks. Use
// the same rigid-body transform as the actual bucket, including ground tilt.
// Centre the late-opening dry avalanche inside the bed, clear of the canopy.
export const UNLOAD_POSE={yaw:Math.PI/2,boom:.9,stick:-1.1,curl:1.25};
export function unloadingPose(s){const lift=Math.max(0,Math.min(.2,(3.89-(s.baseY??3.89))*.05));return {...UNLOAD_POSE,boom:UNLOAD_POSE.boom+lift,stick:UNLOAD_POSE.stick+lift};}
export function loadingBay(s){
 const mouth=bucketWorldPoint({...s,...unloadingPose(s)},BUCKET.mouth.x,BUCKET.mouth.y,0);
 const z=Math.min(mouth.z+BED.centerX,(s.baseZ||0)-9.4);
 return {x:mouth.x,z,dropX:mouth.x,dropZ:z-BED.centerX};
}
export function updateLoadingBay(truck,s,dt=0){
 const bay=loadingBay(s);truck.bayX=bay.x;truck.bayZ=bay.z;truck.dropX=bay.dropX;truck.dropZ=bay.dropZ;
 truck.machineMoving=Math.abs(s.driveSpeed||0)>.035;
 truck.machineSettled=truck.machineMoving?0:(truck.machineSettled??1)+dt;
 return bay;
}
