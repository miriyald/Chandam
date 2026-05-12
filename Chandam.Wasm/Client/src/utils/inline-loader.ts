import { LoadingEvents, type ActionEventDetail } from './loading-events';

const LOADER_CIRCLES = `<div class="page-loading">
  <svg class="loader-svg" viewBox="0 0 96 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle class="loader-circle" cx="24" cy="24" r="10" fill="#1a3a5c"/>
    <circle class="loader-circle" cx="48" cy="24" r="10" fill="#b8860b"/>
    <circle class="loader-circle" cx="72" cy="24" r="10" fill="#1a3a5c"/>
  </svg>
</div>`;

interface ActiveAction {
  buttonId: string;
  resultContainerId?: string;
}

export class InlineLoadingManager {
  private activeActions: Map<string, ActiveAction> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    LoadingEvents.onActionStarted((detail) => this.handleStart(detail));
    LoadingEvents.onActionCompleted((detail) => this.handleEnd(detail));
    LoadingEvents.onActionFailed((detail) => this.handleEnd(detail));
  }

  private handleStart(detail: ActionEventDetail): void {
    const { source, buttonId, resultContainerId } = detail;
    if (!buttonId) return;

    const button = document.getElementById(buttonId);
    if (button) {
      button.classList.add('is-loading');
      button.setAttribute('aria-busy', 'true');
    }

    if (resultContainerId) {
      const container = document.getElementById(resultContainerId);
      if (container) {
        container.style.display = 'block';
        const resultsDiv = container.querySelector('#results-container');
        if (resultsDiv) {
          resultsDiv.innerHTML = LOADER_CIRCLES;
        }
      }
    }

    this.activeActions.set(source, { buttonId, resultContainerId });
  }

  private handleEnd(detail: ActionEventDetail): void {
    const action = this.activeActions.get(detail.source);
    if (!action) return;

    const button = document.getElementById(action.buttonId);
    if (button) {
      button.classList.remove('is-loading');
      button.removeAttribute('aria-busy');
    }

    this.activeActions.delete(detail.source);
  }
}

export function initInlineLoader(): InlineLoadingManager {
  return new InlineLoadingManager();
}
