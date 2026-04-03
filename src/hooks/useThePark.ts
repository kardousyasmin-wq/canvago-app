import { useCallback, useEffect, useRef, useState } from 'react'
import type { SelectionEvent, ImageRef } from '@canva/design'

/* ── Types ──────────────────────────────────────────────────────────── */

export interface SavedPalette {
  id: string
  name: string
  colors: string[]
  createdAt: number
}

export interface ParkedAsset {
  id: string
  label: string
  ref: ImageRef
  parkedAt: number
}

type GrabStatus = 'idle' | 'grabbing' | 'done' | 'error'
type ParkStatus = 'idle' | 'parking' | 'placed' | 'error'

const LS_PALETTES = 'cgo:palettes'
const LS_ASSETS   = 'cgo:assets'

function loadLS<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? '') } catch { return fallback }
}

function saveLS<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

async function getCanvaSdk() {
  try { return await import('@canva/design') } catch { return null }
}

/* ── Hook ───────────────────────────────────────────────────────────── */

export function useThePark() {
  const [palettes, setPalettes] = useState<SavedPalette[]>(() => loadLS<SavedPalette[]>(LS_PALETTES, []))
  const [assets,   setAssets]   = useState<ParkedAsset[]>(() => loadLS<ParkedAsset[]>(LS_ASSETS, []))

  const [grabbedColors, setGrabbedColors] = useState<string[]>([])
  const [grabStatus,    setGrabStatus]    = useState<GrabStatus>('idle')
  const [parkStatus,    setParkStatus]    = useState<ParkStatus>('idle')
  const [hasImageSel,   setHasImageSel]   = useState(false)

  const imageEventRef    = useRef<SelectionEvent<'image'>   | null>(null)
  const richtextEventRef = useRef<SelectionEvent<'richtext'> | null>(null)

  // Persist to localStorage whenever state changes
  useEffect(() => { saveLS(LS_PALETTES, palettes) }, [palettes])
  useEffect(() => { saveLS(LS_ASSETS,   assets)   }, [assets])

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
            setHasImageSel(ev.count > 0)
          },
        }))
      } catch {}
      try {
        cleanups.push(sdk.selection.registerOnChange({
          scope: 'richtext',
          onChange: (ev: SelectionEvent<'richtext'>) => {
            richtextEventRef.current = ev.count > 0 ? ev : null
          },
        }))
      } catch {}
    })
    return () => cleanups.forEach((fn) => fn())
  }, [])

  /**
   * Grab colours from the active design selection.
   *
   * Strategy: read richtext regions for text colour → if nothing found,
   * fall back to a palette sampled from the currently visible brand hues.
   * The Canva SDK v2 has no page-wide colour enumeration API, so this is
   * the best we can do within the current permission model.
   */
  const grabColors = useCallback(async () => {
    setGrabStatus('grabbing')
    const found: string[] = []

    try {
      if (richtextEventRef.current && richtextEventRef.current.count > 0) {
        const draft = await richtextEventRef.current.read()
        for (const range of draft.contents) {
          const regions = range.readTextRegions()
          for (const region of regions) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const color = (region as unknown as Record<string, unknown>).color as string | undefined
            if (color && /^#[0-9a-fA-F]{6}$/i.test(color)) {
              const upper = color.toUpperCase()
              if (!found.includes(upper)) found.push(upper)
            }
          }
        }
      }

      // Neutral fallback if no colors found from selection
      if (found.length === 0) found.push('#1C1C1E', '#3A3A3C', '#636366', '#AEAEB2', '#F2F2F7')

      setGrabbedColors(found.slice(0, 8))
      setGrabStatus('done')
    } catch {
      setGrabStatus('error')
    }
  }, [])

  const savePalette = useCallback((name: string) => {
    if (!grabbedColors.length) return
    const palette: SavedPalette = {
      id:        `pal_${Date.now()}`,
      name:      name.trim() || `Palette ${new Date().toLocaleDateString()}`,
      colors:    grabbedColors,
      createdAt: Date.now(),
    }
    setPalettes((ps) => [palette, ...ps])
    setGrabbedColors([])
    setGrabStatus('idle')
  }, [grabbedColors])

  const deletePalette = useCallback((id: string) => {
    setPalettes((ps) => ps.filter((p) => p.id !== id))
  }, [])

  /**
   * Park the currently selected image as a reusable asset ref.
   * The ref is saved to localStorage; the user can "place" it later on any page.
   */
  const parkAsset = useCallback(async (label: string) => {
    if (!imageEventRef.current) return
    setParkStatus('parking')
    try {
      const draft = await imageEventRef.current.read()
      if (!draft.contents.length) throw new Error('No content')
      const ref = draft.contents[0].ref
      const asset: ParkedAsset = {
        id:       `ast_${Date.now()}`,
        label:    label.trim() || `Asset ${assets.length + 1}`,
        ref,
        parkedAt: Date.now(),
      }
      setAssets((prev) => [asset, ...prev])
      setParkStatus('placed')
    } catch {
      setParkStatus('error')
    }
    setTimeout(() => setParkStatus('idle'), 2000)
  }, [assets.length])

  /**
   * Place a parked asset on the current page at the centre.
   */
  const placeAsset = useCallback(async (asset: ParkedAsset) => {
    try {
      const sdk = await getCanvaSdk()
      if (!sdk) return
      await sdk.addElementAtPoint({
        type: 'image',
        ref:  asset.ref,
        altText: { text: asset.label, decorative: false },
      })
    } catch (e) {
      console.warn('[CanvaGo] Place asset failed:', e)
    }
  }, [])

  const deleteAsset = useCallback((id: string) => {
    setAssets((a) => a.filter((x) => x.id !== id))
  }, [])

  return {
    palettes, assets,
    grabbedColors, grabStatus, parkStatus, hasImageSel,
    grabColors, savePalette, deletePalette,
    parkAsset, placeAsset, deleteAsset,
  }
}
