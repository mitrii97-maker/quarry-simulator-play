// Stable analytic critically damped suspension. Response is driven by actual
// contact/load transitions; it has no idle oscillator and cannot accumulate.
export class CameraResponse{
 constructor(){this.reset();}
 reset(){this.y=0;this.v=0;this.roll=0;this.vr=0;this.previousImpact=0;return this;}
 update(dt,{impact=0,work=0,motion=0,slew=0}={}){
  if(!(dt>0))return this;dt=Math.min(.1,dt);
  const hit=Math.max(0,impact-this.previousImpact);this.previousImpact=impact;
  this.v-=Math.min(.11,hit*1.6);
  const target=-Math.min(.008,work*.003+motion*.0012),rollTarget=Math.max(-.003,Math.min(.003,-slew*.004));
  let w=13,e=Math.exp(-w*dt),a=this.y-target,b=this.v+w*a;this.y=target+(a+b*dt)*e;this.v=(this.v-w*b*dt)*e;
  w=11;e=Math.exp(-w*dt);a=this.roll-rollTarget;b=this.vr+w*a;this.roll=rollTarget+(a+b*dt)*e;this.vr=(this.vr-w*b*dt)*e;
  this.y=Math.max(-.02,Math.min(.01,this.y));this.roll=Math.max(-.004,Math.min(.004,this.roll));return this;
 }
}
