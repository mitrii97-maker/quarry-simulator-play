import * as T from '../three.module.js?build=lighting-20261106-26';
import {RGBELoader} from './rgbe-loader.js?build=lighting-20261106-26';

// The same measured winter sky drives visible clouds and the metal/glass reflections.
export async function makeQuarrySky(scene) {
  const environment = await new RGBELoader().loadAsync(new URL('../assets/sky/winter-sky.hdr', import.meta.url).href);
  environment.mapping = T.EquirectangularReflectionMapping;
  const material = new T.ShaderMaterial({
    side: T.BackSide, depthWrite: false, fog: false,
    uniforms: {
      panorama: {value: environment},
      night: {value: 0}, time: {value: 0},
      horizon: {value: new T.Color('#b9c6cc')},
      top: {value: new T.Color('#091424')},
      bottom: {value: new T.Color('#28384a')}
    },
    vertexShader: `
      varying vec3 direction;
      void main() {
        direction = position;
        vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.);
        gl_Position = p.xyww;
      }`,
    fragmentShader: `
      uniform sampler2D panorama;
      uniform float night;
      uniform vec3 top;
      uniform vec3 bottom;
      uniform vec3 horizon;
      varying vec3 direction;
      void main() {
        vec3 n = normalize(direction);
        vec2 uv = vec2(atan(n.z,n.x)*.159154943+.5, asin(clamp(n.y,-1.,1.))*.318309886+.5);
        vec3 light = texture2D(panorama,uv).rgb;
        vec3 darkness = mix(bottom, top, smoothstep(0., .85, n.y));
        float clouds = clamp(dot(light,vec3(.2126,.7152,.0722)),0.,1.);
        vec3 color = mix(light*.78, darkness*(.65+clouds*.35), night);
        // Match distant atmospheric scattering to the visible low sky.
        color = mix(color, horizon, .52*(1.-smoothstep(-.08,.14,n.y)));
        gl_FragColor = vec4(color,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const sky = new T.Mesh(new T.SphereGeometry(390,48,24), material);
  sky.name = 'Photographic winter sky';
  sky.frustumCulled = false;
  sky.renderOrder = -100;
  sky.userData.environment = environment;
  scene.add(sky);
  return sky;
}
