/**
 * Google Analytics 4 service
 * Thin wrapper around gtag.js for type-safe event tracking
 */

// Extend Window interface to include gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    GA4_MEASUREMENT_ID?: string;
  }
}

export class AnalyticsService {
  private initialized = false;
  private measurementId: string | null = null;

  /**
   * Initialize GA4 tracking
   * Auto-detects measurement ID from gtag config in index.html
   */
  init(): void {
    if (this.isLocalhost()) {
      console.log('[Analytics] Localhost detected, tracking disabled');
      return;
    }

    if (!this.isAvailable()) {
      console.warn('[Analytics] gtag.js not loaded, tracking disabled');
      return;
    }

    // Auto-detect measurement ID from dataLayer
    this.measurementId = this.detectMeasurementId();

    if (!this.measurementId) {
      console.warn('[Analytics] Could not detect GA4 measurement ID');
      return;
    }

    this.initialized = true;
    console.log('[Analytics] Initialized with measurement ID:', this.measurementId);
  }

  private isLocalhost(): boolean {
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
  }

  private isAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.gtag === 'function';
  }

  /**
   * Track page view (SPA navigation)
   */
  trackPageView(path: string): void {
    if (!this.initialized || !this.isAvailable()) return;

    window.gtag!('event', 'page_view', {
      page_path: path,
      page_title: document.title
    });

    console.log('[Analytics] Page view:', path);
  }

  /**
   * Track custom event with parameters
   */
  trackEvent(eventName: string, params: Record<string, any> = {}): void {
    if (!this.initialized || !this.isAvailable()) return;

    window.gtag!('event', eventName, params);

    console.log('[Analytics] Event:', eventName, params);
  }

  /**
   * Start a timer for measuring action duration.
   * Returns a function that, when called, tracks the event with durationMs included.
   * Pass extra params at completion time to merge with the initial params.
   */
  startTimedEvent(eventName: string, params: Record<string, any> = {}): (extra?: Record<string, any>) => void {
    const startTime = performance.now();
    return (extra?: Record<string, any>) => {
      const durationMs = Math.round(performance.now() - startTime);
      this.trackEvent(eventName, { ...params, ...extra, durationMs });
    };
  }

  /**
   * Set user ID for cross-session tracking
   */
  setUserId(userId: string): void {
    if (!this.initialized || !this.isAvailable() || !this.measurementId) return;

    window.gtag!('config', this.measurementId, {
      user_id: userId
    });

    console.log('[Analytics] User ID set:', userId.substring(0, 8) + '...');
  }

  /**
   * Read the GA4 Measurement ID published by index.html
   */
  private detectMeasurementId(): string | null {
    const id = window.GA4_MEASUREMENT_ID;
    return typeof id === 'string' && id.startsWith('G-') ? id : null;
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();
