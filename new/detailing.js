import * as T from '../three.module.js';
import {V,add,block,pin,rod,hose,plate} from './geometry.js';
function bolt(parent,M,x,y,z,axis='z',r=.035){const b=add(parent,new T.CylinderGeometry(r,r,.035,6),M.steel,x,y,z);if(axis==='z')b.rotation.x=Math.PI/2;if(axis==='x')b.rotation.z=Math.PI/2;return b}
export function detailExcavator(parts,M){const {root,house,cab,shoulder,stick,bucket}=parts;
 // Service hatches, seams, latches and tie-down eyes.
 for(const z of [-1.36,1.36]){block(house,M.dark,[1.1,.66,.018],[-1.35,.51,z],.035);block(house,M.paint,[1.04,.6,.025],[-1.35,.51,z+Math.sign(z)*.015],.035);for(const x of [-1.75,-.95])for(const y of [.29,.73])bolt(house,M,x,y,z+Math.sign(z)*.04);block(house,M.steel,[.17,.03,.045],[-.96,.52,z+Math.sign(z)*.07],.01);}
 for(const x of [-2.35,-1.95])rod(house,M.dark,V(x,1.06,-.5),V(x,1.06,.5),.025);
 for(let i=0;i<10;i++)block(house,M.black,[.9,.018,.045],[-1.2,1.08,-.7+i*.14],.005);
 // Cab door seal, hinges, handle, mirror and roof work lights.

 block(cab,M.dark,[.035,.25,.07],[-.4,.42,-.79],.01);for(const y of [.5,1.45])block(cab,M.steel,[.08,.13,.04],[-.77,y,-.79],.01);
 rod(cab,M.dark,V(.62,1.53,-.75),V(.9,1.6,-1.13),.025);block(cab,M.dark,[.2,.34,.075],[.94,1.55,-1.15],.035);block(cab,M.chrome,[.16,.28,.015],[.94,1.55,-1.2],.025);
 for(const z of [-.52,.52]){block(cab,M.dark,[.2,.13,.25],[.69,1.99,z],.025);block(cab,M.lamp,[.025,.09,.19],[.81,1.99,z],.015)}
 // Interior controls are grouped on the low dashboard and side consoles.
 // Pin caps, grease nipples and segmented hydraulic fittings.
 for(const [parent,x,y,width] of [[shoulder,0,0,1.08],[stick,0,0,.96],[bucket,0,0,1.15]])for(const z of [-width/2,width/2]){pin(parent,M.dark,x,y,z,.12,.035);bolt(parent,M,x,y,z+Math.sign(z)*.04,'z',.07);}
 hose(stick,M.black,[V(.22,.4,-.28),V(.6,.48,-.3),V(1.2,.44,-.3),V(1.5,.38,-.3)],.02);
 for(const z of [-.3,.3]){rod(shoulder,M.chrome,V(.4,.35,z),V(.6,.4,z),.035);rod(stick,M.chrome,V(.16,.4,z),V(.36,.44,z),.035)}
 // Snow lies on horizontal surfaces, rather than changing the machinery's geometry.
 block(cab,M.snow,[1.55,.07,1.5],[0,1.98,0],.12);block(house,M.snow,[1.7,.045,1.05],[-1.6,1.47,.22],.1);block(house,M.snow,[1.55,.045,.42],[-.6,1.47,-.75],.08);
 for(const z of [-1.35,1.35])for(let i=0;i<12;i++)block(root,M.snow,[.23,.035,.45],[-2.35+i*.42,1.15,z+.2],.02);
}
export function detailTruck(root,M){
 // Bed hinge housings and heavy chassis cross-members.
 for(const z of [-1.42,1.42]){pin(root,M.dark,-3.08,1.57,z,.17,.26);for(const x of [-2.4,-.8,.8])block(root,M.dark,[.11,.34,.2],[x,1.4,z],.02);}
 for(const z of [-1.3,1.3]){rod(root,M.steel,V(1.42,3.45,z),V(3.2,3.45,z),.027);for(const x of [1.42,3.2])rod(root,M.steel,V(x,3.4,z),V(x,3.72,z),.027);rod(root,M.steel,V(1.42,3.72,z),V(3.2,3.72,z),.027)}
 for(const z of [-1.1,1.1]){block(root,M.dark,[.04,.17,.3],[-3.5,1.74,z],.02);const red=new T.MeshStandardMaterial({color:'#98251d',emissive:'#63170f',emissiveIntensity:.35});block(root,red,[.018,.12,.23],[-3.53,1.74,z],.015)}
 for(const z of [-1.82,1.82]){rod(root,M.dark,V(3,2.9,z),V(3.1,3.3,z),.025);block(root,M.dark,[.11,.28,.16],[3.1,3.35,z],.025);}
 for(const z of [-1.68,1.68])for(let i=0;i<7;i++)bolt(root,M,-3.1+i*.68,2.0,z+Math.sign(z)*.19);
 block(root,M.snow,[2.15,.065,3.4],[2.25,3.51,0],.1);for(const z of [-1.68,1.68])block(root,M.snow,[4.4,.045,.12],[-.9,3.26,z],.03);block(root,M.snow,[.12,.045,3.2],[-3.35,3.15,0],.02);
}
