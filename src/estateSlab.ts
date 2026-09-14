import { MercatorCoordinate } from 'maplibre-gl'
import type { CustomLayerInterface, MapLibreMap } from 'maplibre-gl'
import { estateBoundary } from './boundary'

export const ESTATE_SLAB_LAYER_ID = 'wolmar-slab'

/**
 * The estate rendered as a cut-out block of ground: a wall dropped from the
 * real terrain surface along the property line down to a flat bottom, banded
 * into strata.
 *
 * It has to be a custom WebGL layer rather than a `fill-extrusion`, because
 * extrusions can only ever grow *upwards* — with 3D terrain on, MapLibre
 * anchors them to the terrain and clamps the base to 10m below it — so they
 * can't hang a few hundred metres under the surface the way a cross-section
 * needs to. Drawn with the depth test off and back faces culled, so the near
 * walls paint over the void and the far ones are dropped.
 */

/** How far below sea level the block is cut off. */
const SLAB_BOTTOM_M = -640

/**
 * Strata from the bottom up: the altitude each band starts at and its colour.
 * Loosely the geology of this corner of Mauritius — a basalt shield island
 * whose rock weathers into the iron-rich red laterite exposed in every road
 * cutting on the west coast. The top band is open-ended: it runs up to the
 * real ground surface, so it thickens under high ground the way a soil mantle
 * does, while every band below it stays dead level.
 */
const STRATA: { from: number; to: number | null; color: string }[] = [
  { from: SLAB_BOTTOM_M, to: -460, color: '#31363d' },
  { from: -460, to: -330, color: '#474e56' },
  { from: -330, to: -240, color: '#5c5a53' },
  { from: -240, to: -150, color: '#7c6b4d' },
  { from: -150, to: -60, color: '#6a4930' },
  { from: -60, to: null, color: '#96582f' },
]

/**
 * Ear-clipped triangulation of the estate footprint (vertex indices into
 * `estateBoundary`), precomputed offline so nothing has to tessellate at
 * runtime. It is only ever drawn into the depth buffer, as a lid that hides
 * the walls of the boundary's concave notches — without it they paint over
 * the middle of the estate, since the block itself is drawn depth-test-free.
 */
const FOOTPRINT_TRIANGLES = [
  86, 87, 0, 0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5, 5, 6, 7, 5, 7, 8, 5, 8, 9, 10, 11, 12, 10, 12,
  13, 10, 13, 14, 10, 14, 15, 10, 15, 16, 10, 16, 17, 10, 17, 18, 10, 18, 19, 10, 19, 20, 10,
  20, 21, 10, 21, 22, 10, 22, 23, 10, 23, 24, 10, 24, 25, 10, 25, 26, 10, 26, 27, 10, 27, 28,
  10, 28, 29, 10, 29, 30, 10, 30, 31, 10, 31, 32, 10, 32, 33, 10, 33, 34, 10, 34, 35, 10, 35,
  36, 10, 36, 37, 10, 37, 38, 10, 38, 39, 10, 39, 40, 10, 40, 41, 10, 41, 42, 10, 42, 43, 10,
  43, 44, 10, 44, 45, 10, 45, 46, 10, 46, 47, 10, 47, 48, 10, 48, 49, 10, 49, 50, 10, 50, 51,
  10, 51, 52, 10, 52, 53, 10, 53, 54, 10, 54, 55, 10, 55, 56, 10, 56, 57, 10, 57, 58, 10, 58,
  59, 10, 59, 60, 10, 60, 61, 10, 61, 62, 10, 62, 63, 10, 63, 64, 10, 64, 65, 10, 65, 66, 10,
  66, 67, 10, 67, 68, 10, 68, 69, 10, 69, 70, 10, 70, 71, 10, 71, 72, 72, 73, 74, 75, 76, 77,
  75, 77, 78, 75, 78, 79, 75, 79, 80, 75, 80, 81, 75, 81, 82, 75, 82, 83, 75, 83, 84, 75, 84,
  85, 75, 85, 86, 75, 86, 0, 75, 0, 5, 75, 5, 9, 75, 9, 10, 10, 72, 74, 10, 74, 75,
]

