'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { getPendoProfile } from '@/lib/actions/pendo'

export function PendoInitializer() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const initialized = useRef(false)
  const prevSignedIn = useRef<boolean | undefined>(undefined)

  // Boot the SDK exactly once with an anonymous visitor.
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    pendo.initialize({ visitor: { id: '' } })
  }, [])

  // Identify on sign-in, clear session on sign-out.
  useEffect(() => {
    if (!isLoaded) return

    if (isSignedIn && userId && prevSignedIn.current !== true) {
      getPendoProfile().then((profile) => {
        if (!profile) return

        const visitor: Record<string, unknown> = {
          id: profile.clerkUserId,
        }

        if ('contactName' in profile) visitor.full_name = profile.contactName
        if ('email' in profile) visitor.email = profile.email
        if ('phone' in profile) visitor.phone = profile.phone
        if ('state' in profile) visitor.state = profile.state
        if ('createdAt' in profile) visitor.createdAt = profile.createdAt

        const identifyPayload: Record<string, unknown> = { visitor }

        // Include account block only when profile has been completed (accountId present)
        if ('accountId' in profile) {
          const account: Record<string, unknown> = {
            id: profile.accountId,
          }
          if ('companyName' in profile) account.name = profile.companyName
          if ('gstin' in profile) account.gstin = profile.gstin
          if ('cpcbRegNo' in profile) account.cpcbRegNo = profile.cpcbRegNo
          if ('capacityMt' in profile) account.capacityMt = profile.capacityMt
          if ('verified' in profile) account.verified = profile.verified
          identifyPayload.account = account
        }

        pendo.identify(identifyPayload)
      })
    } else if (!isSignedIn && prevSignedIn.current === true) {
      pendo.clearSession()
    }

    prevSignedIn.current = isSignedIn
  }, [isLoaded, isSignedIn, userId])

  return null
}
