import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface HistoryRecord {
  tracking_number: string;
  sender?: string;
  status?: string;
  last_consulted?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrackingHistoryService {
  private storageKey = 'trackingHistory';
  private maxItems = 10;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getHistory(): HistoryRecord[] {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return [];
    }
    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        if (data.length && typeof data[0] === 'string') {
          return (data as string[]).map(num => ({ tracking_number: num }));
        }
        return data as HistoryRecord[];
      }
      return [];
    } catch {
      return [];
    }
  }

  addIdentifier(id: string, extras: Partial<HistoryRecord> = {}): void {
    this.addRecord({
      tracking_number: id,
      last_consulted: new Date().toISOString(),
      ...extras
    });
  }

  private addRecord(record: HistoryRecord): void {
    const history = this.getHistory().filter(h => h.tracking_number !== record.tracking_number);
    history.unshift(record);
    if (history.length > this.maxItems) {
      history.pop();
    }
    localStorage.setItem(this.storageKey, JSON.stringify(history));
  }

  removeIdentifier(id: string): void {
    const history = this.getHistory().filter(item => item.tracking_number !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(history));
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }

  async syncWithServer(): Promise<void> {
    const loggedIn = await firstValueFrom(this.auth.isLoggedIn());
    if (!loggedIn) {
      return;
    }
    try {
      const records = await firstValueFrom(
        this.http.get<HistoryRecord[]>(`${environment.apiUrl}/history`)
      );
      const mergedMap = new Map<string, HistoryRecord>();
      records.forEach(r => mergedMap.set(r.tracking_number, r));
      this.getHistory().forEach(item => {
        if (!mergedMap.has(item.tracking_number)) {
          mergedMap.set(item.tracking_number, item);
        }
      });
      const merged = Array.from(mergedMap.values()).sort((a, b) => {
        const da = new Date(a.last_consulted || '').getTime();
        const db = new Date(b.last_consulted || '').getTime();
        return db - da;
      }).slice(0, this.maxItems);
      localStorage.setItem(this.storageKey, JSON.stringify(merged));
    } catch {
      // ignore errors
    }
  }
}
