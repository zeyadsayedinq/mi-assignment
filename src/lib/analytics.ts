// analytics.ts — PostHog event tracking
// PostHog is GDPR-compliant and works well in MENA

declare global { interface Window { posthog?: any; } }

function track(event: string, properties?: Record<string, any>) {
  try {
    if (window.posthog) {
      window.posthog.capture(event, properties);
    }
    // Also log in dev
    if (import.meta.env.DEV) {
      console.log('[Analytics]', event, properties);
    }
  } catch {}
}

export const Analytics = {
  missionLaunched: (type: string, university: string) =>
    track('mission_launched', { type, university }),
  missionCompleted: (type: string, durationMs: number) =>
    track('mission_completed', { type, duration_ms: durationMs }),
  missionFailed: (error: string) =>
    track('mission_failed', { error }),
  slideViewerOpened: (slideCount: number) =>
    track('slide_viewer_opened', { slide_count: slideCount }),
  imageGenerated: (style: string) =>
    track('image_generated', { style }),
  downloadTriggered: (format: string) =>
    track('download_triggered', { format }),
  upgradeClicked: (source: string) =>
    track('upgrade_clicked', { source }),
  languageChanged: (lang: string) =>
    track('language_changed', { lang }),
  authCompleted: (method: string) =>
    track('auth_completed', { method }),
  pageViewed: (page: string) =>
    track('page_viewed', { page }),
};
