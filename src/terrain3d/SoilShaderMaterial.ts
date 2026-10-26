import * as THREE from 'three'
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'

/**
 * Procedural stratified soil for the cutaway walls: bands keyed off world-
 * space Y (so they stay level regardless of the wall's local slope), with
 * their boundaries perturbed by a little noise so they read as real,
 * slightly uneven soil layers rather than a flat painted ruler. Colors
 * loosely follow the same basalt → laterite story as the old MapLibre
 * cutaway in estateSlab.ts: dark basalt at depth, warming through clay and
 * ironstone to the red laterite topsoil exposed in west-coast road cuttings.
 */

const VERTEX = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vNormal;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const FRAGMENT = /* glsl */ `
  uniform float uTopY;
  uniform float uBottomY;
  uniform vec3 uLightDir;
  uniform vec3 uLightColor;
  uniform float uAmbient;
  varying vec3 vWorldPos;
  varying vec3 vNormal;

  // Classic value-noise (not simplex — cheap and plenty for a subtle band wobble).
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    float span = max(uTopY - uBottomY, 1.0);
    float t = clamp((vWorldPos.y - uBottomY) / span, 0.0, 1.0);

    // Horizontal wobble so band edges waver instead of sitting dead flat.
    float wobble = (noise(vWorldPos.xz * 0.06) - 0.5) * 0.05;
    float fineGrain = (noise(vWorldPos.xz * 0.9 + vWorldPos.y * 0.4) - 0.5) * 0.04;
    float band = t + wobble + fineGrain;

    vec3 basalt = vec3(0.145, 0.153, 0.165);
    vec3 clayGrey = vec3(0.258, 0.263, 0.243);
    vec3 ironstone = vec3(0.404, 0.361, 0.263);
    vec3 claySubsoil = vec3(0.447, 0.302, 0.169);
    vec3 laterite = vec3(0.584, 0.267, 0.145);

    vec3 color;
    if (band < 0.22) {
      color = mix(basalt, clayGrey, smoothstep(0.0, 0.22, band));
    } else if (band < 0.45) {
      color = mix(clayGrey, ironstone, smoothstep(0.22, 0.45, band));
    } else if (band < 0.7) {
      color = mix(ironstone, claySubsoil, smoothstep(0.45, 0.7, band));
    } else {
      color = mix(claySubsoil, laterite, smoothstep(0.7, 1.0, band));
    }

    // Fine speckle for a little grain/texture without a real texture map.
    float speckle = hash(floor(vWorldPos.xz * 18.0) + floor(vWorldPos.y * 18.0));
    color *= 0.94 + speckle * 0.08;

    float diffuse = max(dot(normalize(vNormal), uLightDir), 0.0);
    vec3 lit = color * (uAmbient + diffuse * uLightColor);

    gl_FragColor = vec4(lit, 1.0);
  }
`

const CutawaySoilMaterialImpl = shaderMaterial(
  {
    uTopY: 0,
    uBottomY: -100,
    uLightDir: new THREE.Vector3(0.4, 0.8, 0.3).normalize(),
    uLightColor: new THREE.Color(1, 0.98, 0.92),
    uAmbient: 0.45,
  },
  VERTEX,
  FRAGMENT,
)

extend({ CutawaySoilMaterial: CutawaySoilMaterialImpl })

declare module '@react-three/fiber' {
  interface ThreeElements {
    cutawaySoilMaterial: Record<string, unknown>
  }
}

export default CutawaySoilMaterialImpl
