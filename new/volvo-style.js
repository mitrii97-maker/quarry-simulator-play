import * as T from '../three.module.js';
import {V,add,block,plate,pin,rod} from './geometry.js';
import {roundedBlock,roundedPlate,roundedOutline} from './sculpted.js';
function fitFleetPlates(house,M){
 const canvas=document.createElement('canvas');
 canvas.width=512;canvas.height=128;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#293031';ctx.fillRect(0,0,512,128);
 ctx.fillStyle='#dbac47';ctx.fillRect(4,4,504,120);
 ctx.fillStyle='#282e2d';
 for(let y=6;y<122;y++){
  for(let stripe=-2;stripe<3;stripe++){
   const x=stripe*48+y*.42,start=Math.max(6,x),end=Math.min(119,x+24);
   if(end>start){
    ctx.fillRect(start,y,end-start,1);
    ctx.fillRect(512-end,y,end-start,1);
   }
  }
 }
 ctx.fillStyle='#293031';ctx.fillRect(120,4,272,120);
 ctx.textAlign='center';ctx.fillStyle='#e4d2a2';ctx.font='bold 18px Arial';
 ctx.fillText('УЧАСТОК  04',256,30);
 ctx.fillStyle='#f3ebda';ctx.font='bold 76px Arial';ctx.fillText('ЭК–26',256,106);
 const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
 const enamel=new T.MeshStandardMaterial({map,roughness:.51,metalness:.14});
 const sidePlate=new T.PlaneGeometry(.76,.19);
 for(const side of [-1,1]){
  const plate=add(house,sidePlate,enamel,-1.4,.56,side*1.415);
  if(side<0)plate.rotation.y=Math.PI;
  plate.castShadow=false;
 }
 const mount=block(house,M.dark,[1.64,.42,.08],[-3.2,.62,0],.02);
 mount.rotation.y=-Math.PI/2;
 const rear=add(house,new T.PlaneGeometry(1.58,.395),enamel,-3.257,.62,0);
 rear.rotation.y=-Math.PI/2;rear.castShadow=false;
}
export function lettering(parent,text,{x,y,z,width,height,color='#f2f1e9',font='900 170px Georgia',name=text,side=1}){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';const measured=ctx.measureText(text).width;ctx.translate(512,128);ctx.scale(950/measured,1);ctx.fillText(text,0,8);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;const mat=new T.MeshStandardMaterial({map,transparent:true,alphaTest:.08,depthWrite:false,roughness:.8,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});const mesh=new T.Mesh(new T.PlaneGeometry(width,height),mat);mesh.name=name;mesh.position.set(x,y,z);if(side<0)mesh.rotation.y=Math.PI;parent.add(mesh);return mesh;}
export function volvoBody(house,M){
 // Deep counterweight, black protective skirt and a raised rear engine compartment.
 const plan=[[-3.12,-.65],[-2.96,-1.14],[-2.5,-1.34],[.95,-1.34],[1.42,-1.12],[1.42,1.12],[.95,1.34],[-2.5,1.34],[-2.96,1.14],[-3.12,.65]].map(([x,z])=>[x,z*.925]);
 const hull=roundedPlate(house,M.paint,plan,1.02,0,{corner:.28,bevel:.1});hull.rotation.x=Math.PI/2;hull.position.y=.64;hull.name='Sculpted rounded counterweight';
 const skirt=roundedPlate(house,M.boom,plan.map(([x,z])=>[x*1.016,z*1.025]),.22,0,{corner:.3,bevel:.055});skirt.rotation.x=Math.PI/2;skirt.position.y=.07;
 roundedBlock(house,M.boom,[.22,.87,1.95],[-3.08,.59,0],.1);
 roundedBlock(house,M.paint,[2.25,.32,2.5],[-1.65,1.26,0],.15);
 for(const side of [-1,1]){const z=side*1.372;
  roundedPlate(house,M.boom,[[-2.86,.16],[-2.86,1.02],[-2.65,1.02],[-2.39,.49],[-1.53,.49],[-1.37,.17]],.022,z,{corner:.08,bevel:.004});
  lettering(house,'EC750',{x:-2.5,y:.42,z:z+side*.02,width:.6,height:.18,font:'900 180px Arial',side});
  block(house,M.boom,[.86,.25,.022],[-.74,1.01,z],.03);lettering(house,'VOLVO',{x:-.74,y:1.01,z:z+side*.025,width:.74,height:.18,font:'900 170px Georgia',side});
  for(let i=0;i<12;i++)block(house,M.black,[.045,.22,.025],[-2.35+i*.105,1.08,z+side*.015],.005);
 }
 for(const x of [-2.3,-1.3]){rod(house,M.paint,V(x,1.45,.98),V(x,2.15,.98),.035);rod(house,M.paint,V(x,2.15,.98),V(x+.15,2.28,.98),.035);rod(house,M.paint,V(x+.15,2.28,.98),V(x+.3,2.15,.98),.035);rod(house,M.paint,V(x+.3,2.15,.98),V(x+.3,1.45,.98),.035)}
 const exhaust=add(house,new T.CylinderGeometry(.09,.09,.84,18),M.boom,-1.05,1.82,.53);add(house,new T.CylinderGeometry(.125,.125,.09,18),M.black,-1.05,2.27,.53);
 block(house,M.dark,[.75,.07,1.75],[.5,1,0],.04);
 fitFleetPlates(house,M);
}
export function volvoCab(cab,M){
 const outline=[[-.86,.12],[.86,.12],[.84,1.15],[.51,1.85],[-.57,1.88],[-.83,1.62]];
 roundedBlock(cab,M.boom,[1.74,.22,1.57],[0,0,0],.1);
 roundedBlock(cab,M.paint,[1.84,.2,1.76],[-.06,1.9,0],.095);
 // A ribbed amber lens catches the shift lighting above the snow on the roof.
 add(cab,new T.CylinderGeometry(.132,.15,.075,16),M.boom,-.53,2.056,.49);
 const lensProfile=[[.106,0],[.105,.035],[.09,.048],[.105,.062],[.09,.075],[.104,.09],[.09,.104],[.102,.119],[.092,.166],[.07,.184],[0,.19]];
 const amber=new T.MeshStandardMaterial({color:'#ed9629',emissive:'#df620a',emissiveIntensity:.58,roughness:.23,metalness:.12});
 add(cab,new T.LatheGeometry(lensProfile.map(([r,y])=>new T.Vector2(r,y)),20),amber,-.53,2.093,.49);
 for(const z of [-.73,.73]){
  roundedPlate(cab,M.paint,[[-.83,.1],[.87,.1],[.86,.39],[.39,.5],[-.12,.27],[-.83,.29]],.045,z,{corner:.11,bevel:.012});
  const path=roundedOutline(outline,.12).getPoints(72).map(p=>V(p.x,p.y,z));path.push(path[0]);add(cab,new T.TubeGeometry(new T.CatmullRomCurve3(path),88,.052,10,false),M.boom);
  roundedPlate(cab,M.glass,[[-.69,.48],[.02,.48],[.02,1.7],[-.49,1.72],[-.69,1.5]],.012,z,{corner:.09,bevel:.002});
  roundedPlate(cab,M.glass,[[.11,.51],[.73,.51],[.71,1.11],[.43,1.69],[.11,1.7]],.012,z,{corner:.09,bevel:.002});
  rod(cab,M.boom,V(.065,.47,z),V(.065,1.76,z),.031);
  rod(cab,M.boom,V(-.74,.42,z),V(.77,.43,z),.028);
 }
 // Sloping front screen, so the cab silhouette follows the reference rather than a box.
 const front=new T.BufferGeometry();front.setAttribute('position',new T.Float32BufferAttribute([.83,.46,-.66,.83,.46,.66,.51,1.78,.66,.51,1.78,-.66],3));front.setIndex([0,1,2,0,2,3]);front.computeVertexNormals();add(cab,front,M.glass);
 for(const z of [-.69,.69])rod(cab,M.boom,V(.85,.43,z),V(.51,1.81,z),.044);
 rod(cab,M.boom,V(.51,1.81,-.69),V(.51,1.81,.69),.044);
 block(cab,M.glass,[.012,1.23,1.3],[-.8,.93,0],0);
 // The operator's front window is deliberately unobstructed: no diagonal
 // wiper rod. Interior furniture is authored separately below the sight line.
}
export function volvoArmMarkings(shoulder,M){
 for(const side of [-1,1]){
  lettering(shoulder,'VOLVO',{x:3.42,y:.32,z:side*.414,width:1.65,height:.44,font:'900 260px Georgia',side,name:'Volvo boom lettering'});
  lettering(shoulder,'26',{x:1.65,y:.55,z:side*.414,width:.6,height:.4,font:'900 260px Arial',side,name:'Fleet number 26'});
  // Warning placard near the root, as on the real machine.
  block(shoulder,M.warning,[.18,.24,.018],[.28,.05,side*.415],.01);
 }
}
export function volvoTrackFrames(root,M){for(const side of [-1,1]){const z=side*1.97;plate(root,M.boom,[[-2.17,.5],[2.17,.5],[2.32,.66],[2.09,.88],[-2.07,.88],[-2.3,.66]],.11,z);for(let i=0;i<7;i++){pin(root,M.black,-1.85+i*.61,.68,z+side*.07,.075,.035);pin(root,M.steel,-1.85+i*.61,.68,z+side*.09,.038,.04)}}}
