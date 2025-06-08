import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TrackingHistoryService {
  private storageKey = 'trackingHistory';
  private maxItems = 10;

  getHistory(): string[] {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) as string[] : [];
  }

  addIdentifier(id: string): void {
    const history = this.getHistory().filter(item => item !== id);
    history.unshift(id);
    if (history.length > this.maxItems) {
      history.pop();
    }
    localStorage.setItem(this.storageKey, JSON.stringify(history));
  }

  removeIdentifier(id: string): void {
    const history = this.getHistory().filter(item => item !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(history));
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }
}
