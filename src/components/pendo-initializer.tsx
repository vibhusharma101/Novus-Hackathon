'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { getPendoMetadata } from '@/lib/actions/pendo'

export function PendoInitializer() {
  const { userId, isLoaded } = useAuth()
  const identifiedRef = useRef<string | null>(null)

  // Boot the SDK exactly once with an anonymous visitor.
  useEffect(() => {
    if (typeof pendo !== 'undefined') {
      pendo.initialize({ visitor: { id: '' } })
    }
  }, [])

  useEffect(() => {
    if (!isLoaded) return

    // User signed out — clear session so the next user isn't tracked
    // under the previous identity.
    if (!userId && identifiedRef.current) {
      identifiedRef.current = null
      pendo.clearSession()
      return
    }

    // User signed in (or was already signed in on mount) — identify.
    if (userId && identifiedRef.current !== userId) {
      identifiedRef.current = userId

      getPendoMetadata().then((metadata) => {
        if (!metadata) return

        // Only send pseudonymous business identifiers — no personal contact data.
        const visitor: Record<string, unknown> = { id: metadata.visitorId }

        const payload: Record<string, unknown> = { visitor }

        if ('accountId' in metadata && metadata.accountId) {
          const account: Record<string, unknown> = { id: metadata.accountId }
          if (metadata.companyName) account.name = metadata.companyName
          if (metadata.gstin) account.gstin = metadata.gstin
          if (metadata.cpcbRegNo) account.cpcbRegNo = metadata.cpcbRegNo
          if (metadata.state) account.state = metadata.state
          if (metadata.capacityMt != null) account.capacityMt = metadata.capacityMt
          if (metadata.verified != null) account.verified = metadata.verified
          if (metadata.createdAt) account.createdAt = metadata.createdAt
          payload.account = account
        }

        pendo.identify(payload)
      })
    }
  }, [userId, isLoaded])

  return null
}
