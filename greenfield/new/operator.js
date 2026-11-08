import {GREENFIELD_ACTIVE,STARTER_TRUCK_CAPACITY} from './development-config.js';

const OPTIONS_KEY='quarry-operator-options-v1',CAREER_KEY='quarry-career-v1';
const defaults={precision:false,carryAssist:false,autoSupply:false,hydraulics:false,muted:false,quality:'auto'};
function read(key){try{return JSON.parse(globalThis.localStorage?.getItem(key)||'null')}catch{return null}}
function write(key,value){try{globalThis.localStorage?.setItem(key,JSON.stringify(value))}catch{}}
export function loadOptions(){const saved=read(OPTIONS_KEY)||{};return {precision:saved.precision===true,carryAssist:saved.carryAssist===true,autoSupply:saved.autoSupply===true,hydraulics:saved.hydraulics===true,muted:saved.muted===true,quality:['auto','economy','balanced','high'].includes(saved.quality)?saved.quality:'auto'};}
export function saveOptions(options){write(OPTIONS_KEY,{...defaults,...options});}
export function loadCareer(){const s=read(CAREER_KEY);return {nextLevel:Number.isSafeInteger(s?.nextLevel)&&s.nextLevel>0?Math.min(100000,s.nextLevel):1,completed:Number.isSafeInteger(s?.completed)?Math.max(0,s.completed):0,bestAccuracy:Math.max(0,Math.min(100,Number(s?.bestAccuracy)||0)),bestRate:Math.max(0,Math.min(100000,Number(s?.bestRate)||0))};}
export function completeCareer(level,stats){const career=loadCareer();career.completed=Math.max(career.completed,level);career.nextLevel=Math.max(career.nextLevel,level+1);career.bestAccuracy=Math.max(career.bestAccuracy,stats.accuracy);career.bestRate=Math.max(career.bestRate,stats.rate);write(CAREER_KEY,career);return career;}
export class OperatorShift{
 constructor(){this.command={left:{x:0,y:0},right:{x:0,y:0},drive:0};this.reset();}
 reset(){this.seconds=0;this.cutting=0;this.accepted=0;this.spilled=0;this.sent=0;this.trips=0;this.pressure=0;this.bestCycle=0;this.loadingStart=null;this.lastBeds=0;this.lastLoose=0;this.cycles=[];}
 inputs(raw,precision){const k=precision?.48:1,c=this.command;c.left.x=raw.left.x*k;c.left.y=raw.left.y*k;c.right.x=raw.right.x*k;c.right.y=raw.right.y*k;c.drive=raw.drive;return c;}
 update(dt,{work=0,payload=0,beds=0,loose=0,motion=0,contact=false,ready=false,currentLoad=0,loadPressure=0}={}){this.seconds+=dt;if(work>0)this.cutting+=dt;this.accepted+=Math.max(0,beds-this.lastBeds);this.spilled+=Math.max(0,loose-this.lastLoose);this.lastBeds=beds;this.lastLoose=loose;if(ready&&currentLoad>0&&this.loadingStart===null)this.loadingStart=this.seconds;
  const target=Math.min(1,Math.max(loadPressure,Math.max(work/10,contact?motion*.8:motion*.25)+payload*.12));this.pressure+=(target-this.pressure)*(1-Math.exp(-dt*4));}
 dispatch(tonnes){if(!(tonnes>0))return;const duration=this.loadingStart===null?0:this.seconds-this.loadingStart,cycle={tonnes,seconds:duration};this.sent+=tonnes;this.trips++;if(tonnes>=(GREENFIELD_ACTIVE?STARTER_TRUCK_CAPACITY*.98:98)&&duration>0)this.bestCycle=this.bestCycle?Math.min(this.bestCycle,duration):duration;this.loadingStart=null;this.cycles.push(cycle);if(this.cycles.length>12)this.cycles.shift();return cycle;}
 snapshot(){const accuracy=this.accepted+this.spilled>0?100*this.accepted/(this.accepted+this.spilled):100,fill=this.trips?this.sent/this.trips:0,rate=this.seconds>0?this.accepted/this.seconds*3600:0;return {seconds:this.seconds,pressure:this.pressure,accuracy,fill,rate,bestCycle:this.bestCycle,trips:this.trips,accepted:this.accepted,spilled:this.spilled,stars:this.trips?Math.max(1,Math.min(3,Math.floor((accuracy*.55+fill*.45)/33))):0};}
}
