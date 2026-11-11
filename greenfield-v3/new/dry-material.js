const dot=(a,b)=>a.reduce((sum,v,i)=>sum+v*b[i],0),unit=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n)};
export const DRY_REPOSE={start:49*Math.PI/180,stop:36*Math.PI/180};
export function dryGrainVelocity(x,z,slope,dt){
 const grade=Math.hypot(slope.x,slope.z),speed=Math.hypot(x,z);if(speed<.1&&grade<1.02)return {x:0,z:0,sleep:true};
 const g=9.81/(1+grade*grade);x-=g*slope.x*dt;z-=g*slope.z*dt;const nextSpeed=Math.hypot(x,z),braking=.88*g*dt;
 if(nextSpeed<=braking)return {x:0,z:0,sleep:true};const scale=(nextSpeed-braking)/nextSpeed;return {x:x*scale,z:z*scale,sleep:false};
}
// Static friction locks a packed charge to its container. It only avalanches
// after a yield angle is exceeded, then jams again at the lower dynamic angle.
export class DryChargeSurface {
 constructor(){this.normal=[0,1,0];this.ready=false;this.sliding=false;this.fill=0;}
 reset(){this.ready=false;this.sliding=false;this.fill=0;}
 update(gravity,fill,dt){
  gravity=unit(gravity);if(!this.ready){this.normal=gravity;this.fill=fill;this.ready=true;return true}
  let changed=false;
  if(fill>this.fill+.001){const weight=fill<.18?Math.min(.045,(fill-this.fill)/Math.max(.05,fill)):0;this.normal=unit(this.normal.map((v,i)=>v*(1-weight)+gravity[i]*weight));changed=true}
  this.fill=fill;const angle=Math.acos(Math.max(-1,Math.min(1,dot(this.normal,gravity))));
  if(!this.sliding&&angle>DRY_REPOSE.start)this.sliding=true;
  if(this.sliding){if(angle<=DRY_REPOSE.stop+.0005)this.sliding=false;else{const amount=Math.min(angle-DRY_REPOSE.stop,Math.max(0,dt)*.85),t=amount/angle,s=Math.sin(angle);this.normal=s>.00001?unit(this.normal.map((v,i)=>(v*Math.sin((1-t)*angle)+gravity[i]*Math.sin(t*angle))/s)):gravity;changed=true;}}
  return changed;
 }
}
