// Tonnes / metres / seconds. Three damped chassis modes, no loose rigid bodies.
// Tyres stay on the road; only the sprung chassis responds to payload impacts.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createSuspension(){return {heave:0,v:0,pitch:0,vp:0,roll:0,vr:0,free:.2,cooldown:0};}
function system(t){return t.suspension??=createSuspension();}
export function loadImpact(t,x,z,mass,speed){
 if(!(mass>0&&speed>0))return;
 const s=system(t),c=Math.cos(t.yaw),n=Math.sin(t.yaw),dx=x-t.x,dz=z-t.z,lx=c*dx-n*dz,lz=n*dx+c*dz;
 // A 180t empty machine absorbs packet momentum. Compliance, not bounce.
 const impulse=clamp(mass*speed/(70+(t.load?.field.mass??t.tonnes??0))*1.8,0,.45);
 s.v=clamp(s.v-impulse,-.40,.25);s.vp=clamp(s.vp-lx*impulse/8,-.12,.12);s.vr=clamp(s.vr+lz*impulse/6,-.12,.12);
}
export function bucketContact(t,hit,dt){
 if(!t)return;const s=system(t);s.cooldown=Math.max(0,s.cooldown-dt);
 if(!hit){s.free+=dt;return;}
 // The strike includes the connected boom/upperworks, not just bucket cargo.
 if(s.free>.07&&s.cooldown===0&&hit.speed>.06){loadImpact(t,hit.x,hit.z,38,Math.min(2.2,hit.speed));s.cooldown=.30;}
 s.free=0;
}
export function stepSuspension(t,dt){
 const s=system(t),fill=clamp((t.load?.field.mass??t.tonnes??0)/100,0,1),target=-.12*fill;
 // Substeps make the same modes stable for both regular fixed ticks and long
 // preview/QA updates. Never add a random idle wobble to a stationary truck.
 const steps=Math.max(1,Math.ceil(Math.min(.1,dt)/(1/120))),h=Math.min(.1,dt)/steps;
 for(let i=0;i<steps;i++){
  const w=7.2,damping=.82*w;
  s.v+=(-w*w*(s.heave-target)-damping*s.v)*h;s.heave+=s.v*h;
  s.vp+=(-36*(s.pitch-.006*fill)-4.9*s.vp)*h;s.pitch+=s.vp*h;
  s.vr+=(-42*s.roll-5.0*s.vr)*h;s.roll+=s.vr*h;
  s.heave=clamp(s.heave,target-.12,.07);s.pitch=clamp(s.pitch,-.055,.055);s.roll=clamp(s.roll,-.055,.055);
 }
 return s;
}
