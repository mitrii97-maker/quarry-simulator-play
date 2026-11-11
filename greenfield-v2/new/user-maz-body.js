import * as T from '../three.module.js';
import {bodyTopFront,bodyTopRear} from './hauler-body-config.js';

const COMPONENTS={5121:Uint8Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};
const ITEMS={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};

function readAccessor(json,bin,index){
 const accessor=json.accessors[index],view=json.bufferViews[accessor.bufferView],Type=COMPONENTS[accessor.componentType],items=ITEMS[accessor.type];
 if(!Type||!items)throw new Error('Unsupported MAZ GLB accessor');
 const start=(view.byteOffset||0)+(accessor.byteOffset||0),stride=view.byteStride||Type.BYTES_PER_ELEMENT*items;
 if(stride===Type.BYTES_PER_ELEMENT*items)return new Type(bin.buffer,bin.byteOffset+start,accessor.count*items).slice();
 const out=new Type(accessor.count*items),source=new DataView(bin.buffer,bin.byteOffset+start);
 for(let i=0;i<accessor.count;i++)for(let j=0;j<items;j++){
  const offset=i*stride+j*Type.BYTES_PER_ELEMENT;
  out[i*items+j]=accessor.componentType===5126?source.getFloat32(offset,true):accessor.componentType===5125?source.getUint32(offset,true):accessor.componentType===5123?source.getUint16(offset,true):source.getUint8(offset);
 }
 return out;
}

export function parseMazBodyGlb(buffer,material){
 const data=new DataView(buffer);if(data.getUint32(0,true)!==0x46546c67)throw new Error('Not a GLB file');
 let offset=12,json=null,bin=null;
 while(offset<data.byteLength){const length=data.getUint32(offset,true),type=data.getUint32(offset+4,true);offset+=8;const chunk=new Uint8Array(buffer,offset,length);if(type===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(chunk));if(type===0x004e4942)bin=chunk;offset+=length;}
 if(!json||!bin)throw new Error('Incomplete MAZ GLB');
 const group=new T.Group();group.name='User supplied MAZ dump body';
 // Cube, Cube.001 and Cube.003 are the body side and its reinforcing rails.
 // Plane.001 belongs to the Blender work scene and is intentionally excluded.
 for(const node of json.nodes.slice(0,3)){
  if(node.mesh===undefined)continue;const primitive=json.meshes[node.mesh].primitives[0],g=new T.BufferGeometry();
  g.setAttribute('position',new T.BufferAttribute(readAccessor(json,bin,primitive.attributes.POSITION),3));
  if(primitive.attributes.NORMAL!==undefined)g.setAttribute('normal',new T.BufferAttribute(readAccessor(json,bin,primitive.attributes.NORMAL),3));
  if(primitive.attributes.TEXCOORD_0!==undefined)g.setAttribute('uv',new T.BufferAttribute(readAccessor(json,bin,primitive.attributes.TEXCOORD_0),2));
  if(primitive.indices!==undefined)g.setIndex(new T.BufferAttribute(readAccessor(json,bin,primitive.indices),1));
  if(!g.attributes.normal)g.computeVertexNormals();
  const mesh=new T.Mesh(g,material);mesh.name=node.name||'MAZ body part';mesh.castShadow=mesh.receiveShadow=true;
  mesh.position.fromArray(node.translation||[0,0,0]);mesh.quaternion.fromArray(node.rotation||[0,0,0,1]);mesh.scale.fromArray(node.scale||[1,1,1]);group.add(mesh);
 }
 return group;
}

export async function attachUserMazBody(root,material,B){
 const response=await fetch(new URL('../assets/models/maz/upKuzov.glb',import.meta.url));if(!response.ok)throw new Error('MAZ body '+response.status);
 const source=parseMazBodyGlb(await response.arrayBuffer(),material),box=new T.Box3().setFromObject(source),size=box.getSize(new T.Vector3());
 if(size.x<.01||size.y<.01||size.z<.001)throw new Error('Empty MAZ body');
 const targetLength=bodyTopFront-bodyTopRear,targetHeight=B.frontRim-B.floor,thickness=.075;
 source.scale.set(targetLength/size.x,targetHeight/size.y,thickness/size.z);
 source.position.set(bodyTopRear-box.min.x*source.scale.x,B.floor-box.min.y*source.scale.y,B.topDepth/2-(box.min.z+size.z/2)*source.scale.z);
 const opposite=source.clone(true);opposite.scale.z*=-1;opposite.position.z*=-1;
 const pair=new T.Group();pair.name='upKuzov.glb fitted dump-body sides';pair.add(source,opposite);root.add(pair);return pair;
}
