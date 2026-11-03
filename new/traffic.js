import {Vector3} from '../three.module.js';
// Heavy vehicles reserve a short swept corridor, not a single point. This
// controller only supplies speed limits; routes, loads and tipping stay owned
// by haul.js. All path buffers are reused and refreshed at 10 Hz.
const DIST=[0,3,6,10,15,21,28,36],SIZE=8;
function segmentDistance(ax,az,bx,bz,cx,cz,dx,dz){
 const ux=bx-ax,uz=bz-az,vx=dx-cx,vz=dz-cz,wx=ax-cx,wz=az-cz,a=ux*ux+uz*uz,b=ux*vx+uz*vz,c=vx*vx+vz*vz,d=ux*wx+uz*wz,e=vx*wx+vz*wz,den=a*c-b*b;let s=den>1e-9?Math.max(0,Math.min(1,(b*e-c*d)/den)):0,t=c>1e-9?(b*s+e)/c:0;if(t<0){t=0;s=a?Math.max(0,Math.min(1,-d/a)):0}else if(t>1){t=1;s=a?Math.max(0,Math.min(1,(b-d)/a)):0}return Math.hypot(wx+s*ux-t*vx,wz+s*uz-t*vz);
}
function conflict(a,i,b,j){const ai=i*5,bj=j*5,ax=a[ai],az=a[ai+1],ac=a[ai+2]*1.8,as=a[ai+3]*1.8,bx=b[bj],bz=b[bj+1],bc=b[bj+2]*1.8,bs=b[bj+3]*1.8;return segmentDistance(ax-ac,az-as,ax+ac,az+as,bx-bc,bz-bs,bx+bc,bz+bs)<6.5;}
export function createTraffic(){let clock=1;const point=new Vector3(),out={waiting:0,moving:0},blockers=[new Float64Array(SIZE*5),new Float64Array(SIZE*5),new Float64Array(SIZE*5)];
 function update(trucks,dt,machine=null,dozer=null,dumpDozer=null){clock+=dt;if(clock<.1)return out;clock=0;out.waiting=out.moving=0;
  for(const t of trucks){const p=t.trafficPath??=new Float64Array(SIZE*5),r=t.route;t.trafficLimit=Infinity;t.trafficWaiting=false;for(let i=0;i<SIZE;i++){let x=t.x,z=t.z,c=Math.cos(t.yaw),s=-Math.sin(t.yaw),distance=0;if(r){distance=Math.min(DIST[i],r.length-r.distance);const u=Math.min(1,(r.distance+distance)/r.length);r.curve.getPointAt(u,point);x=point.x;z=point.z;r.curve.getTangentAt(u,point);c=point.x;s=point.z;}const k=i*5;p[k]=x;p[k+1]=z;p[k+2]=c;p[k+3]=s;p[k+4]=distance;}}
  const limit=(t,d)=>{const cap=Math.sqrt(2*1.65*Math.max(0,d-6.5));if(cap<t.trafficLimit){t.trafficLimit=cap;t.trafficWaiting=cap<.2;}};
  const d=dozer?.snapshot?.()??dozer,dd=dumpDozer?.snapshot?.()??dumpDozer;let count=0;
  for(const obstacle of [machine?{x:machine.baseX||0,z:machine.baseZ||0,yaw:0}:null,d?{x:d.x,z:d.z,yaw:d.yaw||0}:null,dd?{x:dd.x,z:dd.z,yaw:dd.yaw||0}:null]){if(!obstacle)continue;const p=blockers[count++];p[0]=obstacle.x;p[1]=obstacle.z;p[2]=Math.cos(obstacle.yaw);p[3]=-Math.sin(obstacle.yaw);}
  for(const t of trucks)if(t.route)for(let j=0;j<count;j++)for(let i=1;i<SIZE;i++)if(conflict(t.trafficPath,i,blockers[j],0))limit(t,t.trafficPath[i*5+4]);
  for(let a=0;a<trucks.length;a++)for(let b=a+1;b<trucks.length;b++){const A=trucks[a],B=trucks[b],pa=A.trafficPath,pb=B.trafficPath;let aNow=Infinity,bNow=Infinity,bestA=Infinity,bestB=Infinity;
   for(let i=1;i<SIZE;i++){if(A.route&&conflict(pa,i,pb,0))aNow=Math.min(aNow,pa[i*5+4]);if(B.route&&conflict(pb,i,pa,0))bNow=Math.min(bNow,pb[i*5+4]);}
   if(Number.isFinite(aNow))limit(A,aNow);if(Number.isFinite(bNow))limit(B,bNow);
   if(!A.route||!B.route)continue;
   for(let i=1;i<SIZE;i++)for(let j=1;j<SIZE;j++)if(conflict(pa,i,pb,j)){const da=pa[i*5+4],db=pb[j*5+4],ta=da/Math.max(2,A.route.speed),tb=db/Math.max(2,B.route.speed);if(Math.abs(ta-tb)>4)continue;if(da+db<bestA+bestB){bestA=da;bestB=db;}}
   if(!Number.isFinite(bestA))continue;
   // A vehicle already occupying the other's corridor must clear first.
   let aFirst=Number.isFinite(bNow)&&!Number.isFinite(aNow)?true:Number.isFinite(aNow)&&!Number.isFinite(bNow)?false:Math.abs(bestA-bestB)>4?bestA<bestB:(A.tonnes||0)!==(B.tonnes||0)?(A.tonnes||0)>(B.tonnes||0):(A.index??a)<(B.index??b);
   if(aFirst)limit(B,bestB);else limit(A,bestA);
  }
  for(const t of trucks){if(t.trafficWaiting)out.waiting++;if(t.route)out.moving++;}return out;
 }
 return {update,snapshot:()=>({...out}),reset(){clock=1;out.waiting=out.moving=0;},apronClear(trucks,bay){return !trucks.some(t=>t.state!=='parked'&&t.state!=='ready'&&Math.hypot(t.x-bay.x,t.z-bay.z)<13);}};
}
