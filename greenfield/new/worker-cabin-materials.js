import * as T from '../three.module.js';
// Small shared PBR maps, generated once per visit. All random detail is seeded.
export function cabinMaterials(){
 const textures=[],materials=[],cache=new Map();
 function painted(kind,wear=1,color='#c8c0a2'){
  const key=[kind,wear,color].join(':');if(cache.has(key))return cache.get(key);
  const n=256,canvas=document.createElement('canvas');canvas.width=canvas.height=n;const ctx=canvas.getContext('2d'),image=ctx.createImageData(n,n),heights=new Float32Array(n*n);const c=new T.Color(color).convertLinearToSRGB();let seed=6941;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*n+x,noise=random(),stain=(Math.sin(x*.027+Math.sin(y*.019)*2)+Math.sin(y*.041-x*.012))*.5,grain=kind==='wood'?Math.sin(x*.13+Math.sin(y*.017)*4)*.07:kind==='cloth'?(Math.sin(x*2.2)+Math.sin(y*2.2))*.035:0,tile=kind==='floor'&&((x%96<2)||(y%96<2))?-.16:0,damage=Math.max(0,stain-.08)*wear*.32,shade=.92+noise*.12+grain+tile-damage;
   image.data[i*4]=Math.min(255,c.r*255*shade+damage*22);image.data[i*4+1]=Math.min(255,c.g*255*shade);image.data[i*4+2]=Math.min(255,c.b*255*shade-damage*15);image.data[i*4+3]=255;heights[i]=noise*.10+grain+tile+damage*.2;}
  ctx.putImageData(image,0,0);
  if(wear>.1){for(let i=0;i<85*wear;i++){const x=random()*n,y=random()*n;ctx.strokeStyle=`rgba(46,38,25,${.03+random()*.16*wear})`;ctx.lineWidth=.3+random()*1.6;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(random()-.5)*22,y+random()*100);ctx.stroke();}if(kind==='wall'||kind==='ceiling')for(let i=0;i<15*wear;i++){const x=random()*n,y=random()*n;ctx.fillStyle='rgba(92,71,40,.13)';ctx.beginPath();ctx.moveTo(x,y);for(let j=0;j<7;j++){const a=j/6*Math.PI*2,r=3+random()*18;ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}ctx.fill();}}
  const albedo=new T.CanvasTexture(canvas);albedo.colorSpace=T.SRGBColorSpace;
  const normals=new Uint8Array(n*n*4),rough=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*n+x,k=i*4,dx=heights[y*n+(x+1)%n]-heights[y*n+(x+n-1)%n],dy=heights[((y+1)%n)*n+x]-heights[((y+n-1)%n)*n+x];normals[k]=128-dx*90;normals[k+1]=128+dy*90;normals[k+2]=250;normals[k+3]=255;rough[k]=rough[k+1]=rough[k+2]=210+Math.min(40,Math.abs(heights[i])*100);rough[k+3]=255;}
  const normal=new T.DataTexture(normals,n,n),roughness=new T.DataTexture(rough,n,n);for(const tex of [albedo,normal,roughness]){tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(kind==='wall'?2:kind==='floor'?2:1,kind==='wall'?2:kind==='floor'?4:1);tex.needsUpdate=true;tex.minFilter=T.LinearMipmapLinearFilter;tex.magFilter=T.LinearFilter;tex.generateMipmaps=true;textures.push(tex);}
  const mat=new T.MeshStandardMaterial({map:albedo,normalMap:normal,normalScale:new T.Vector2(kind==='cloth'?.35:.18,kind==='cloth'?.35:.18),roughnessMap:roughness,roughness:.98,metalness:kind==='rust'?.48:0});materials.push(mat);cache.set(key,mat);return mat;
 }
 function solid(color,roughness=.8,metalness=0){const key=[color,roughness,metalness].join(':');if(cache.has(key))return cache.get(key);const m=new T.MeshStandardMaterial({color,roughness,metalness});materials.push(m);cache.set(key,m);return m;}
 function screen(){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const c=canvas.getContext('2d');c.fillStyle='#233b43';c.fillRect(0,0,256,128);c.fillStyle='#9baead';c.font='14px sans-serif';c.fillText('УГОЛЬНЫЙ РАЗРЕЗ',17,25);c.fillStyle='#667d78';for(let i=0;i<5;i++)c.fillRect(18,45+i*12,80+i*17,4);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;textures.push(map);const m=new T.MeshStandardMaterial({map,emissiveMap:map,emissive:'#ffffff',emissiveIntensity:.28,roughness:.5});materials.push(m);return m;}
 return {painted,solid,screen,dispose(){for(const m of materials)m.dispose();for(const t of textures)t.dispose();cache.clear();},materials,textures};
}
