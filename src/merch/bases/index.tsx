import Stage from './Stage'
import { BASE_RENDERERS } from './shapes'
import type { BaseKind } from '../types'

export { logoVariantFor } from './color'

/**
 * Renders the product silhouette for `base` in `color`, on the shared
 * studio stage. This is the "base image" layer — MockupCanvas draws the
 * logo on top of it. Swapping in real photography later means replacing
 * what this component renders (or bypassing it per-product); nothing
 * about the logo compositing needs to change.
 */
export default function ProductBase({ base, color, stageId }: { base: BaseKind; color: string; stageId: string }) {
  const Shape = BASE_RENDERERS[base]
  return (
    <Stage stageId={stageId}>
      <Shape color={color} />
    </Stage>
  )
}
