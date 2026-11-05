import {BENCH_HEIGHT} from './layout.js?build=career-20261106-18';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function updateControls(state,left,right,dt,resistance=0){
 const v={yaw:0,reach:0,height:0,curl:0,...state.velocity};
 const response=x=>Math.sign(x)*Math.pow(Math.abs(x),1.35);
 const slow=1-clamp(resistance,0,1)*.52;
 const targets={yaw:-response(left.x)*.78,reach:-response(left.y)*2.6*slow,height:response(right.y)*2.2*slow,curl:-response(right.x)*.8*slow};
 for(const key of Object.keys(v)){v[key]+=(targets[key]-v[key])*(1-Math.exp(-dt/(Math.abs(targets[key])>.001?.24:.16)));if(Math.abs(v[key])<.0002)v[key]=0;}
 const next={yaw:state.yaw+v.yaw*dt,reach:clamp(state.reach+v.reach*dt,3.5,11),height:clamp(state.height+v.height*dt,1.2,BENCH_HEIGHT+7),curl:clamp(state.curl+v.curl*dt,0,1),velocity:v};
 for(const k of ['reach','height','curl'])if(next[k]===state[k])v[k]=0;
 return next;
}
export const canScoop=curl=>curl>=.65;
export const canDump=curl=>curl<=.3;
