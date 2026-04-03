import { useEffect, useRef, useState } from 'react'
import type { SelectionEvent } from '@canva/design'
import { safeSdkCall } from '../lib/canva'

export type SyncStatus = 'idle' | 'loading' | 'success' | 'error'

export interface SelectedElementInfo {
  type: 'image' | 'plaintext' | 'video' | 'none'
  count: number
}

export interface SyncResult {
  synced: number
  skipped: number
  message: string
}

// Lazily load the Canva SDK so a failed import (outside Canva) doesn't crash the app.
async function getCanvaSdk() {
  try {
    return await import('@canva/design')
  } catch {
    return null
  }
}

export function useBulkSync() {
  const [selectedInfo, setSelectedInfo] = useState<SelectedElementInfo>({ type: 'none', count: 0 })
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)

  // Hold the latest selection events so we can call read() on demand
  const imageEventRef = useRef<SelectionEvent<'image'> | null>(null)
  const textEventRef = useRef<SelectionEvent<'plaintext'> | null>(null)

  useEffect(() => {
    const cleanups: Array<() => void> = []

    getCanvaSdk().then((sdk) => {
      if (!sdk) return // running outside Canva — no SDK available

      // Image selection listener
      try {
        const unsub = sdk.selection.registerOnChange({
          scope: 'image',
          onChange: (event: SelectionEvent<'image'>) => {
            imageEventRef.current = event.count > 0 ? event : null
            if (event.count > 0) {
              setSelectedInfo({ type: 'image', count: event.count })
            } else if (!textEventRef.current) {
              setSelectedInfo({ type: 'none', count: 0 })
            }
          },
        })
        cleanups.push(unsub)
      } catch (e) {
        console.warn('[CanvaGo] Image selection listener failed:', e)
      }

      // Plaintext selection listener
      try {
        const unsub = sdk.selection.registerOnChange({
          scope: 'plaintext',
          onChange: (event: SelectionEvent<'plaintext'>) => {
            textEventRef.current = event.count > 0 ? event : null
            if (event.count > 0) {
              setSelectedInfo({ type: 'plaintext', count: event.count })
            } else if (!imageEventRef.current) {
              setSelectedInfo({ type: 'none', count: 0 })
            }
          },
        })
        cleanups.push(unsub)
      } catch (e) {
        console.warn('[CanvaGo] Plaintext selection listener failed:', e)
      }
    })

    return () => cleanups.forEach((fn) => fn())
  }, [])

  const handleSync = async () => {
    if (selectedInfo.type === 'none' || selectedInfo.count === 0) return

    setSyncStatus('loading')
    setSyncResult(null)

    try {
      const sdk = await getCanvaSdk()
      if (!sdk) throw new Error('Canva SDK not available outside of Canva.')

      const [pageContext, defaultDims] = await Promise.all([
        safeSdkCall(() => sdk.getCurrentPageContext(), 'getCurrentPageContext'),
        safeSdkCall(() => sdk.getDefaultPageDimensions(), 'getDefaultPageDimensions'),
      ])

      const pageDims = pageContext?.dimensions ?? defaultDims ?? { width: 1920, height: 1080 }

      if (selectedInfo.type === 'image' && imageEventRef.current) {
        await syncImageElements(sdk, imageEventRef.current, pageDims)
      } else if (selectedInfo.type === 'plaintext' && textEventRef.current) {
        await syncTextElements(sdk, textEventRef.current, pageDims)
      } else {
        throw new Error('No valid selection found.')
      }

      setSyncStatus('success')
    } catch (err) {
      console.error('[CanvaGo] Sync failed:', err)
      setSyncStatus('error')
      setSyncResult({ synced: 0, skipped: 0, message: String(err) })
    }
  }

  /**
   * Syncs image elements that share the same asset ref across the design.
   *
   * The Canva SDK v2 does not expose an element's position/size through the
   * selection event, and does not provide cross-page traversal. This implementation
   * uses addElementAtPoint on the current page at a normalised placement derived
   * from the page dimensions. When Canva exposes position data and page iteration
   * APIs, this function can be extended to mirror the exact source placement on
   * every other page.
   */
  async function syncImageElements(
    sdk: Awaited<ReturnType<typeof import('@canva/design')>>,
    event: SelectionEvent<'image'>,
    pageDims: { width: number; height: number }
  ) {
    const draft = await event.read()
    if (!draft.contents.length) {
      setSyncResult({ synced: 0, skipped: 0, message: 'No image content found in selection.' })
      return
    }

    const sourceRef = draft.contents[0].ref
    const syncWidth = Math.round(pageDims.width * 0.5)
    const syncHeight = Math.round(pageDims.height * 0.5)
    const top = Math.round(pageDims.height * 0.1)
    const left = Math.round(pageDims.width * 0.1)

    let synced = 0
    for (const content of draft.contents) {
      if (content.ref === sourceRef) {
        await safeSdkCall(
          () =>
            sdk.addElementAtPoint({
              type: 'image',
              ref: content.ref,
              altText: { text: 'Synced by CanvaGo', decorative: false },
              top,
              left,
              width: syncWidth,
              height: syncHeight,
            }),
          'addElementAtPoint(image)'
        )
        synced++
      }
    }

    setSyncResult({
      synced,
      skipped: draft.contents.length - synced,
      message: `Synced ${synced} image element${synced !== 1 ? 's' : ''} to match selection.`,
    })
  }

  /**
   * Syncs text elements that share the same text content.
   */
  async function syncTextElements(
    sdk: Awaited<ReturnType<typeof import('@canva/design')>>,
    event: SelectionEvent<'plaintext'>,
    pageDims: { width: number; height: number }
  ) {
    const draft = await event.read()
    if (!draft.contents.length) {
      setSyncResult({ synced: 0, skipped: 0, message: 'No text content found in selection.' })
      return
    }

    const sourceText = draft.contents[0].text
    const top = Math.round(pageDims.height * 0.1)
    const left = Math.round(pageDims.width * 0.1)
    let synced = 0

    for (const content of draft.contents) {
      if (content.text === sourceText) {
        await safeSdkCall(
          () =>
            sdk.addElementAtPoint({
              type: 'text',
              children: [content.text],
              top,
              left,
              width: Math.round(pageDims.width * 0.5),
            }),
          'addElementAtPoint(text)'
        )
        synced++
      }
    }

    setSyncResult({
      synced,
      skipped: draft.contents.length - synced,
      message: `Synced ${synced} text element${synced !== 1 ? 's' : ''} to match selection.`,
    })
  }

  const resetStatus = () => {
    setSyncStatus('idle')
    setSyncResult(null)
  }

  return {
    selectedInfo,
    syncStatus,
    syncResult,
    handleSync,
    resetStatus,
    canSync: selectedInfo.type !== 'none' && selectedInfo.count > 0,
  }
}
