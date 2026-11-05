import {MACHINE} from './material-volume.js?build=career-20261106-19';
// The tracks travel along the shelf's X axis; upper-house slew remains independent.
const TRACK_X=[-2.4,-1.2,0,1.2,2.4],TRACK_Z=[-1.35,1.35],supportHeights=new Float64Array(10);
export function supportPose(x,z,ground){
 let sample=0;for(const xx of TRACK_X)for(const zz of TRACK_Z)supportHeights[sample++]=ground(x+xx*MACHINE.scale,z+zz*MACHINE.scale);
 const front=(supportHeights[8]+supportHeights[9])/2,rear=(supportHeights[0]+supportHeights[1])/2,left=(supportHeights[8]+supportHeights[0])/2,right=(supportHeights[9]+supportHeights[1])/2;
 const pitch=Math.atan2(front-rear,4.8*MACHINE.scale),roll=-Math.atan2(right-left,2.7*MACHINE.scale);let roughness=0,unsupported=false;
 sample=0;for(const xx of TRACK_X)for(const zz of TRACK_Z){const h=supportHeights[sample++],plane=(front+rear)/2+Math.tan(pitch)*xx*MACHINE.scale-Math.tan(roll)*zz*MACHINE.scale;roughness=Math.max(roughness,Math.abs(h-plane));unsupported||=ground.supportAt?.(x+xx*MACHINE.scale,z+zz*MACHINE.scale)===false;}
 return {height:(front+rear)/2,pitch,roll,roughness,unsupported};
}
export function stepChassis(s,input,dt,ground){
 const x=s.baseX||0,z=s.baseZ||0,current=supportPose(x,z,ground);let speed=s.driveSpeed||0;
 const desired=Math.max(-1,Math.min(1,input||0))*.85;
 speed+=(desired-speed)*(1-Math.exp(-dt/(Math.abs(desired)>.01?.38:.16)));if(Math.abs(speed)<.0001)speed=0;
 let nextX=Math.max(-28,Math.min(55,x+speed*dt)),pose=nextX===x?current:supportPose(nextX,z,ground),blocked=false;
 const severity=p=>Math.max(Math.abs(p.pitch)/.66,Math.abs(p.roll)/.30,p.roughness/.65,p.unsupported?2:0);
 if(severity(pose)>1&&(severity(pose)>severity(current)+.00001||pose.unsupported)){nextX=x;pose=current;speed=0;blocked=true}
 if(nextX===x&&Math.abs(desired)>.01){blocked=true;speed=0;}
 const blend=1-Math.exp(-dt*6),pitch=(s.pitch||0)+(Math.max(-.68,Math.min(.68,pose.pitch))-(s.pitch||0))*blend,roll=(s.roll||0)+(Math.max(-.38,Math.min(.38,pose.roll))-(s.roll||0))*blend;
 let floor=-Infinity;for(const xx of TRACK_X)for(const zz of TRACK_Z){const p=chassisPoint({baseX:nextX,baseY:0,baseZ:z,pitch,roll},xx,.11,zz);floor=Math.max(floor,ground(p.x,p.z)-p.y)}
 const y=s.baseY??floor,baseY=floor>y?floor:Math.max(floor,y-dt*2.2);
 return {state:{...s,baseX:nextX,baseZ:z,baseY,pitch,roll,driveSpeed:speed},distance:nextX-x,blocked};
}
export function chassisPoint(s,x,y,z){
 x*=MACHINE.scale;y*=MACHINE.scale;z*=MACHINE.scale;
 const roll=s.roll||0,pitch=s.pitch||0,yy=y*Math.cos(roll)-z*Math.sin(roll),zz=y*Math.sin(roll)+z*Math.cos(roll);
 return {x:(s.baseX||0)+x*Math.cos(pitch)-yy*Math.sin(pitch),y:(s.baseY??4)+x*Math.sin(pitch)+yy*Math.cos(pitch),z:(s.baseZ||0)+zz};
}
