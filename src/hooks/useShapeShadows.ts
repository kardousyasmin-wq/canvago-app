import { useCallback, useEffect, useRef, useState } from 'react'
import type { SelectionEvent } from '@canva/design'
import { safeSdkCall } from '../lib/canva'

export type ApplyStatus = 'idle' | 'applying' | 'success' | 'error'

export interface ShadowPreset {
  id: string
  label: string
  blur: number
  opacity: number
  offsetX: number
  offsetY: number
}

// Presets are now colour-agnostic — colour is chosen separately
export const SHADOW_PRESETS: ShadowPreset[] = [
  { id: 'soft',   label: 'Soft',   blur: 40, opacity: 25, offsetX: 0, offsetY: 12 },
  { id: 'medium', label: 'Medium', blur: 18, opacity: 50, offsetX: 4, offsetY: 8  },
  { id: 'hard',   label: 'Hard',   blur: 5,  opacity: 72, offsetX: 5, offsetY: 5  },
  { id: 'glow',   label: 'Glow',   blur: 52, opacity: 65, offsetX: 0, offsetY: 0  },
]

// Neutral ramp — black → mid-grey (5 stops)
export const NEUTRAL_COLORS = ['#000000', '#1a1a1a', '#333333', '#555555', '#888888']

export interface ShadowConfig {
  preset: string
  blur: number
  opacity: number
  offsetX: number
  offsetY: number
  color: string
}

async function getCanvaSdk() {
  try { return await import('@canva/design') } catch { return null }
}

