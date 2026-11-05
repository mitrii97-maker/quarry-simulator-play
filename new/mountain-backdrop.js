import * as T from '../three.module.js?build=fix-20261106-22';

// A ring beyond the playable quarry. The periodic ridgelines close without
// a seam and share one mesh and material, including the snow on the peaks.
export function addMountainBackdrop(scene) {
  const segments = 320;
  const rows = 18;
  const positions = [], indices = [], colors = [];
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    for (let i = 0; i < segments; i++) {
      const angle = i * 2 * Math.PI / segments;
      const valley = angle + 0.08 * Math.sin(angle * 7 + t * 2) * (1 - t);
      const ridge = 37 + 16 * Math.cos(3 * valley - 0.6)
        + 12 * Math.sin(7 * valley) + 8 * Math.sin(13 * valley + 0.7)
        + 5 * Math.sin(31 * valley) + 2.5 * Math.sin(71 * valley);
      const flute = 0.5 + 0.5 * Math.cos(43 * valley + t * 3 + 2 * Math.sin(valley * 17));
      const radius = 120 + 82 * t + 11 * Math.sin(5 * valley) + 8 * flute * Math.sin(Math.PI * t);
      const y = -3 + ridge * Math.pow(t, 1.23) - 9 * flute * Math.sin(Math.PI * t);
      positions.push(radius * Math.cos(angle), y, radius * Math.sin(angle));
      if (row < rows) {
        const a = row * segments + i, b = row * segments + (i + 1) % segments;
        indices.push(a, b, a + segments, b, b + segments, a + segments);
      }
    }
  }

  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const normals = geometry.attributes.normal;
  const shale = new T.Color('#37424b'), snow = new T.Color('#dee9ee'), tint = new T.Color();
  for (let i = 0; i < normals.count; i++) {
    const y = positions[i * 3 + 1];
    const ledge = normals.getY(i) + 0.13 * normals.getZ(i);
    const snowline = T.MathUtils.smoothstep(y, 18, 70);
    const cover = T.MathUtils.smoothstep(ledge + 0.27 * snowline, 0.69, 0.94);
    tint.copy(shale).lerp(snow, cover*.48);
    tint.multiplyScalar(.74+.26*T.MathUtils.smoothstep(Math.sin(y*.69),-.25,.55));
    colors.push(tint.r, tint.g, tint.b);
  }
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  const ridge = new T.Mesh(geometry, new T.MeshLambertMaterial({vertexColors: true}));
  ridge.name = 'Snow gullies and distant peaks';
  scene.add(ridge);
}
