import { LoadingEvents, LoadingEventType } from './loading-events';

export interface LoaderConfig {
  gifPath: string;
  fallbackText: string;
  containerId: string;
}

export class LoadingAnimationManager {
  private config: LoaderConfig;
  private isShowing: boolean = false;

  constructor(config: LoaderConfig) {
    this.config = config;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    LoadingEvents.onLoadingStarted((detail) => {
      this.show();
    });

    LoadingEvents.onLoadingCompleted((detail) => {
      this.hide();
    });

    LoadingEvents.onLoadingFailed((detail) => {
      this.hide();
    });
  }

  private show(): void {
    const container = document.getElementById(this.config.containerId);
    if (!container) {
      console.error(`Loader: Container #${this.config.containerId} not found`);
      return;
    }

    if (this.isShowing) return; // Already showing

    container.innerHTML = this.createLoaderHTML();
    this.isShowing = true;
    console.log('Loader: Showing');
  }

  private async hide(): Promise<void> {
    if (!this.isShowing) return;

    const container = document.getElementById(this.config.containerId);
    if (container) {
      const loaderDiv = container.querySelector('.loader-container');
      if (loaderDiv) {
        loaderDiv.classList.add('fade-out');
        await this.delay(500); // Wait for CSS fade-out transition
        container.innerHTML = '';
      }
    }

    this.isShowing = false;
    console.log('Loader: Hidden');
  }

  private createLoaderHTML(): string {
    return `
      <div class="loader-container">
        <object type="image/svg+xml" data="/branding/chandam-circles.svg"
               class="loader-gif"
               aria-label="${this.config.fallbackText}">
        </object>
        <p class="loader-fallback" style="display:none;">${this.config.fallbackText}</p>
      </div>
    `;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Pre-load image to browser cache for instant display
export function preloadLoaderImage(gifPath: string): void {
  const img = new Image();
  img.src = gifPath;
  console.log(`Preloading loader image: ${gifPath}`);
}

export function createInitialLoader(): LoadingAnimationManager {
  return new LoadingAnimationManager({
    gifPath: '/branding/chandam-circles.svg',
    fallbackText: 'Loading Chandam...',
    containerId: 'initial-loader'
  });
}

export function createDynamicLoader(): LoadingAnimationManager {
  return new LoadingAnimationManager({
    gifPath: '/branding/chandam-circles.svg',
    fallbackText: 'Loading rule set...',
    containerId: 'dynamic-loader-container'
  });
}
