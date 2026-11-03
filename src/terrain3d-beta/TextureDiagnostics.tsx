import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { TerrainTextures } from './satelliteTexture'

/**
 * Beta-only: logs the real satellite texture size against this GPU's
 * actual limits, and makes sure the texture is configured for maximum
 * sharpness (mipmaps, max anisotropy) rather than assuming defaults are
 * doing the right thing. Runs once per texture load.
 */
export default function TextureDiagnostics({ textures }: { textures: TerrainTextures }) {
  const { gl } = useThree()

  useEffect(() => {
    const img = textures.map.image as { width?: number; height?: number } | undefined
    const texW = img?.width ?? 0
    const texH = img?.height ?? 0
    const maxSize = gl.capabilities.maxTextureSize
    const maxAniso = gl.capabilities.getMaxAnisotropy()

    const isPOT = (n: number) => (n & (n - 1)) === 0 && n > 0
    console.info(
      `[3D beta] satellite texture: ${texW}x${texH}px | GPU maxTextureSize: ${maxSize}px | ` +
        `${texW > maxSize || texH > maxSize ? 'DOWNSCALED by the GPU — chunking needed' : 'fits, not downscaled'} | ` +
        `NPOT: ${!isPOT(texW) || !isPOT(texH)} | maxAnisotropy supported: ${maxAniso}`,
    )

    textures.map.anisotropy = maxAniso
    textures.map.generateMipmaps = true
    textures.map.minFilter = THREE.LinearMipmapLinearFilter
    textures.map.magFilter = THREE.LinearFilter
    textures.map.needsUpdate = true
  }, [textures, gl])

  return null
}
