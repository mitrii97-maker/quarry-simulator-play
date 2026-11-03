import * as T from '../three.module.js';
import {V,add,block,rod} from './geometry.js';
import {roundedBlock} from './sculpted.js';
import {batchMeshes} from '../batching.js';

// Fixed cockpit geometry. Keep the whole front viewing aperture clear: the
// instruments sit on the low sill/right console, never on the windscreen.
export function makeCabinInterior(cab,M){
 const cockpit=new T.Group();cockpit.name='Operator cockpit';cab.add(cockpit);
 const trim=M.dark.clone();trim.color.set('#414b50');trim.roughness=.92;trim.metalness=.03;trim.envMapIntensity=.65;
 const soft=M.seat.clone();soft.color.set('#353e41');soft.roughness=.98;soft.metalness=0;
 const mat=M.rubber.clone();mat.color.set('#171e22');mat.roughness=1;mat.metalness=0;
 const deck=block(cockpit,mat,[1.38,.035,1.28],[0,.16,0],.02);deck.name='Recessed rubber footwell';
 for(let i=0;i<12;i++)block(cockpit,trim,[.036,.009,1.12],[-.57+i*.1,.183,0],.003);
 roundedBlock(cockpit,trim,[.43,.23,.46],[-.31,.29,0],.055);
 roundedBlock(cockpit,soft,[.57,.18,.56],[-.29,.49,0],.065);
 const back=roundedBlock(cockpit,soft,[.16,.68,.56],[-.53,.89,0],.065);back.rotation.z=.09;
 roundedBlock(cockpit,soft,[.13,.18,.33],[-.57,1.28,0],.055);
 for(const z of [-.20,0,.20])rod(cockpit,trim,V(-.425,.64,z),V(-.475,1.12,z),.008);
 for(const side of [-1,1]){
  const z=side*.46;
  roundedBlock(cockpit,trim,[.84,.23,.27],[-.14,.43,z],.055);
  roundedBlock(cockpit,soft,[.43,.07,.22],[-.31,.59,z],.03);
  const boot=add(cockpit,new T.CylinderGeometry(.07,.09,.07,12),mat,.13,.58,z);
  rod(cockpit,M.black,V(.13,.61,z),V(.08,.78,z),.023);
  const grip=roundedBlock(cockpit,mat,[.095,.13,.09],[.08,.8,z],.025);grip.rotation.z=.18;
  block(cockpit,M.display,[.021,.018,.04],[.13,.829,z],.004);
  for(let i=0;i<3;i++)block(cockpit,i===0?M.display:mat,[.045,.018,.035],[.18,.56,z-side*(.055+i*.045)],.007);
  roundedBlock(cockpit,trim,[1.40,.32,.045],[-.05,.34,side*.68],.018);
  rod(cockpit,mat,V(-.59,.8,side*.69),V(-.24,.8,side*.69),.025);
 }
 // Thin low dashboard, foot pedals and recessed demister vents.
 roundedBlock(cockpit,trim,[.20,.20,1.22],[.59,.34,0],.035);
 for(let i=0;i<10;i++)block(cockpit,mat,[.035,.012,.028],[.53,.449,-.48+i*.105],.003);
 for(const z of [-.16,.16]){
  const pedal=roundedBlock(cockpit,mat,[.29,.045,.18],[.32,.235,z],.012);pedal.rotation.z=-.17;
  for(let i=0;i<4;i++){const rib=block(cockpit,trim,[.026,.012,.15],[.22+i*.055,.264-(i*.055)*.17,z],.003);rib.rotation.z=-.17;}
 }
 // Right-hand display backing: small enough to leave the lower window clear.
 roundedBlock(cockpit,trim,[.095,.25,.35],[.57,.59,.43],.025);
 for(let i=0;i<4;i++)block(cockpit,i===0?M.display:mat,[.02,.026,.038],[.625,.42,.30+i*.08],.006);
 roundedBlock(cockpit,trim,[1.38,.04,1.32],[-.10,1.77,0],.02);
 batchMeshes(cockpit);return {group:cockpit};
}
