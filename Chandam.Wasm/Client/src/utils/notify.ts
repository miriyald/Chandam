export type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface NotifyOptions {
  title?: string;
  durationMs?: number;
}

interface ToastHandle {
  id: number;
  element: HTMLElement;
  dismissTimeout: number;
}

const TOAST_CONTAINER_ID = 'toast-container';
const MAX_ACTIVE_TOASTS = 3;
const DEFAULT_DURATION_MS = 5000;

let toastIdCounter = 0;
const activeToasts: ToastHandle[] = [];

function getToastContainer(): HTMLElement {
  let container = document.getElementById(TOAST_CONTAINER_ID);

  if (!container) {
    container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'assertive');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }

  return container;
}

function closeToast(handle: ToastHandle): void {
  const index = activeToasts.findIndex(t => t.id === handle.id);
  if (index >= 0) {
    activeToasts.splice(index, 1);
  }

  window.clearTimeout(handle.dismissTimeout);
  handle.element.classList.add('is-closing');

  window.setTimeout(() => {
    handle.element.remove();
  }, 240);
}

function enqueueToast(element: HTMLElement, durationMs: number): ToastHandle {
  let handle: ToastHandle;
  const dismissTimeout = window.setTimeout(() => {
    closeToast(handle);
  }, durationMs);

  handle = {
    id: ++toastIdCounter,
    element,
    dismissTimeout
  };

  activeToasts.push(handle);
  return handle;
}

function pruneToastOverflow(): void {
  while (activeToasts.length > MAX_ACTIVE_TOASTS) {
    const oldest = activeToasts.shift();
    if (!oldest) {
      break;
    }

    window.clearTimeout(oldest.dismissTimeout);
    oldest.element.remove();
  }
}

function createToastElement(type: NotificationType, message: string, options: NotifyOptions): HTMLElement {
  const toast = document.createElement('article');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');

  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;

  const title = document.createElement('h4');
  title.className = 'toast-title';
  title.textContent = options.title ?? type.charAt(0).toUpperCase() + type.slice(1);

  const description = document.createElement('p');
  description.className = 'toast-message';
  description.textContent = message;

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'toast-close';
  closeButton.setAttribute('aria-label', 'Dismiss notification');
  closeButton.textContent = 'x';

  const progress = document.createElement('div');
  progress.className = 'toast-progress';
  progress.style.animationDuration = `${durationMs}ms`;

  const content = document.createElement('div');
  content.className = 'toast-content';
  content.appendChild(title);
  content.appendChild(description);

  toast.appendChild(content);
  toast.appendChild(closeButton);
  toast.appendChild(progress);

  return toast;
}

export function notify(message: string, type: NotificationType = 'info', options: NotifyOptions = {}): void {
  const container = getToastContainer();
  const element = createToastElement(type, message, options);
  container.appendChild(element);

  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;
  const handle = enqueueToast(element, durationMs);

  const closeButton = element.querySelector('.toast-close') as HTMLButtonElement | null;
  closeButton?.addEventListener('click', () => closeToast(handle));

  pruneToastOverflow();
}

export function notifyList(items: string[], type: NotificationType = 'warning', options: NotifyOptions = {}): void {
  const uniqueItems = items.filter(Boolean);
  if (uniqueItems.length === 0) {
    return;
  }

  const container = getToastContainer();
  const toast = document.createElement('article');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');

  const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;

  const title = document.createElement('h4');
  title.className = 'toast-title';
  title.textContent = options.title ?? 'Validation';

  const list = document.createElement('ul');
  list.className = 'toast-list';
  uniqueItems.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  });

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'toast-close';
  closeButton.setAttribute('aria-label', 'Dismiss notification');
  closeButton.textContent = 'x';

  const progress = document.createElement('div');
  progress.className = 'toast-progress';
  progress.style.animationDuration = `${durationMs}ms`;

  const content = document.createElement('div');
  content.className = 'toast-content';
  content.appendChild(title);
  content.appendChild(list);

  toast.appendChild(content);
  toast.appendChild(closeButton);
  toast.appendChild(progress);

  container.appendChild(toast);

  const handle = enqueueToast(toast, durationMs);
  closeButton.addEventListener('click', () => closeToast(handle));

  pruneToastOverflow();
}
