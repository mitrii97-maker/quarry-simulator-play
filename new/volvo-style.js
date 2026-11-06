import {referenceVolvoBody} from './volvo-reference.js?build=boom-20261107-30';
import {cabGlass,cabPane} from './cab-glazing.js?build=boom-20261107-30';
import * as T from '../three.module.js?build=boom-20261107-30';
import {V,add,block,plate,pin,rod} from './geometry.js?build=boom-20261107-30';
import {roundedBlock,roundedPlate,roundedOutline} from './sculpted.js?build=boom-20261107-30';
export function lettering(parent,text,{x,y,z,width,height,color='#f2f1e9',font='900 170px Georgia',name=text,side=1}){const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';const measured=ctx.measureText(text).width;ctx.translate(512,128);ctx.scale(950/measured,1);ctx.fillText(text,0,8);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;const mat=new T.MeshStandardMaterial({map,transparent:true,alphaTest:.08,depthWrite:false,roughness:.8,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});const mesh=new T.Mesh(new T.PlaneGeometry(width,height),mat);mesh.name=name;mesh.position.set(x,y,z);if(side<0)mesh.rotation.y=Math.PI;parent.add(mesh);return mesh;}
export function volvoBody(house,M){return referenceVolvoBody(house,M,lettering);}
export function volvoCab(cab,M){
 M={...M,glass:cabGlass(M.glass)};
 const outline=[[-.86,.12],[.90,.12],[.90,.52],[.73,1.78],[.55,1.90],[-.61,1.90],[-.86,1.63]];
 roundedBlock(cab,M.boom,[1.74,.22,1.57],[0,0,0],.1);
 roundedBlock(cab,M.paint,[1.84,.2,1.76],[-.06,1.9,0],.095);
 for(const z of [-.73,.73]){
  roundedPlate(cab,M.paint,[[-.83,.1],[.87,.1],[.86,.39],[.39,.5],[-.12,.27],[-.83,.29]],.045,z,{corner:.11,bevel:.012});
  const path=roundedOutline(outline,.12).getPoints(72).map(p=>V(p.x,p.y,z));path.push(path[0]);add(cab,new T.TubeGeometry(new T.CatmullRomCurve3(path),88,.052,10,false),M.boom);
  cabPane(cab,M.glass,[[-.69,.48],[.02,.48],[.02,1.7],[-.49,1.72],[-.69,1.5]],z);
  cabPane(cab,M.glass,[[.11,.51],[.79,.51],[.65,1.69],[.11,1.7]],z);
  rod(cab,M.boom,V(.065,.47,z),V(.065,1.76,z),.031);
  rod(cab,M.boom,V(-.74,.42,z),V(.77,.43,z),.028);
 }
 // Sloping front screen, so the cab silhouette follows the reference rather than a box.
 const front=new T.BufferGeometry();front.setAttribute('position',new T.Float32BufferAttribute([.88,.46,-.66,.88,.46,.66,.70,1.78,.66,.70,1.78,-.66],3));front.setIndex([0,1,2,0,2,3]);front.computeVertexNormals();add(cab,front,M.glass).castShadow=false;
 for(const z of [-.69,.69])rod(cab,M.boom,V(.90,.43,z),V(.70,1.81,z),.044);
 rod(cab,M.boom,V(.70,1.81,-.69),V(.70,1.81,.69),.044);
 const rear=add(cab,new T.PlaneGeometry(1.3,1.23),M.glass,-.8,.93,0);rear.rotation.y=-Math.PI/2;rear.castShadow=false;
 // The operator's front window is deliberately unobstructed: no diagonal
 // wiper rod. Interior furniture is authored separately below the sight line.
}
export function volvoArmMarkings(shoulder,M){
 for(const side of [-1,1]){
  const label=lettering(shoulder,'VOLVO',{x:3.45,y:.74,z:side>0?.259:-.238,width:1.35,height:.27,font:'900 260px Georgia',side,name:'Volvo boom lettering'});label.rotation.order='ZYX';label.rotation.z=-.36;
  // Warning placard near the root, as on the real machine.
  block(shoulder,M.warning,[.18,.24,.018],[.28,.05,side>0?.259:-.238],.01);
 }
}
export function volvoTrackFrames(root,M){for(const side of [-1,1]){const z=side*2.14;plate(root,M.boom,[[-2.17,.5],[2.17,.5],[2.32,.66],[2.09,.88],[-2.07,.88],[-2.3,.66]],.11,z);for(let i=0;i<7;i++){pin(root,M.black,-1.85+i*.61,.68,z+side*.07,.075,.035);pin(root,M.steel,-1.85+i*.61,.68,z+side*.09,.038,.04)}}}
