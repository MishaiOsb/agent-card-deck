import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string'

/**
 * Encode a full deck (clientInfo + deck data) into a URL-safe hash string.
 */
export function encodeDeckToHash(clientInfo, deck) {
  const payload = {
    v: 1, // version for future compat
    c: clientInfo,
    d: {
      agents: deck.agents.map(a => ({
        id: a.id,
        templateId: a.templateId,
        data: a.data,
        revision: a.revision,
        status: a.status,
        changeRequests: a.changeRequests,
      })),
      timeline: deck.timeline,
      revisionPolicy: deck.revisionPolicy,
      backlog: deck.backlog,
      createdAt: deck.createdAt,
    },
  }

  const json = JSON.stringify(payload)
  return compressToEncodedURIComponent(json)
}

/**
 * Decode a hash string back into { clientInfo, deck }.
 * Returns null if invalid.
 */
export function decodeDeckFromHash(hash) {
  try {
    const json = decompressFromEncodedURIComponent(hash)
    if (!json) return null
    const payload = JSON.parse(json)
    if (payload.v !== 1) return null
    return {
      clientInfo: payload.c,
      deck: payload.d,
    }
  } catch {
    return null
  }
}

/**
 * Build a full shareable URL from the current location + encoded hash.
 */
export function buildShareURL(clientInfo, deck) {
  const hash = encodeDeckToHash(clientInfo, deck)
  const base = window.location.origin + window.location.pathname
  return `${base}#share=${hash}`
}

/**
 * Check the current URL for a shared deck.
 * Returns { clientInfo, deck } or null.
 */
export function getSharedDeckFromURL() {
  const hash = window.location.hash
  if (!hash.startsWith('#share=')) return null
  const encoded = hash.slice('#share='.length)
  return decodeDeckFromHash(encoded)
}
