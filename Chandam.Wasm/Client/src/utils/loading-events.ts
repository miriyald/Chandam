// Event-driven loading system - decouples business logic from UI

export enum LoadingEventType {
  LoadingStarted = 'loading:started',
  LoadingCompleted = 'loading:completed',
  LoadingFailed = 'loading:failed',
  ActionStarted = 'action:started',
  ActionCompleted = 'action:completed',
  ActionFailed = 'action:failed'
}

export interface LoadingEventDetail {
  source: string; // 'wasm-init' | 'rule-set-switch'
  message?: string;
}

export interface ActionEventDetail {
  source: string; // 'analyze' | 'random' | 'filter'
  buttonId?: string;
  resultContainerId?: string;
}

export class LoadingEvents {
  static emit(type: LoadingEventType.LoadingStarted | LoadingEventType.LoadingCompleted | LoadingEventType.LoadingFailed, detail: LoadingEventDetail): void;
  static emit(type: LoadingEventType.ActionStarted | LoadingEventType.ActionCompleted | LoadingEventType.ActionFailed, detail: ActionEventDetail): void;
  static emit(type: LoadingEventType, detail: LoadingEventDetail | ActionEventDetail): void {
    const event = new CustomEvent(type, { detail });
    window.dispatchEvent(event);
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

  static onActionStarted(callback: (detail: ActionEventDetail) => void): void {
    window.addEventListener(LoadingEventType.ActionStarted, (e: Event) => {
      callback((e as CustomEvent<ActionEventDetail>).detail);
    });
  }

  static onActionCompleted(callback: (detail: ActionEventDetail) => void): void {
    window.addEventListener(LoadingEventType.ActionCompleted, (e: Event) => {
      callback((e as CustomEvent<ActionEventDetail>).detail);
    });
  }

  static onActionFailed(callback: (detail: ActionEventDetail) => void): void {
    window.addEventListener(LoadingEventType.ActionFailed, (e: Event) => {
      callback((e as CustomEvent<ActionEventDetail>).detail);
    });
  }
}
