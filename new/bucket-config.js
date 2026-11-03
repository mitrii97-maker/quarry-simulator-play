// The shell sits below the pin, leaving clearance for the stick at full curl.
import {retainedVolume} from './charge-shape.js';
import {BUCKET_VOLUME,BUCKET_SHELL_DROP} from './material-volume.js';
export const BUCKET={closed:-.48,open:2.45,workOpen:2.05,drop:BUCKET_SHELL_DROP,mouth:{x:-1.28,y:-1.47,z:0},teeth:{x:-1.80,y:-1.50},cargo:{x:-.18,y:-1.5}};
// Extra mechanical travel opens the bucket farther without recalibrating
// the established mouth aperture, starting dig pose or discharge response.
export function opening(q){return Math.max(0,Math.min(1,(q-BUCKET.closed)/(BUCKET.workOpen-BUCKET.closed)))}
export function releaseRate(s,time=0){
 const fraction=opening(s.curl);if(s.assistedCarry||fraction<=.105||s.payload<=0)return 0;
 const held=retainedVolume(s),retained=fraction>.9&&held<.02?0:held;
 // Closing drives a dry charge against the back of the bowl. Its heap can
 // bridge the lip briefly instead of leaking like fluid during the last curl.
 // A stopped, opening or badly inverted bowl keeps the normal gravity flow.
 if((s.velocity?.curl||0)<-.04&&fraction<.65&&held>BUCKET_VOLUME*.6)return 0;
 const excess=Math.max(0,s.payload-retained/BUCKET_VOLUME);
 const phase=((time*2.65+Math.sin(time*1.7)*.045)%1+1)%1,packet=phase<.40?1:phase<.67?0:.72;
 return Math.min(.68,Math.sqrt(excess)*.85)*Math.min(1,(fraction-.105)*4)*packet;
}
