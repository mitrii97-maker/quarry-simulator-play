import {currentMachine} from './machine-config.js?build=career-20261106-18';
// One length unit is one metre. Loose ore expands when cut out of the bank.
export const MACHINE = currentMachine();
export const ORE={bankDensity:6.4,looseDensity:5.2};
// Interior cross-section follows the rendered shell, with space for its steel
// walls and the open lip. A closed bucket carries material below that lip.
export const BUCKET_INTERIOR=[[.38,.04],[.72,-.3],[.66,-.88],[.17,-1.19],[-.58,-1.13],[-1.13,-.71]];
export const BUCKET_VOLUME=MACHINE.capacity;
// Rated gameplay capacity is independent of the retained compact visual model.
export const BUCKET_INNER_WIDTH=1.48;
export const BUCKET_VISUAL_VOLUME=polygonArea(BUCKET_INTERIOR)*BUCKET_INNER_WIDTH;
export const BUCKET_WORKING_WIDTH=BUCKET_INNER_WIDTH*MACHINE.scale;
export const BUCKET_CUT_HALF_WIDTH=(BUCKET_INNER_WIDTH/2+.08)*MACHINE.scale;
export const BUCKET_STREAM_WIDTH=1.3*MACHINE.scale;
export const BUCKET_SHELL_DROP=.75;
// Retained compact steel bowl; its complete clear space and crown are mapped
// to the independent nominal capacity by heaped-charge.js.
export const BUCKET_CONTAINER=[[.42,.1],[.77,-.28],[.71,-.9],[.2,-1.25],[-.61,-1.19],[-1.2,-.72]];
function polygonArea(points){let sum=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];sum+=a[0]*b[1]-b[0]*a[1]}return Math.abs(sum)/2}
export const BUCKET_TONNES=BUCKET_VOLUME*ORE.looseDensity;
export const BUCKET_BANK_VOLUME=BUCKET_TONNES/ORE.bankDensity;
