export type NotificationType = 'success' | 'error' | 'info';

let container: HTMLElement | null = null;

function getContainer(): HTMLElement {
  if (!container) {
    container = document.createElement('div');
    container.className = 'global-notification-container';
    document.body.appendChild(container);
  }
  return container;
}

export function showNotification(message: string, type: NotificationType = 'info'): void {
  const parent = getContainer();
  const notif = document.createElement('div');
  notif.className = `global-notification ${type}`;
  notif.textContent = message;
  parent.appendChild(notif);

  setTimeout(() => {
    notif.classList.add('hide');
    setTimeout(() => parent.removeChild(notif), 300);
  }, 3000);
}
