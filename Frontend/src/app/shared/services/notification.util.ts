export function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  const containerId = 'global-notification-container';
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.className = 'notification-container';
    document.body.appendChild(container);
  }

  const notif = document.createElement('div');
  notif.className = `notification ${type}`;
  notif.textContent = message;
  container.appendChild(notif);

  setTimeout(() => {
    notif.classList.add('fade-out');
    notif.addEventListener('transitionend', () => notif.remove());
  }, 3000);
}
