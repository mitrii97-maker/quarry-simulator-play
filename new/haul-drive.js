const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const HAUL_DYNAMICS=Object.freeze({wheelbase:4.25,maxSteer:.46,steerRate:.42,emptyAcceleration:1.55,loadedAcceleration:.95,minimumRadius:4.25/Math.tan(.46)});
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function cache(r){if(r.samples)return;const n=Math.max(2,Math.ceil(r.length/.65));r.samples=new Float32Array((n+1)*2);r.sampleCount=n;for(let i=0;i<=n;i++){const p=r.curve.getPointAt(i/n);r.samples[i*2]=p.x;r.samples[i*2+1]=p.z;}r.near=Math.max(0,Math.min(n-1,Math.floor((r.distance||0)/r.length*n)));}
function pointAt(r,d,out){if(d>r.length){const n=r.sampleCount,dx=r.samples[n*2]-r.samples[(n-1)*2],dz=r.samples[n*2+1]-r.samples[(n-1)*2+1],len=Math.hypot(dx,dz)||1;out.x=r.samples[n*2]+dx/len*(d-r.length);out.z=r.samples[n*2+1]+dz/len*(d-r.length);return out;}const u=clamp(d/r.length,0,1)*r.sampleCount,i=Math.min(r.sampleCount-1,Math.floor(u)),f=u-i;out.x=r.samples[i*2]*(1-f)+r.samples[(i+1)*2]*f;out.z=r.samples[i*2+1]*(1-f)+r.samples[(i+1)*2+1]*f;return out;}
const target={};
export function advanceHauler(t,r,dt){
 cache(r);let best=Infinity,along=r.distance,index=r.near||0;
 for(let i=Math.max(0,index-5);i<Math.min(r.sampleCount,index+30);i++){
  const ax=r.samples[i*2],az=r.samples[i*2+1],dx=r.samples[(i+1)*2]-ax,dz=r.samples[(i+1)*2+1]-az,len=dx*dx+dz*dz;
  const u=clamp(((t.x-ax)*dx+(t.z-az)*dz)/Math.max(.0001,len),0,1),distance=(t.x-ax-u*dx)**2+(t.z-az-u*dz)**2;
  if(distance<best){best=distance;along=(i+u)/r.sampleCount*r.length;index=i;}
 }
 r.near=index;r.distance=Math.max(r.distance,Math.min(r.length,along));
 const endX=r.samples[r.sampleCount*2],endZ=r.samples[r.sampleCount*2+1],endDistance=Math.hypot(endX-t.x,endZ-t.z),remaining=r.length-r.distance;
 pointAt(r,r.distance+Math.max(5.0,Math.min(9,4+r.speed*.8)),target);
 const dx=target.x-t.x,dz=target.z-t.z,lateral=Math.sin(t.yaw)*dx+Math.cos(t.yaw)*dz;
 const requested=clamp(Math.atan2(2*HAUL_DYNAMICS.wheelbase*lateral,Math.max(1,dx*dx+dz*dz)),-HAUL_DYNAMICS.maxSteer,HAUL_DYNAMICS.maxSteer);
 t.steering=(t.steering||0)+clamp(requested-(t.steering||0),-HAUL_DYNAMICS.steerRate*dt,HAUL_DYNAMICS.steerRate*dt);
 const loaded=(t.tonnes||0)>5,acceleration=loaded?.95:1.55,braking=loaded?1.4:1.8,curvature=Math.abs(Math.tan(t.steering)/HAUL_DYNAMICS.wheelbase);
 const terminal=remaining<18?Math.sqrt(Math.max(0,remaining-.30)*2*braking):Infinity;
 const goal=Math.min(t.trafficLimit??Infinity,r.reverse?2.6:5.2,Math.sqrt(1.65/Math.max(.012,curvature)),terminal);
 r.speed+=clamp(goal-r.speed,-braking*dt,acceleration*dt);const distance=r.speed*dt,signed=r.reverse?-distance:distance;
 const delta=-signed*Math.tan(t.steering)/HAUL_DYNAMICS.wheelbase,mid=t.yaw+delta*.5;
 t.x+=Math.cos(mid)*signed;t.z-=Math.sin(mid)*signed;t.yaw+=delta;t.braking=goal<r.speed-.08;t.reversing=r.reverse;
 r.complete=remaining<3&&endDistance<(r.reverse?.78:1.25)&&r.speed<(r.reverse?1.25:1.7);
 return {distance,delta,remaining,endDistance,steering:t.steering,complete:r.complete};
}
