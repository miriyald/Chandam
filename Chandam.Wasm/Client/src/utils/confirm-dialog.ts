interface ConfirmDialogOptions {
    title?: string;
    confirmText?: string;
    cancelText?: string;
}

const CONFIRM_OVERLAY_ID = 'confirm-dialog-overlay';

function closeDialog(overlay: HTMLElement): void {
    overlay.classList.add('is-closing');
    window.setTimeout(() => {
        overlay.remove();
    }, 150);
}

function trapFocus(event: KeyboardEvent, firstFocusable: HTMLElement, lastFocusable: HTMLElement): void {
    if (event.key !== 'Tab') {
        return;
    }

    const active = document.activeElement;

    if (event.shiftKey && active === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
    } else if (!event.shiftKey && active === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
    }
}

export function showConfirm(message: string, options: ConfirmDialogOptions = {}): Promise<boolean> {
    const existing = document.getElementById(CONFIRM_OVERLAY_ID);
    if (existing) {
        existing.remove();
    }

    return new Promise(resolve => {
        const previousFocused = document.activeElement as HTMLElement | null;

        const overlay = document.createElement('div');
        overlay.id = CONFIRM_OVERLAY_ID;
        overlay.className = 'confirm-overlay';

        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');

        const title = document.createElement('h3');
        title.className = 'confirm-title';
        title.textContent = options.title ?? 'Confirm action';

        const body = document.createElement('p');
        body.className = 'confirm-message';
        body.textContent = message;

        const actions = document.createElement('div');
        actions.className = 'confirm-actions';

        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = 'btn-secondary';
        cancelButton.textContent = options.cancelText ?? 'Cancel';

        const confirmButton = document.createElement('button');
        confirmButton.type = 'button';
        confirmButton.className = 'btn-danger';
        confirmButton.textContent = options.confirmText ?? 'Delete';

        actions.appendChild(cancelButton);
        actions.appendChild(confirmButton);

        dialog.appendChild(title);
        dialog.appendChild(body);
        dialog.appendChild(actions);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        const firstFocusable = cancelButton;
        const lastFocusable = confirmButton;

        const cleanup = (result: boolean): void => {
            document.removeEventListener('keydown', handleKeyDown);
            closeDialog(overlay);
            previousFocused?.focus();
            resolve(result);
        };

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                cleanup(false);
                return;
            }

            trapFocus(event, firstFocusable, lastFocusable);
        };

        document.addEventListener('keydown', handleKeyDown);

        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                cleanup(false);
            }
        });

        cancelButton.addEventListener('click', () => cleanup(false));
        confirmButton.addEventListener('click', () => cleanup(true));

        cancelButton.focus();
    });
}
