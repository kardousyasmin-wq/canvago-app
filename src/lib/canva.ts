/**
 * Safe wrappers around Canva SDK calls.
 * When the app runs outside of the Canva iframe (e.g., in dev preview),
 * SDK calls throw — these wrappers catch those errors and return null.
 */

export async function safeSdkCall<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T | null> {
  try {
    return await fn()
  } catch (err) {
    console.warn(`[CanvaGo] SDK call "${label}" unavailable (running outside Canva?):`, err)
    return null
  }
}
