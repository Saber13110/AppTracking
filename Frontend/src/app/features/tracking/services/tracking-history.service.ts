import { Injectable } from '@angular/core';

export interface TrackingHistoryItem {
  identifier: string;
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrackingHistoryService {
  private storageKey = 'tracking_history';

  getHistory(): TrackingHistoryItem[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) as TrackingHistoryItem[] : [];
  }

  add(identifier: string): void {
    const history = this.getHistory().filter(i => i.identifier !== identifier);
    history.unshift({ identifier, date: new Date().toISOString() });
    localStorage.setItem(this.storageKey, JSON.stringify(history));
  }

  remove(identifier: string): void {
    const history = this.getHistory().filter(i => i.identifier !== identifier);
    localStorage.setItem(this.storageKey, JSON.stringify(history));
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }
}
