import * as T from '../three.module.js?build=traffic-20261106-25';
// Linear HDR radiance captured once by PMREM. Outdoor sky/ground reflections
// replace the white rectangles of the former indoor room environment.
export function quarryEnvironment(){
 const scene=new T.Scene(),geometry=new T.SphereGeometry(90,32,16),material=new T.ShaderMaterial({side:T.BackSide,uniforms:{sunDirection:{value:new T.Vector3(-25,34,-31).normalize()},zenith:{value:new T.Color('#7397bd')},horizon:{value:new T.Color('#e7e6de')},earth:{value:new T.Color('#5c6671')}},vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 direction;uniform vec3 sunDirection;uniform vec3 zenith;uniform vec3 horizon;uniform vec3 earth;void main(){vec3 n=normalize(direction);vec3 sky=mix(horizon,zenith,smoothstep(0.,.85,n.y));vec3 c=mix(earth,sky,smoothstep(-.15,.08,n.y));float alignment=max(0.,dot(n,sunDirection));c+=vec3(1.,.85,.65)*(pow(alignment,30.)*.5+pow(alignment,650.)*9.);gl_FragColor=vec4(c,1.);}'});
 const dome=new T.Mesh(geometry,material);scene.add(dome);scene.dispose=()=>{geometry.dispose();material.dispose()};return scene;
}
