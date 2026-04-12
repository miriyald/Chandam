// Event-driven loading system - decouples business logic from UI

export enum LoadingEventType {
  LoadingStarted = 'loading:started',
  LoadingCompleted = 'loading:completed',
  LoadingFailed = 'loading:failed'
}

export interface LoadingEventDetail {
  source: string; // 'wasm-init' | 'rule-set-switch'
  message?: string;
}

export class LoadingEvents {
  static emit(type: LoadingEventType, detail: LoadingEventDetail): void {
    const event = new CustomEvent(type, { detail });
    window.dispatchEvent(event);
    console.log(`LoadingEvent: ${type}`, detail);
  }

  static onLoadingStarted(callback: (detail: LoadingEventDetail) => void): void {
    window.addEventListener(LoadingEventType.LoadingStarted, (e: Event) => {
      callback((e as CustomEvent<LoadingEventDetail>).detail);
    });
  }

  static onLoadingCompleted(callback: (detail: LoadingEventDetail) => void): void {
    window.addEventListener(LoadingEventType.LoadingCompleted, (e: Event) => {
      callback((e as CustomEvent<LoadingEventDetail>).detail);
    });
  }

  static onLoadingFailed(callback: (detail: LoadingEventDetail) => void): void {
    window.addEventListener(LoadingEventType.LoadingFailed, (e: Event) => {
      callback((e as CustomEvent<LoadingEventDetail>).detail);
    });
  }
}
