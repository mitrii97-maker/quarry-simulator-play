import * as T from '../three.module.js';
import {V,add,block,rod} from './geometry.js';
import {GREENFIELD_LAYOUT} from './development-config.js';
import {createTrackImprints} from './track-imprints.js';

function roadMesh(scene,M,height){
 const points=[[-34,-10],[-12,-10],[8,-10],[24,-5],[42,-3],[57,-13],[71,-30],[82,-48]],width=GREENFIELD_LAYOUT.roadWidth,positions=[],uv=[],indices=[],segments=120,cross=8,curve=new T.CatmullRomCurve3(points.map(([x,z])=>V(x,0,z)),false,'centripetal'),p=V(),t=V();let distance=0,last=V();
 for(let i=0;i<=segments;i++){curve.getPoint(i/segments,p);curve.getTangent(i/segments,t);if(i)distance+=p.distanceTo(last);last.copy(p);for(let j=0;j<=cross;j++){const side=(j/cross-.5)*width,x=p.x-t.z*side,z=p.z+t.x*side,edge=Math.abs(j/cross-.5)*2;positions.push(x,height(x,z)+.035+edge*.018,z);uv.push(j/cross*2,distance*.17);if(i<segments&&j<cross){const k=i*(cross+1)+j;indices.push(k,k+1,k+cross+1,k+1,k+cross+2,k+cross+1);}}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const mat=M.ground.clone();mat.color.set('#7b725e');mat.roughness=1;mat.map=M.ground.map.clone();mat.map.repeat.set(3,14);mat.normalMap=M.ground.normalMap.clone();mat.normalMap.repeat.set(3,14);mat.polygonOffset=true;mat.polygonOffsetFactor=-3;const road=new T.Mesh(g,mat);road.name='Single compacted exploration access road';road.receiveShadow=true;scene.add(road);return road;
}

function plantedTrees(scene,M,height){
 const count=190,trunks=new T.InstancedMesh(new T.CylinderGeometry(.13,.18,1.7,7),M.dark,count),crowns=new T.InstancedMesh(new T.ConeGeometry(1.25,4.5,9),new T.MeshStandardMaterial({color:'#405d38',roughness:1}),count),dummy=new T.Object3D();let seed=9137;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
 for(let i=0;i<count;i++){const a=random()*Math.PI*2,r=GREENFIELD_LAYOUT.treeInnerRadius+(GREENFIELD_LAYOUT.treeOuterRadius-GREENFIELD_LAYOUT.treeInnerRadius)*Math.sqrt(random()),x=Math.cos(a)*r,z=Math.sin(a)*r,y=height(x,z),scale=.72+random()*.72;dummy.position.set(x,y+.85*scale,z);dummy.scale.set(scale,scale,scale);dummy.rotation.y=random()*6.28;dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);dummy.position.y=y+(1.7+2.0)*scale;dummy.scale.set(scale,scale,scale);dummy.updateMatrix();crowns.setMatrixAt(i,dummy.matrix);}
 trunks.name='Mixed birch and pine tree line';crowns.name='Distant greenfield tree crowns';trunks.castShadow=crowns.castShadow=true;trunks.receiveShadow=crowns.receiveShadow=true;scene.add(trunks,crowns);return {trunks,crowns};
}

function fieldDetails(scene,M,height){
 const group=new T.Group();group.name='Surveyed first excavation parcel';scene.add(group);
 const stakeMat=M.paint.clone();stakeMat.color.set('#d9c04a');for(const x of [-25,-18,-11,-4,3,10])for(const z of [-7,7]){const y=height(x,z);rod(group,stakeMat,V(x,y,z),V(x,y+1.05,z),.035);block(group,M.dark,[.32,.06,.07],[x,y+.76,z],.01);}
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=180;const c=canvas.getContext('2d');c.fillStyle='#26332d';c.fillRect(0,0,640,180);c.strokeStyle='#d0ae4d';c.lineWidth=9;c.strokeRect(7,7,626,166);c.fillStyle='#f2eee1';c.font='700 44px Arial';c.textAlign='center';c.fillText(GREENFIELD_LAYOUT.startLabel,320,76);c.font='28px Arial';c.fillText('ВЫЕМКА В ГРАНИЦАХ КОЛЫШКОВ',320,126);const sign=add(group,new T.BoxGeometry(5.8,1.62,.10),new T.MeshStandardMaterial({map:new T.CanvasTexture(canvas),roughness:.8}),-26,height(-26,10)+1.7,10);rod(group,M.steel,V(-28.1,height(-28.1,10),10),V(-28.1,height(-28.1,10)+2.6,10),.055);rod(group,M.steel,V(-23.9,height(-23.9,10),10),V(-23.9,height(-23.9,10)+2.6,10),.055);
 for(const [x,z] of [[49,8],[50.1,8.2],[51.2,8.1]]){const y=height(x,z);add(group,new T.CylinderGeometry(.32,.32,.86,16),M.dark,x,y+.43,z);}
 return {group,sign};
}

export function createGreenfieldSite(scene,M,height){
 const road=roadMesh(scene,M,height),trees=plantedTrees(scene,M,height),details=fieldDetails(scene,M,height);
 const tyres=createTrackImprints(scene,{spacing:1.02,width:.34,length:.55,capacity:768,offset:-1.52,height,lift:.06,opacity:.20,name:'MAZ tyre traces on dirt road'}),tracks=createTrackImprints(scene,{spacing:1.05,width:.62,length:.50,capacity:384,offset:-2.05,height,lift:.06,opacity:.18,name:'EW160 wheel traces'});let clock=0;
 return {group:details.group,road,trees,tracks,tyres,update(dt,trucks,state,rocks,rig,pressure=0){clock+=dt;for(const t of trucks)if((t.route?.speed||0)>.25)tyres.add(t.x,t.z,t.yaw,t.index);if(Math.abs(state.driveSpeed||0)>.08)tracks.add(state.baseX,state.baseZ,0);if(clock<.32)return;clock=0;for(const t of trucks)if((t.route?.speed||0)>2.2){const x=t.x-Math.cos(t.yaw)*1.4,z=t.z+Math.sin(t.yaw)*1.4;rocks.puff(V(x,height(x,z)+.08,z),.045);}if(rig&&pressure>.35){const p=rig.house.localToWorld(V(-1.2,1.2,.5));rocks.puff(p,.012);}},reset(){tyres.clear();tracks.clear();clock=0;}};
}
