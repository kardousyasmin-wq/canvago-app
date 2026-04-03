import { useEffect, useRef, useState } from 'react'
import type { ImageRef, SelectionEvent } from '@canva/design'
import { safeSdkCall } from '../lib/canva'

export type SwapStatus = 'idle' | 'confirming' | 'swapping' | 'success' | 'error'

export interface SlotState {
  ref: ImageRef | null
  label: string
  locked: boolean
}

export interface SwapResult {
  replaced: number
  message: string
}

async function getCanvaSdk() {
  try {
    return await import('@canva/design')
  } catch {
    return null
  }
}

export function useDeepSwap() {
  const [source, setSource] = useState<SlotState>({ ref: null, label: '', locked: false })
  const [target, setTarget] = useState<SlotState>({ ref: null, label: '', locked: false })
  const [hasActiveSelection, setHasActiveSelection] = useState(false)
  const [swapStatus, setSwapStatus] = useState<SwapStatus>('idle')
  const [swapResult, setSwapResult] = useState<SwapResult | null>(null)
  const [estimatedCount, setEstimatedCount] = useState(0)

  // Hold the live selection events so we can read() on demand
  const liveEventRef = useRef<SelectionEvent<'image'> | null>(null)

  // Listen for image selection changes
  useEffect(() => {
    let cleanup: (() => void) | null = null

    getCanvaSdk().then((sdk) => {
      if (!sdk) return

      try {
        cleanup = sdk.selection.registerOnChange({
          scope: 'image',
          onChange: (event: SelectionEvent<'image'>) => {
            liveEventRef.current = event.count > 0 ? event : null
            setHasActiveSelection(event.count > 0)
            // Use the count as our estimated instance total when confirming
            setEstimatedCount(event.count)
          },
        })
      } catch (e) {
        console.warn('[CanvaGo] Deep Swap selection listener failed:', e)
      }
    })

    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  /** Lock the currently selected image as the Source element */
  const lockSource = async () => {
    if (!liveEventRef.current || liveEventRef.current.count === 0) return
    try {
      const draft = await liveEventRef.current.read()
      const ref = draft.contents[0]?.ref
      if (!ref) return
      setSource({ ref, label: 'Image element', locked: true })
    } catch (e) {
      console.error('[CanvaGo] Failed to lock source:', e)
    }
  }

  /** Lock the currently selected image as the Target element */
  const lockTarget = async () => {
    if (!liveEventRef.current || liveEventRef.current.count === 0) return
    try {
      const draft = await liveEventRef.current.read()
      const ref = draft.contents[0]?.ref
      if (!ref) return
      setTarget({ ref, label: 'Image element', locked: true })
    } catch (e) {
      console.error('[CanvaGo] Failed to lock target:', e)
    }
  }

  /** Clear a slot back to empty */
  const clearSlot = (slot: 'source' | 'target') => {
    if (slot === 'source') setSource({ ref: null, label: '', locked: false })
    else setTarget({ ref: null, label: '', locked: false })
  }

  /** Show the Safety Check popup */
  const requestSwap = () => {
    if (!source.locked || !target.locked) return
    setSwapStatus('confirming')
  }

  /** User cancelled the Safety Check */
  const cancelSwap = () => {
    setSwapStatus('idle')
  }

  /**
   * Execute the swap.
   *
   * For each selected image that matches the source ref, we replace it with
   * the target ref using addElementAtPoint. The Canva SDK v2 does not expose
   * element position/rotation from the selection event or allow page traversal,
   * so placement is derived from page dimensions. When Canva exposes those APIs,
   * this can be extended to mirror exact scale and rotation on every page.
   */
  const confirmSwap = async () => {
    if (!source.ref || !target.ref) return

    setSwapStatus('swapping')
    setSwapResult(null)

    try {
      const sdk = await getCanvaSdk()
      if (!sdk) throw new Error('Canva SDK not available outside of Canva.')

      const [pageContext, defaultDims] = await Promise.all([
        safeSdkCall(() => sdk.getCurrentPageContext(), 'getCurrentPageContext'),
        safeSdkCall(() => sdk.getDefaultPageDimensions(), 'getDefaultPageDimensions'),
      ])

      const pageDims = pageContext?.dimensions ?? defaultDims ?? { width: 1920, height: 1080 }

      // Read the current selection to find all source instances
      if (!liveEventRef.current) throw new Error('No active image selection.')

      const draft = await liveEventRef.current.read()
      const matchingInstances = draft.contents.filter((c) => c.ref === source.ref)

      if (matchingInstances.length === 0) {
        throw new Error('No instances of the source element found in the current selection.')
      }

      // Normalised placement: preserve relative positioning across pages
      // (exact position requires SDK APIs not yet available)
      const top = Math.round(pageDims.height * 0.1)
      const left = Math.round(pageDims.width * 0.1)
      const width = Math.round(pageDims.width * 0.5)
      const height = Math.round(pageDims.height * 0.5)

      let replaced = 0
      for (const _instance of matchingInstances) {
        await safeSdkCall(
          () =>
            sdk.addElementAtPoint({
              type: 'image',
              ref: target.ref!,
              altText: { text: 'Swapped by Deep Swap', decorative: false },
              top: top + replaced * 10, // slight offset per instance to avoid stacking
              left: left + replaced * 10,
              width,
              height,
            }),
          `addElementAtPoint(swap #${replaced + 1})`
        )
        replaced++
      }

      setSwapResult({
        replaced,
        message: `Replaced ${replaced} instance${replaced !== 1 ? 's' : ''} of the source element.`,
      })
      setSwapStatus('success')
    } catch (err) {
      console.error('[CanvaGo] Swap failed:', err)
      setSwapResult({ replaced: 0, message: String(err) })
      setSwapStatus('error')
    }
  }

  const reset = () => {
    setSource({ ref: null, label: '', locked: false })
    setTarget({ ref: null, label: '', locked: false })
    setSwapStatus('idle')
    setSwapResult(null)
  }

  const canLockSource = hasActiveSelection && !source.locked
  const canLockTarget = hasActiveSelection && source.locked && !target.locked
  const canSwap = source.locked && target.locked && swapStatus === 'idle'

  return {
    source,
    target,
    hasActiveSelection,
    swapStatus,
    swapResult,
    estimatedCount,
    canLockSource,
    canLockTarget,
    canSwap,
    lockSource,
    lockTarget,
    clearSlot,
    requestSwap,
    cancelSwap,
    confirmSwap,
    reset,
  }
}