/** Direction the sun comes from, in mercator space (y grows southwards). */
const LIGHT = normalize2(-0.55, -0.62)

const VERTEX_STRIDE = 6 * Float32Array.BYTES_PER_ELEMENT

const VERTEX_SOURCE = `#version 300 es
uniform mat4 u_matrix;
layout(location = 0) in vec3 a_pos;
layout(location = 1) in vec3 a_color;
out vec3 v_color;
void main() {
  gl_Position = u_matrix * vec4(a_pos, 1.0);
  v_color = a_color;
}`

const FRAGMENT_SOURCE = `#version 300 es
precision mediump float;
in vec3 v_color;
out vec4 fragColor;
void main() {
  fragColor = vec4(v_color, 1.0);
}`

function normalize2(x: number, y: number) {
  const length = Math.hypot(x, y) || 1
  return { x: x / length, y: y / length }
}

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16)
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255]
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('could not create shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`slab shader failed to compile: ${log}`)
  }
  return shader
}

function sampleTerrain(map: MapLibreMap): number[] {
  return estateBoundary.map(([lng, lat]) => {
    const elevation = map.queryTerrainElevation({ lng, lat })
    return typeof elevation === 'number' && Number.isFinite(elevation) ? elevation : 0
  })
}

/**
 * One quad per boundary segment per stratum, as raw triangles with the shading
 * already baked into each vertex colour — the geometry is small enough (a few
 * thousand vertices) that there's nothing to gain from lighting it in a shader.
 * The depth-only lid is appended after the walls so both share one buffer.
 */
function buildVertices(tops: number[]): { data: Float32Array; wallVertices: number; capVertices: number } {
  const points = estateBoundary.map(([lng, lat]) => ({
    merc: MercatorCoordinate.fromLngLat({ lng, lat }, 0),
    /** Mercator z per metre of altitude, which varies with latitude. */
    zPerMetre: MercatorCoordinate.fromLngLat({ lng, lat }, 1).z,
  }))
  const segments = points.length - 1

  let doubleArea = 0
  for (let i = 0; i < segments; i++) {
    const a = points[i].merc
    const b = points[i + 1].merc
    doubleArea += a.x * b.y - b.x * a.y
  }
  // With a positive shoelace area the right-hand perpendicular of each segment
  // points out of the polygon; with a negative one it points into it.
  const outwardSign = doubleArea > 0 ? 1 : -1

  const data: number[] = []

  const push = (index: number, altitude: number, rgb: [number, number, number], shade: number) => {
    const { merc, zPerMetre } = points[index]
    const depthFade = 0.74 + 0.26 * Math.min(1, Math.max(0, (altitude - SLAB_BOTTOM_M) / -SLAB_BOTTOM_M))
    const tint = shade * depthFade
    data.push(merc.x, merc.y, altitude * zPerMetre, rgb[0] * tint, rgb[1] * tint, rgb[2] * tint)
  }

  for (let i = 0; i < segments; i++) {
    const a = points[i].merc
    const b = points[i + 1].merc
    const edge = normalize2(b.x - a.x, b.y - a.y)
    const normal = { x: outwardSign * edge.y, y: outwardSign * -edge.x }
    const shade = 0.62 + 0.38 * Math.max(0, normal.x * LIGHT.x + normal.y * LIGHT.y)

    for (const stratum of STRATA) {
      const rgb = hexToRgb(stratum.color)
      const lowA = stratum.from
      const lowB = stratum.from
      const highA = stratum.to ?? tops[i]
      const highB = stratum.to ?? tops[i + 1]
      if (highA <= lowA && highB <= lowB) continue

      push(i, lowA, rgb, shade)
      push(i + 1, lowB, rgb, shade)
      push(i + 1, highB, rgb, shade)

      push(i, lowA, rgb, shade)
      push(i + 1, highB, rgb, shade)
      push(i, highA, rgb, shade)
    }
  }

  const wallVertices = data.length / 6

  // The lid sits above every sampled boundary elevation so it never clips a
  // wall that should be visible, and is never shaded — only its depth counts.
  const lidAltitude = Math.max(...tops) + 60
  const black: [number, number, number] = [0, 0, 0]
  for (const index of FOOTPRINT_TRIANGLES) {
    push(index, lidAltitude, black, 0)
  }

  return {
    data: new Float32Array(data),
    wallVertices,
    capVertices: FOOTPRINT_TRIANGLES.length,
  }
}