/** Parse a hex string; return null if invalid. */
function parseHex(raw: string): string | null {
  const s = raw.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s.toUpperCase()}`
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    const [r, g, b] = s.split('')
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  return null
}

export function useShapeShadows() {
  const [config, setConfig] = useState<ShadowConfig>({
    preset: 'soft',
    blur:    40,
    opacity: 25,
    offsetX: 0,
    offsetY: 12,
    color:   '#000000',
  })

  const [hasSelection, setHasSelection] = useState(false)
  const [applyStatus, setApplyStatus]   = useState<ApplyStatus>('idle')
  const [appliedCount, setAppliedCount] = useState(0)

  // Dynamic page colours grabbed from Canva
  const [pageColors, setPageColors]       = useState<string[]>([])
  const [isGrabbingColors, setIsGrabbingColors] = useState(false)

  // Hex picker state
  const [hexInput, setHexInputRaw]   = useState('')
  const [hexError, setHexError]      = useState(false)

  const imageEventRef   = useRef<SelectionEvent<'image'>   | null>(null)
  const richtextEventRef = useRef<SelectionEvent<'richtext'> | null>(null)

  // Register selection listeners
  useEffect(() => {
    const cleanups: Array<() => void> = []

    getCanvaSdk().then((sdk) => {
      if (!sdk) return
      try {
        cleanups.push(sdk.selection.registerOnChange({
          scope: 'image',
          onChange: (ev: SelectionEvent<'image'>) => {
            imageEventRef.current = ev.count > 0 ? ev : null
            setHasSelection(ev.count > 0)
          },
        }))
      } catch (e) { console.warn('[CanvaGo] image selection listener failed:', e) }

      try {
        cleanups.push(sdk.selection.registerOnChange({
          scope: 'richtext',
          onChange: (ev: SelectionEvent<'richtext'>) => {
            richtextEventRef.current = ev.count > 0 ? ev : null
          },
        }))
      } catch (e) { console.warn('[CanvaGo] richtext selection listener failed:', e) }
    })

    return () => cleanups.forEach((fn) => fn())
  }, [])

  const applyPreset = (preset: ShadowPreset) =>
    setConfig((c) => ({ ...c, preset: preset.id, blur: preset.blur, opacity: preset.opacity, offsetX: preset.offsetX, offsetY: preset.offsetY }))

  const setColor = (color: string) => {
    setConfig((c) => ({ ...c, color }))
    setHexInputRaw(color.replace('#', ''))
    setHexError(false)
  }

  const updateBlur    = (blur: number)    => setConfig((c) => ({ ...c, blur,    preset: '' }))
  const updateOpacity = (opacity: number) => setConfig((c) => ({ ...c, opacity, preset: '' }))

  const setHexInput = (raw: string) => {
    setHexInputRaw(raw)
    const parsed = parseHex(raw)
    if (parsed) {
      setConfig((c) => ({ ...c, color: parsed }))
      setHexError(false)
    } else {
      setHexError(raw.trim().length > 0)
    }
  }

  /**
   * Grab the most-used colours from the current page.
   *
   * The Canva SDK v2 does not expose a "get all page colours" API.
   * We read richtext colours (text elements selected by the user) as a
   * best-effort proxy. When Canva exposes a page colour enumeration API,
   * this can be replaced with a proper page-wide scan.
   *
   * Fallback: if no richtext selection exists, we return a curated set
   * of neutrals so the UI is never empty.
   */
  const grabPageColors = useCallback(async () => {
    setIsGrabbingColors(true)
    try {
      const sdk = await getCanvaSdk()
      if (!sdk) throw new Error('SDK unavailable')

      const grabbed: string[] = []

      if (richtextEventRef.current && richtextEventRef.current.count > 0) {
        const draft = await richtextEventRef.current.read()
        for (const range of draft.contents) {
          const regions = range.readTextRegions()
          for (const region of regions) {
            // TextRegion has formatting; look for color property
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const color = (region as unknown as Record<string, unknown>).color as string | undefined
            if (color && /^#[0-9a-fA-F]{6}$/i.test(color) && !grabbed.includes(color.toUpperCase())) {
              grabbed.push(color.toUpperCase())
              if (grabbed.length === 3) break
            }
          }
          if (grabbed.length === 3) break
        }
      }

      // If we couldn't read real colours, try design metadata heuristic
      if (grabbed.length === 0) {
        await safeSdkCall(() => sdk.getDesignMetadata(), 'getDesignMetadata')
        // SDK doesn't expose page colours from metadata; use curated warm neutrals
        grabbed.push('#1C1C1E', '#3A3A3C', '#636366')
      }

      setPageColors(grabbed.slice(0, 3))
    } catch {
      // Graceful fallback — show neutral tones that work as shadows
      setPageColors(['#1C1C1E', '#3A3A3C', '#636366'])
    } finally {
      setIsGrabbingColors(false)
    }
  }, [])

  const applyShShadow = async () => {
    if (!hasSelection || !imageEventRef.current) return
    setApplyStatus('applying')
    try {
      const sdk = await getCanvaSdk()
      if (!sdk) throw new Error('Canva SDK not available outside of Canva.')

      const [pageContext, defaultDims] = await Promise.all([
        safeSdkCall(() => sdk.getCurrentPageContext(), 'getCurrentPageContext'),
        safeSdkCall(() => sdk.getDefaultPageDimensions(), 'getDefaultPageDimensions'),
      ])

      const pageDims  = pageContext?.dimensions ?? defaultDims ?? { width: 1920, height: 1080 }
      const draft     = await imageEventRef.current.read()
      if (!draft.contents.length) throw new Error('No element content found.')

      const sourceRef = draft.contents[0].ref
      const elW  = Math.round(pageDims.width  * 0.5)
      const elH  = Math.round(pageDims.height * 0.5)
      const baseT = Math.round(pageDims.height * 0.1)
      const baseL = Math.round(pageDims.width  * 0.1)
      const scX  = pageDims.width  / 1920
      const scY  = pageDims.height / 1080
      const pxOffX = Math.round(config.offsetX * 8 * scX)
      const pxOffY = Math.round(config.offsetY * 8 * scY)

      // Shadow clone first (lower z-order)
      await safeSdkCall(() => sdk.addElementAtPoint({
        type: 'image', ref: sourceRef,
        altText: { text: 'Shadow layer (CanvaGo)', decorative: true },
        top: baseT + pxOffY, left: baseL + pxOffX, width: elW, height: elH,
      }), 'shadow-clone')

      // Original on top
      await safeSdkCall(() => sdk.addElementAtPoint({
        type: 'image', ref: sourceRef,
        altText: { text: 'Element with shadow', decorative: false },
        top: baseT, left: baseL, width: elW, height: elH,
      }), 'original-on-top')

      setAppliedCount((n) => n + 1)
      setApplyStatus('success')
    } catch (err) {
      console.error('[CanvaGo] Apply Shadow failed:', err)
      setApplyStatus('error')
    }
    setTimeout(() => setApplyStatus('idle'), 2600)
  }

  return {
    config, hasSelection, applyStatus, appliedCount,
    pageColors, isGrabbingColors,
    hexInput, hexError,
    applyPreset, setColor, updateBlur, updateOpacity,
    setHexInput, grabPageColors, applyShShadow,
  }
}
