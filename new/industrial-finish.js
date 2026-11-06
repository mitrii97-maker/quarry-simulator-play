import * as T from '../three.module.js?build=cabins-20261106-24';
// Shared coating variation: created once and reused by every cloned vehicle
// material. Paint is coated; the cutting steel and tracks remain rough/worn.
export function industrialFinish(M,assets){
 const n=256,pixels=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=(y*n+x)*4,grain=((Math.imul(x+37,73856093)^Math.imul(y+11,19349663))>>>0)%71/71,grime=Math.pow(Math.abs(y/n-.5)*2,6),scratch=(x*13+y*47)%173<3;pixels[i]=pixels[i+2]=255;pixels[i+1]=Math.min(255,165+grain*32+grime*50+(scratch?28:0));pixels[i+3]=255;}
 const finish=new T.DataTexture(pixels,n,n);finish.wrapS=finish.wrapT=T.RepeatWrapping;finish.magFilter=T.LinearFilter;finish.minFilter=T.LinearMipmapLinearFilter;finish.generateMipmaps=true;finish.needsUpdate=true;
 const old=M.paint;M.paint=new T.MeshStandardMaterial({color:old.color.clone(),map:old.map,roughness:.56,roughnessMap:finish,metalness:.24,envMapIntensity:.85});old.dispose();
 M.steel.roughnessMap=finish;M.steel.roughness=.44;M.chrome.roughness=.16;M.chrome.envMapIntensity=1.1;M.bucket.roughnessMap=finish;M.bucket.roughness=.82;M.track.roughnessMap=finish;M.track.roughness=.95;
 M.glass.roughness=.07;M.glass.envMapIntensity=1.25;
 if(assets){M.snow.roughnessMap=assets.snow.roughness;M.freshRock.roughnessMap=assets.rock.roughness;M.freshRock.normalScale.set(.36,.36);}
 return M;
}