export function createEstateSlabLayer(): CustomLayerInterface {
  let map: MapLibreMap | null = null
  let program: WebGLProgram | null = null
  let buffer: WebGLBuffer | null = null
  let vao: WebGLVertexArrayObject | null = null
  let matrixLocation: WebGLUniformLocation | null = null
  let context: WebGL2RenderingContext | null = null
  let wallVertexCount = 0
  let capVertexCount = 0
  let terrainSignature = ''

  /** Returns whether the walls were actually re-cut. */
  const upload = (gl: WebGL2RenderingContext): boolean => {
    if (!map || !buffer) return false
    const tops = sampleTerrain(map)
    const signature = tops.map((value) => Math.round(value)).join(',')
    if (signature === terrainSignature) return false
    terrainSignature = signature

    const { data, wallVertices, capVertices } = buildVertices(tops)
    wallVertexCount = wallVertices
    capVertexCount = capVertices
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
    gl.bindBuffer(gl.ARRAY_BUFFER, null)
    return true
  }

  // The DEM streams in after the layer is added, and again whenever the
  // exaggeration changes, so re-cut the walls once the map settles. Repainting
  // only when they actually changed matters: an unconditional repaint here
  // would wake the map again, idle again, and spin forever.
  const onIdle = () => {
    if (context && upload(context)) map?.triggerRepaint()
  }

  return {
    id: ESTATE_SLAB_LAYER_ID,
    type: 'custom',
    renderingMode: '3d',

    onAdd(addedMap, gl) {
      map = addedMap as unknown as MapLibreMap
      context = gl
      terrainSignature = ''

      const vertexShader = compile(gl, gl.VERTEX_SHADER, VERTEX_SOURCE)
      const fragmentShader = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SOURCE)
      program = gl.createProgram()
      if (!program) throw new Error('could not create slab program')
      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`slab program failed to link: ${gl.getProgramInfoLog(program)}`)
      }
      matrixLocation = gl.getUniformLocation(program, 'u_matrix')

      buffer = gl.createBuffer()
      vao = gl.createVertexArray()
      gl.bindVertexArray(vao)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.enableVertexAttribArray(0)
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, VERTEX_STRIDE, 0)
      gl.enableVertexAttribArray(1)
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, VERTEX_STRIDE, 3 * Float32Array.BYTES_PER_ELEMENT)
      gl.bindVertexArray(null)

      upload(gl)
      map.on('idle', onIdle)
    },

    onRemove(_removedMap, gl) {
      map?.off('idle', onIdle)
      map = null
      context = null
      terrainSignature = ''
      if (program) gl.deleteProgram(program)
      if (buffer) gl.deleteBuffer(buffer)
      if (vao) gl.deleteVertexArray(vao)
      program = null
      buffer = null
      vao = null
    },

    render(gl, args) {
      if (!program || !vao || wallVertexCount === 0) return

      gl.useProgram(program)
      gl.uniformMatrix4fv(matrixLocation, false, args.defaultProjectionData.mainMatrix)
      gl.bindVertexArray(vao)

      // The block hangs below ground, so the terrain around the estate would
      // bury it: drop that depth and stand the block's own lid in for it, so
      // the only thing that can hide a wall is the estate above it.
      gl.enable(gl.DEPTH_TEST)
      gl.depthFunc(gl.LESS)
      gl.depthMask(true)
      gl.clear(gl.DEPTH_BUFFER_BIT)

      gl.colorMask(false, false, false, false)
      gl.disable(gl.CULL_FACE)
      gl.drawArrays(gl.TRIANGLES, wallVertexCount, capVertexCount)

      gl.colorMask(true, true, true, true)
      gl.enable(gl.CULL_FACE)
      gl.cullFace(gl.BACK)
      gl.frontFace(gl.CCW)
      gl.drawArrays(gl.TRIANGLES, 0, wallVertexCount)

      gl.bindVertexArray(null)
      gl.disable(gl.CULL_FACE)
    },
  }
}
