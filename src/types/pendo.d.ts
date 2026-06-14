interface PendoInstance {
  initialize(options: { visitor: { id: string; [key: string]: unknown }; account?: Record<string, unknown> }): void
  identify(payload: { visitor: Record<string, unknown>; account?: Record<string, unknown> }): void
  track(eventName: string, properties?: Record<string, unknown>): void
  trackAgent(eventType: string, metadata: Record<string, unknown>): void
  clearSession(): void
}

declare var pendo: PendoInstance

declare global {
  interface Window {
    pendo?: PendoInstance
  }
}
