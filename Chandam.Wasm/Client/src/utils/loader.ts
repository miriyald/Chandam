import { LoadingEvents, LoadingEventType } from './loading-events';

export interface LoaderConfig {
  fallbackText: string;
  containerId: string;
}

const LOADER_SVG = `<svg class="loader-svg" viewBox="0 0 128 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <circle class="loader-circle" cx="24" cy="24" r="7" fill="#1a3a5c"/>
  <circle class="loader-circle" cx="48" cy="24" r="10" fill="#b8860b"/>
  <circle class="loader-circle" cx="72" cy="24" r="7" fill="#1a3a5c"/>
  <circle class="loader-circle" cx="96" cy="24" r="10" fill="#b8860b"/>
</svg>`;

export class LoadingAnimationManager {
  private config: LoaderConfig;
  private isShowing: boolean = false;

  constructor(config: LoaderConfig) {
    this.config = config;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    LoadingEvents.onLoadingStarted(() => {
      this.show();
    });

    LoadingEvents.onLoadingCompleted(() => {
      this.hide();
    });

    LoadingEvents.onLoadingFailed(() => {
      this.hide();
    });
  }

  private show(): void {
    const container = document.getElementById(this.config.containerId);
    if (!container) return;
    if (this.isShowing) return;

    container.innerHTML = this.createLoaderHTML();
    this.isShowing = true;
  }

  private async hide(): Promise<void> {
    if (!this.isShowing) return;

    const container = document.getElementById(this.config.containerId);
    if (container) {
      const loaderDiv = container.querySelector('.loader-container');
      if (loaderDiv) {
        loaderDiv.classList.add('fade-out');
        await this.delay(400);
        container.innerHTML = '';
      }
    }

    this.isShowing = false;
  }

  private createLoaderHTML(): string {
    return `
      <div class="loader-container" aria-label="${this.config.fallbackText}">
        ${LOADER_SVG}
        <p class="loader-fallback" style="display:none;">${this.config.fallbackText}</p>
      </div>
    `;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export function createInitialLoader(): LoadingAnimationManager {
  return new LoadingAnimationManager({
    fallbackText: 'Loading Chandam...',
    containerId: 'initial-loader'
  });
}

export function createDynamicLoader(): LoadingAnimationManager {
  return new LoadingAnimationManager({
    fallbackText: 'Loading rule set...',
    containerId: 'dynamic-loader-container'
  });
}
