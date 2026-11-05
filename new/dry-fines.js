import * as T from '../three.module.js?build=career-20261106-18';
export function aggregateMaterial(source){
 const material=source.clone();material.vertexColors=true;material.flatShading=false;material.roughness=1;material.metalness=0;material.normalMap=null;material.roughnessMap=null;material.envMapIntensity=.16;material.color.lerp(new T.Color('#aaa69c'),.45);
 material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 aggregatePosition;varying vec3 aggregateNormal;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\naggregatePosition=position;aggregateNormal=normal;');
  shader.fragmentShader='varying vec3 aggregatePosition;varying vec3 aggregateNormal;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
   vec3 w=pow(abs(normalize(aggregateNormal)),vec3(3.));w/=max(.0001,w.x+w.y+w.z);vec3 q=aggregatePosition*3.8;vec3 grain=texture2D(map,q.zy).rgb*w.x+texture2D(map,q.xz).rgb*w.y+texture2D(map,q.xy).rgb*w.z;float dust=dot(grain,vec3(.2126,.7152,.0722));float macro=.97+.025*sin(aggregatePosition.x*.7+aggregatePosition.z*1.1);diffuseColor.rgb*=clamp(.82+dust*.36,.84,1.12)*macro;
   #endif`);
  // Stationary millimetre-scale grit, filtered out before it becomes subpixel.
  // Lighting detail is evaluated in the shader, with no new stones or textures.
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   vec3 gritP=aggregatePosition*150.;float gritFoot=max(length(dFdx(gritP)),length(dFdy(gritP)));float gritAA=1.-smoothstep(.65,1.6,gritFoot);
   float grit=fract(sin(dot(floor(gritP),vec3(127.1,311.7,74.7)))*43758.5453);
   vec3 gritX=dFdx(-vViewPosition),gritY=dFdy(-vViewPosition),gritR1=cross(gritY,normal),gritR2=cross(normal,gritX);float gritDet=dot(gritX,gritR1);
   vec2 gritD=vec2(dFdx(grit),dFdy(grit))*.0008*gritAA;normal=normalize(max(abs(gritDet),1e-10)*normal-sign(gritDet)*(gritD.x*gritR1+gritD.y*gritR2));
   diffuseColor.rgb*=1.+(grit-.5)*.15*gritAA;
  `);
 };material.customProgramCacheKey=()=> 'dry-fine-aggregate-grain-v3';return material;
}
const finesMaterial=aggregateMaterial;
// A rough, stationary aggregate under the clasts seals their interstitial voids.
// This is the fine fraction of the SAME payload, never extra simulated mass.
export function createDryFines(parent,source,capacity=12288,depth=.035){
 const geometry=new T.BufferGeometry(),positions=new Float32Array(capacity*3),colors=new Float32Array(capacity*3),normals=new Float32Array(capacity*3),material=finesMaterial(source);
 geometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('color',new T.BufferAttribute(colors,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('normal',new T.BufferAttribute(normals,3).setUsage(T.DynamicDrawUsage));geometry.setDrawRange(0,0);
 const mesh=new T.Mesh(geometry,material);mesh.name='Dry compacted dust and fine aggregate';mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.userData.dynamic=true;parent.add(mesh);let count=0;
 function vertex(x,y,z,up){if(count>=capacity)throw Error('Fine aggregate buffer exceeded');const noise=Math.sin(x*37.2+z*31.7+y*5.1)*Math.sin(z*53.4-x*21.8),indent=depth+noise*.012,shade=.60+noise*.065,i=count++*3;positions[i]=x-up[0]*indent;positions[i+1]=y-up[1]*indent;positions[i+2]=z-up[2]*indent;colors[i]=shade;colors[i+1]=shade*.97;colors[i+2]=shade*.90;}
 function triangle(a,b,c,up=[0,1,0],divisions=1){
  function at(i,j){const u=i/divisions,v=j/divisions;vertex(a[0]+(b[0]-a[0])*u+(c[0]-a[0])*v,a[1]+(b[1]-a[1])*u+(c[1]-a[1])*v,a[2]+(b[2]-a[2])*u+(c[2]-a[2])*v,up);}
  function normal(){const k=count*3-9,ax=positions[k+3]-positions[k],ay=positions[k+4]-positions[k+1],az=positions[k+5]-positions[k+2],bx=positions[k+6]-positions[k],by=positions[k+7]-positions[k+1],bz=positions[k+8]-positions[k+2],nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx,d=Math.hypot(nx,ny,nz)||1;for(let i=k;i<k+9;i+=3){normals[i]=nx/d;normals[i+1]=ny/d;normals[i+2]=nz/d;}}
  for(let j=0;j<divisions;j++)for(let i=0;i<divisions-j;i++){at(i,j);at(i+1,j);at(i,j+1);normal();if(i+j<divisions-1){at(i+1,j);at(i+1,j+1);at(i,j+1);normal();}}
 }
 return {mesh,begin(){count=0;},triangle,finish(){geometry.setDrawRange(0,count);mesh.visible=count>0;if(count){for(const attribute of Object.values(geometry.attributes)){attribute.clearUpdateRanges();attribute.addUpdateRange(0,count*3);attribute.needsUpdate=true;}}return count;}};
}

// Shared indexed vertices for large height fields. X/Z, grain colour and local
// roughness are immutable; updates touch only heights/normals and exposed indices.
// No per-cell vectors, triangles or arrays are allocated while digging/loading.
export function createHeightFines(parent,source,{nx,nz,x,z,dx,dz=dx,signed=false,depth=.008,closeSides=false,flare=0,flareHeight=1.73,rimSlope=0,frontStretch=0,rearStretch=0}){
 const count=nx*nz,positions=new Float32Array(count*3),colors=new Float32Array(count*3),normals=new Float32Array(count*3),indent=new Float32Array(count),indices=new Uint16Array((nx-1)*(nz-1)*6),geometry=new T.BufferGeometry();
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=j*nx+i,a=k*3,xx=x+i*dx,zz=z+j*dz,noise=Math.sin(xx*37.2+zz*31.7)*Math.sin(zz*53.4-xx*21.8),shade=.60+noise*.065;positions[a]=xx;positions[a+2]=zz;indent[k]=depth+noise*.004;colors[a]=shade;colors[a+1]=shade*.97;colors[a+2]=shade*.9;normals[a+1]=1;}
 geometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('normal',new T.BufferAttribute(normals,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('color',new T.BufferAttribute(colors,3));geometry.setIndex(new T.BufferAttribute(indices,1).setUsage(T.DynamicDrawUsage));geometry.setDrawRange(0,0);
 const material=finesMaterial(source);const mesh=new T.Mesh(geometry,material);mesh.name='Dense dry fine aggregate';mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.userData.dynamic=true;mesh.visible=false;parent.add(mesh);
 const ring=[];for(let i=0;i<nx;i++)ring.push(i);for(let j=1;j<nz;j++)ring.push(j*nx+nx-1);for(let i=nx-2;i>=0;i--)ring.push((nz-1)*nx+i);for(let j=nz-2;j>0;j--)ring.push(j*nx);
 let sideMesh=null,sidePositions=null,sideNormals=null;
 if(closeSides){sidePositions=new Float32Array(ring.length*18);sideNormals=new Float32Array(ring.length*18);const sideColors=new Float32Array(ring.length*18).fill(.60),g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(sidePositions,3).setUsage(T.DynamicDrawUsage));g.setAttribute('normal',new T.BufferAttribute(sideNormals,3).setUsage(T.DynamicDrawUsage));g.setAttribute('color',new T.BufferAttribute(sideColors,3));sideMesh=new T.Mesh(g,material);sideMesh.name='Solid aggregate cross-section down to load floor';sideMesh.castShadow=sideMesh.receiveShadow=true;sideMesh.frustumCulled=false;mesh.add(sideMesh);}
 function update(heights,cut=null,scale=1,holes=null){
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=j*nx+i,a=k*3,h=signed?heights[k]*scale-indent[k]:Math.max(0,heights[k]*scale-indent[k]),factor=Math.min(1,Math.max(0,h/(flareHeight+rimSlope*i/(nx-1))));positions[a]=x+i*dx+(frontStretch*i/(nx-1)-rearStretch*(1-i/(nx-1)))*factor;positions[a+1]=h;positions[a+2]=(z+j*dz)*(1+flare*factor);}
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=j*nx+i,a=k*3,l=(j*nx+Math.max(0,i-1))*3,r=(j*nx+Math.min(nx-1,i+1))*3,b=(Math.max(0,j-1)*nx+i)*3,f=(Math.min(nz-1,j+1)*nx+i)*3,ux=positions[r]-positions[l],uy=positions[r+1]-positions[l+1],uz=positions[r+2]-positions[l+2],vx=positions[f]-positions[b],vy=positions[f+1]-positions[b+1],vz=positions[f+2]-positions[b+2],xx=vy*uz-vz*uy,yy=vz*ux-vx*uz,zz=vx*uy-vy*ux,d=Math.hypot(xx,yy,zz)||1;normals[a]=xx/d;normals[a+1]=yy/d;normals[a+2]=zz/d;}
  if(sideMesh){
   let n=0;
   function vertex(x,y,z,nx,ny,nz){sidePositions[n]=x;sideNormals[n++]=nx;sidePositions[n]=y;sideNormals[n++]=ny;sidePositions[n]=z;sideNormals[n++]=nz;}
   function triangle(ax,ay,az,bx,by,bz,cx,cy,cz){const ux=bx-ax,uy=by-ay,uz=bz-az,vx=cx-ax,vy=cy-ay,vz=cz-az,xx=uy*vz-uz*vy,yy=uz*vx-ux*vz,zz=ux*vy-uy*vx,d=Math.hypot(xx,yy,zz)||1;vertex(ax,ay,az,xx/d,yy/d,zz/d);vertex(bx,by,bz,xx/d,yy/d,zz/d);vertex(cx,cy,cz,xx/d,yy/d,zz/d);}
   for(let edge=0;edge<ring.length;edge++){const a=ring[edge],b=ring[(edge+1)%ring.length],aa=a*3,bb=b*3,baseAX=x+a%nx*dx,baseAZ=z+Math.floor(a/nx)*dz,baseBX=x+b%nx*dx,baseBZ=z+Math.floor(b/nx)*dz;triangle(positions[aa],positions[aa+1],positions[aa+2],positions[bb],positions[bb+1],positions[bb+2],baseBX,0,baseBZ);triangle(positions[aa],positions[aa+1],positions[aa+2],baseBX,0,baseBZ,baseAX,0,baseAZ);}
   sideMesh.geometry.attributes.position.needsUpdate=sideMesh.geometry.attributes.normal.needsUpdate=true;
  }

  let used=0;for(let j=0;j<nz-1;j++)for(let i=0;i<nx-1;i++){const a=j*nx+i,b=a+1,c=a+nx,d=c+1;if(holes&&(holes[a]||holes[b]||holes[c]||holes[d]))continue;if(cut&&!(cut[a]||cut[b]||cut[c]||cut[d]))continue;if(!signed&&Math.max(heights[a],heights[b],heights[c],heights[d])<.002)continue;indices[used++]=a;indices[used++]=c;indices[used++]=b;indices[used++]=b;indices[used++]=c;indices[used++]=d;}
  geometry.setDrawRange(0,used);mesh.visible=used>0;if(used){geometry.index.clearUpdateRanges();geometry.index.addUpdateRange(0,used);geometry.index.needsUpdate=true;geometry.attributes.position.needsUpdate=true;geometry.attributes.normal.needsUpdate=true;}return used;
 }
 return {mesh,sides:sideMesh,update,clear(){geometry.setDrawRange(0,0);mesh.visible=false;}};
}
