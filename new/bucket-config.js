// The shell sits below the pin, leaving clearance for the stick at full curl.
import {retainedVolume} from './charge-shape.js?build=career-20261106-19';
import {BUCKET_VOLUME,BUCKET_SHELL_DROP,MACHINE} from './material-volume.js?build=career-20261106-19';
export const FACE_SHOVEL=MACHINE.kind==='face-shovel';
export const BUCKET={closed:FACE_SHOVEL?.25:-.48,open:FACE_SHOVEL?.25:2.45,workOpen:FACE_SHOVEL?.25:2.05,drop:BUCKET_SHELL_DROP,mouth:{x:FACE_SHOVEL?1.28:-1.28,y:-1.47,z:0},teeth:{x:FACE_SHOVEL?1.82:-1.80,y:-1.50},cargo:{x:FACE_SHOVEL?.18:-.18,y:-1.5}};
const bottomOutlet=Object.freeze({x:.15,y:-1.73,z:0});
export function dischargeMouth(){return FACE_SHOVEL?bottomOutlet:BUCKET.mouth;}
// Extra mechanical travel opens the bucket farther without recalibrating
// the established mouth aperture, starting dig pose or discharge response.
export function opening(q){return FACE_SHOVEL?1:Math.max(0,Math.min(1,(q-BUCKET.closed)/(BUCKET.workOpen-BUCKET.closed)))}
export function releaseRate(s,time=0){
 if(FACE_SHOVEL){const aperture=Math.max(0,Math.min(1,(s.shovelDoor||0)-.12))/.88;return s.payload>0?Math.min(.78,Math.sqrt(s.payload)*.9)*Math.pow(aperture,1.5):0;}
 const fraction=opening(s.curl);if(s.assistedCarry||fraction<=.105||s.payload<=0)return 0;
 const held=retainedVolume(s),retained=fraction>.9&&held<.02?0:held;
 // Closing drives a dry charge against the back of the bowl. Its heap can
 // bridge the lip briefly instead of leaking like fluid during the last curl.
 // A stopped, opening or badly inverted bowl keeps the normal gravity flow.
 if((s.velocity?.curl||0)<-.04&&fraction<.65&&held>BUCKET_VOLUME*.6)return 0;
 const excess=Math.max(0,s.payload-retained/BUCKET_VOLUME);
 const packet=.76+.16*Math.sin(time*19.7)+.08*Math.sin(time*37.1);
 return Math.min(.68,Math.sqrt(excess)*.85)*Math.min(1,(fraction-.105)*4)*packet;
}
