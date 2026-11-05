import {BUCKET} from './bucket-config.js?build=hotfix-20261106-20';
import {bucketUp} from './charge-shape.js?build=hotfix-20261106-20';
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const attitude=s=>{const n=bucketUp(s);return Math.atan2(n[0],n[1]);};
// Optional free-air attitude hold. It changes only the curl command, never the
// joints directly. A deliberate curl, contact or mechanical stop always wins.
export class CarryAssist{
 constructor(){this.reset();}
 reset(){this.anchor=null;this.active=false;}
 command(s,command,{enabled=false,precision=false,manualCurl=0,contact=false}={}){
  if(s.payload<=.01||contact||s.cutContact>0||Math.abs(manualCurl)>.04){this.reset();s.assistedCarry=false;return command;}
  const angle=attitude(s);
  if(this.anchor!==null&&Math.abs(wrap(angle-this.anchor))>.08)this.reset();
  this.active=enabled&&precision;
  if(this.active&&this.anchor===null&&s.curl<BUCKET.closed+.20)this.anchor=angle;
  if(this.anchor===null){this.active=false;s.assistedCarry=false;return command;}
  s.assistedCarry=true;
  if(!this.active)return command;
  const speed=-(s.velocity.boom+s.velocity.stick)+wrap(this.anchor-angle)*5,rate=(speed<0?1.14:.95)*(1-s.payload*.2),input=Math.max(-1,Math.min(1,speed/rate));
  if(s.curl<=BUCKET.closed+.002&&input<0||s.curl>=BUCKET.open-.002&&input>0){this.reset();s.assistedCarry=false;return command;}
  command.right.x=input;return command;
 }
 validate(s,contact=false){
  if(contact||s.payload<=.01||this.anchor===null||Math.abs(wrap(attitude(s)-this.anchor))>.08){this.reset();s.assistedCarry=false;}else s.assistedCarry=true;
 }
}
