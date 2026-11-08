import * as T from '../three.module.js';
import {add,block,pin,rod,V} from './geometry.js';
import {roundedBlock,roundedPlate} from './sculpted.js';
import {lettering} from './volvo-style.js';

function tyre(root,M,x,z){
 const steer=new T.Group(),roll=new T.Group();steer.position.set(x,.76,z);steer.add(roll);root.add(steer);
 const tyre=add(roll,new T.CylinderGeometry(.73,.73,.43,28),M.rubber);tyre.rotation.x=Math.PI/2;
 pin(roll,M.steel,0,0,Math.sign(z)*.235,.30,.05);pin(roll,M.dark,0,0,Math.sign(z)*.27,.12,.07);
 for(let i=0;i<18;i++){const a=i*Math.PI/9,t=block(roll,M.track,[.15,.09,.48],[Math.sin(a)*.72,Math.cos(a)*.72,0],.018);t.rotation.z=-a;}
 return {steer,roll,front:x>0,radius:.73};
}

export function makeWheeledUndercarriage(root,M){
 const wheels=[];
 roundedBlock(root,M.dark,[5.35,.52,2.18],[0,.92,0],.16);
 roundedBlock(root,M.steel,[3.9,.20,1.28],[0,1.23,0],.07);
 for(const x of [-2.05,2.05]){pin(root,M.dark,x,.76,0,.19,2.45);for(const z of [-1.25,1.25])wheels.push(tyre(root,M,x,z));}
 // Stabilizers and a front dozer blade make the machine recognisably wheeled.
 for(const x of [-1.65,1.65])for(const z of [-1,1]){
  rod(root,M.dark,V(x,1.05,z*.78),V(x,.28,z*1.65),.11);
  roundedBlock(root,M.track,[.66,.13,.42],[x,.18,z*1.68],.05);
 }
 const blade=new T.Group();blade.position.set(-2.85,.48,0);root.add(blade);
 roundedPlate(blade,M.track,[[-.08,-.55],[.19,-.43],[.22,.43],[-.08,.55]],2.62,0,{corner:.08,bevel:.025});
 for(const z of [-.8,.8])rod(root,M.dark,V(.05,.1,z),V(.72,.62,z),.10);
 return {wheels,advance(distance){for(const w of wheels)w.roll.rotation.z-=distance/(w.radius*.66);}};
}

export function wheeledBody(house,M){
 house.name='Volvo EW160E upper carriage';
 roundedBlock(house,M.paint,[3.75,1.16,2.45],[-.45,.36,0],.28);
 roundedBlock(house,M.dark,[1.15,.88,2.28],[-1.75,.34,0],.31);
 roundedBlock(house,M.paint,[1.76,.64,2.34],[-1.20,1.00,0],.20);
 roundedBlock(house,M.dark,[1.40,.08,1.64],[-1.57,1.30,0],.04);
 for(let i=0;i<10;i++)block(house,M.black,[.035,.42,.72],[-.25+i*.09,.69,1.24],.005);
 lettering(house,'VOLVO',{x:-1.70,y:.78,z:-1.25,width:1.0,height:.22,side:-1,color:'#f3f2e8'});
 lettering(house,'EW160E',{x:-.60,y:.20,z:-1.25,width:.72,height:.15,side:-1,color:'#282b2b'});
 for(const z of [-1.38,1.38]){rod(house,M.steel,V(-.45,1.05,z),V(.70,1.05,z),.028);rod(house,M.steel,V(.7,1.05,z),V(.7,1.65,z),.028);}
}

export function wheeledCab(cab,M){
 cab.name='Detailed EW160E glazed cab';
 roundedBlock(cab,M.dark,[1.46,.22,1.42],[0,-.08,0],.08);
 const outline=[[-.67,.02],[.68,.02],[.59,1.67],[-.47,1.73],[-.68,1.43]];
 for(const z of [-.66,.66]){
  roundedPlate(cab,M.dark,outline,.075,z,{corner:.07,bevel:.014});
  roundedPlate(cab,M.glass,[[-.53,.18],[-.04,.18],[-.04,1.52],[-.42,1.55],[-.56,1.35]],.014,z+Math.sign(z)*.044,{corner:.035,bevel:.003});
  roundedPlate(cab,M.glass,[[.06,.18],[.51,.18],[.48,1.50],[.06,1.52]],.014,z+Math.sign(z)*.044,{corner:.035,bevel:.003});
  block(cab,M.dark,[.08,1.42,.05],[.01,.84,z+Math.sign(z)*.05],.012);
 }
 roundedPlate(cab,M.glass,[[.68,.18],[.68,1.48],[.58,1.62],[.07,1.56]],1.18,0,{corner:.04,bevel:.002});
 roundedBlock(cab,M.paint,[1.55,.12,1.52],[-.02,1.74,0],.055);
 roundedBlock(cab,M.dark,[.28,.32,.18],[.68,.42,-.77],.04);
 rod(cab,M.black,V(.69,.35,-.38),V(.61,1.22,-.08),.012);
}
