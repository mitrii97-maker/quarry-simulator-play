import * as T from './three.module.js?build=hotfix-20261106-20';
import {BENCH_HEIGHT} from './layout.js?build=hotfix-20261106-20';
export function chasePose(yaw,bucket,aspect){
 const forward=new T.Vector3(-Math.cos(yaw),0,Math.sin(yaw));
 const distance=aspect<.8?21:16;
 return {position:new T.Vector3(-3,BENCH_HEIGHT+11.8,3).addScaledVector(forward,-distance),look:new T.Vector3(-3,BENCH_HEIGHT+3.5,3).lerp(bucket,.42)};
}
export function cabinPose(yaw,bucket){
 const rotation=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw);
 const position=new T.Vector3(-.85,3.48,1).applyQuaternion(rotation).add(new T.Vector3(-3,BENCH_HEIGHT,3));
 const forward=new T.Vector3(-1,0,0).applyQuaternion(rotation);
 const look=position.clone().addScaledVector(forward,12);look.y=BENCH_HEIGHT+3;
 look.lerp(bucket,.32);
 return {position,look};
}
export function turnYaw(yaw,input,dt){return yaw-input*dt*.85}
