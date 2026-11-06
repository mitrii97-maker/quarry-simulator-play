import * as T from '../three.module.js?build=intro-20261106-27';
import {ground} from './world.js?build=intro-20261106-27';
export function createQuarryHorizons(scene,M){
 const rows=48,segments=192,positions=[],colors=[],uv=[],indices=[];
 for(let j=0;j<=rows;j++)for(let i=0;i<=segments;i++){
  const a=i/segments*Math.PI*2,t=j/rows,r=112+t*185;
  const wav=.055*Math.sin(a*5)+.023*Math.cos(a*11)+.008*Math.sin(a*29);
  const x=5+Math.cos(a)*r*(1.08+wav),z=-8+Math.sin(a)*r*(.86+wav);
  const band=(r-112)/24,step=Math.floor(band),fraction=band-step,face=Math.max(0,Math.min(1,(fraction-.76)/.24));
  const terrace=18+step*5.5+face*face*(3-2*face)*5.5;
  const blend=Math.min(1,t*9),base=ground(x,z),height=base*(1-blend)+Math.max(base,terrace)*blend+.04;
  positions.push(x,height,z);uv.push(x*.12,z*.12);
  const seam=.5+.5*Math.sin(height*1.1+a*.5),shade=.34+seam*.21+.035*Math.sin(i*2.3+j*1.8);colors.push(shade*.91,shade*.98,shade*1.04);
  if(j<rows&&i<segments){const n=j*(segments+1)+i;indices.push(n,n+1,n+segments+1,n+1,n+segments+2,n+segments+1);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();
 const material=M.rock.clone();material.vertexColors=true;material.roughness=.96;const mesh=new T.Mesh(g,material);mesh.name='Distant production benches across expanded coal pit';mesh.receiveShadow=true;mesh.castShadow=false;scene.add(mesh);return mesh;
}
