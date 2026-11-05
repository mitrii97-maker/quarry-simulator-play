import * as T from '../three.module.js?build=hotfix-20261106-20';
import {snowOnRock} from './winter-materials.js?build=hotfix-20261106-20';
import {heightMeshSample} from './height-patch.js?build=hotfix-20261106-20';
// A continuous, terraced patch replaces the coarse hillside, so ledges cannot
// float above/intersect an unmodified mountain. All edges meet the original mesh.
const GRID={width:132,depth:45,nx:132,nz:112,x:0,z:49.5};
export function quarryOutcrops(scene,M,coarseHeight){
 const geometry=new T.PlaneGeometry(GRID.width,GRID.depth,GRID.nx,GRID.nz);geometry.rotateX(-Math.PI/2);const p=geometry.attributes.position,colors=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i)+GRID.z,base=coarseHeight(x,z),phase=Math.sin(x*.07)*.16+Math.sin(x*.17)*.06,band=(base+phase)/3.2,level=Math.floor(band),fraction=band-level,round=Math.max(0,Math.min(1,(fraction-.78)/.22)),terrace=Math.max(0,(level+round*round*(3-2*round))*3.2-phase),edge=Math.max(0,Math.min(1,(66-Math.abs(x))/6,(z-27)/4,(72-z)/4)),blend=edge*edge*(3-2*edge);const chips=(Math.sin(x*2.3+z*.71)*Math.sin(z*2.9-x*.41)*.12+Math.sin(x*5.7-z*3.8)*.035)*blend*Math.min(1,Math.abs(terrace-base)*.6);p.setY(i,Math.max(0,T.MathUtils.lerp(base,terrace,blend)+chips));
 // Follow tilted beds through several benches. Thin rusty seams and cooler
 // shale layers share the same dip, independent of the terracing cuts.
 const bed = p.getY(i) + .064*x - .048*z + .32*Math.sin(x*.081);
 const shale = T.MathUtils.smoothstep(Math.cos(bed*1.24 + .45*Math.sin(bed*.67)), .08, .91);
 const iron = T.MathUtils.smoothstep(Math.cos(bed*2.38 + .8*Math.sin(x*.054)), .70, .97);
 const chip = .95 + .05*Math.sin(x*1.7 + z*.47)*Math.sin(z*1.23);
 colors.push((.56 - shale*.43 - iron*.015)*chip,
             (.59 - shale*.44 - iron*.025)*chip,
             (.62 - shale*.44 - iron*.035)*chip);
 }
 geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();const material=(M.rock||M.ground).clone();material.vertexColors=true;snowOnRock(material);const uv=geometry.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)*.23,p.getY(i)*.23+(p.getZ(i)+GRID.z)*.16);const mesh=new T.Mesh(geometry,material);mesh.position.z=GRID.z;mesh.castShadow=mesh.receiveShadow=true;mesh.name='Continuous terraced quarry wall';scene.add(mesh);
 return {mesh,height(x,z){if(x< -66||x>66||z<27||z>72)return undefined;return heightMeshSample(geometry,GRID,x,z)}};
}
