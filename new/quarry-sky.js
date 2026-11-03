import * as T from '../three.module.js';
// One precomputed periodic cloud field, sampled once per sky pixel. Avoid a
// multi-octave procedural noise loop in every mobile fragment every frame.
export function makeQuarrySky(scene){
 const width=512,height=128,pixels=new Uint8Array(width*height*4),hash=(x,y)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263);n=Math.imul(n^n>>>13,1274126177);return ((n^n>>>16)>>>0)/4294967295;};
 function noise(x,y,scale){const ix=Math.floor(x/scale),iy=Math.floor(y/scale),fx=x/scale-ix,fy=y/scale-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy),period=width/scale,a=hash((ix+period)%period,iy),b=hash((ix+1+period)%period,iy),c=hash((ix+period)%period,iy+1),d=hash((ix+1+period)%period,iy+1);return (a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v;}
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const value=noise(x,y,64)*.52+noise(x,y,32)*.27+noise(x,y,16)*.14+noise(x,y,8)*.07,i=(y*width+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=value*255;pixels[i+3]=255;}
 const clouds=new T.DataTexture(pixels,width,height);clouds.wrapS=T.RepeatWrapping;clouds.wrapT=T.MirroredRepeatWrapping;clouds.magFilter=T.LinearFilter;clouds.minFilter=T.LinearMipmapLinearFilter;clouds.generateMipmaps=true;clouds.needsUpdate=true;
 const material=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#668bb3')},bottom:{value:new T.Color('#d6dfe5')},clouds:{value:clouds},night:{value:0},time:{value:0},sunDirection:{value:new T.Vector3(-25,34,-31).normalize()}},vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 direction;uniform vec3 top;uniform vec3 bottom;uniform sampler2D clouds;uniform float night;uniform float time;uniform vec3 sunDirection;
 void main(){vec3 n=normalize(direction);float elevation=max(0.,n.y);vec3 color=mix(bottom,top,smoothstep(-.025,.88,n.y));float alignment=max(0.,dot(n,sunDirection));color+=vec3(.32,.22,.10)*(pow(alignment,9.)*.12+pow(alignment,90.)*.36)*(1.-night);
 vec2 uv=vec2(atan(n.z,n.x)*.15915494+.5+time*.000025,elevation*.72);float field=texture2D(clouds,uv).r;float cover=smoothstep(.40,.66,field)*smoothstep(.025,.20,elevation);vec3 cloud=mix(vec3(.63,.71,.80),vec3(.94,.95,.94),smoothstep(.43,.70,field));cloud=mix(cloud,vec3(.045,.065,.10),night);color=mix(color,cloud,cover*.78);gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const sky=new T.Mesh(new T.SphereGeometry(390,48,32),material);sky.name='Winter atmosphere and layered cloud deck';sky.castShadow=sky.receiveShadow=false;scene.add(sky);return sky;
}
