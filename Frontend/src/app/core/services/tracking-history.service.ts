import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface TrackedShipment {
  tracking_number: string;
  status?: string | null;
  created_at?: string | null;
  id?: string;
  meta_data?: any;
  note?: string | null;
  pinned?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TrackingHistoryService {
  private storageKey = 'trackingHistory';
  private maxItems = 10;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getHistory(): TrackedShipment[] {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? (JSON.parse(raw) as TrackedShipment[]) : [];
  }

  addIdentifier(id: string, status?: string, note?: string, metaData?: any): void {
    const history = this.getHistory().filter(item => item.tracking_number !== id);
    const entry: TrackedShipment = {
      tracking_number: id,
      status: status ?? null,
      created_at: new Date().toISOString(),
      pinned: false,
    };
    history.unshift(entry);
    if (history.length > this.maxItems) {
      history.pop();
    }
    localStorage.setItem(this.storageKey, JSON.stringify(history));

    const payload: any = { tracking_number: id };
    if (status !== undefined) payload.status = status;
    if (note !== undefined) payload.note = note;
    if (metaData !== undefined) payload.meta_data = metaData;

    payload.pinned = false;

    this.http.post<TrackedShipment>(`${environment.apiUrl}/history`, payload).subscribe({
      next: (record) => {
        const updated = this.getHistory().filter(h => h.tracking_number !== id);
        updated.unshift(record);
        localStorage.setItem(this.storageKey, JSON.stringify(updated.slice(0, this.maxItems)));
      },
      error: () => {}
    });
  }

  removeIdentifier(id: string): void {
    const history = this.getHistory().filter(item => item.id !== id && item.tracking_number !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(history));

    this.http.delete(`${environment.apiUrl}/history/${id}`).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }

  deleteAll(): void {
    this.clear();
    this.http.delete(`${environment.apiUrl}/history`).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  updateEntry(id: string, note?: string | null, pinned?: boolean): void {
    const history = this.getHistory();
    const idx = history.findIndex(h => h.id === id);
    if (idx !== -1) {
      if (note !== undefined) history[idx].note = note;
      if (pinned !== undefined) history[idx].pinned = pinned;
      localStorage.setItem(this.storageKey, JSON.stringify(history));
    }

    const payload: any = {};
    if (note !== undefined) payload.note = note;
    if (pinned !== undefined) payload.pinned = pinned;

    this.http.patch<TrackedShipment>(`${environment.apiUrl}/history/${id}`, payload).subscribe({
      next: updated => {
        const h = this.getHistory();
        const i = h.findIndex(v => v.id === id);
        if (i !== -1) {
          h[i] = updated;
          localStorage.setItem(this.storageKey, JSON.stringify(h));
        }
      },
      error: () => {}
    });
  }

  exportHistory(format: 'csv' | 'pdf' = 'csv') {
    const url = `${environment.apiUrl}/history/export?format=${format}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  async syncWithServer(): Promise<void> {
    const loggedIn = await firstValueFrom(this.auth.isLoggedIn());
    if (!loggedIn) {
      return;
    }
    try {
      const records = await firstValueFrom(
        this.http.get<TrackedShipment[]>(`${environment.apiUrl}/history`)
      );

      const map = new Map<string, TrackedShipment>();
      records.forEach(r => map.set(r.tracking_number, r));
      this.getHistory().forEach(h => {
        if (!map.has(h.tracking_number)) {
          map.set(h.tracking_number, h);
        }
      });

      const merged = Array.from(map.values()).sort((a, b) => {
        const da = new Date(a.created_at || '').getTime();
        const db = new Date(b.created_at || '').getTime();
        return db - da;
      }).slice(0, this.maxItems);

      localStorage.setItem(this.storageKey, JSON.stringify(merged));
    } catch {
      // ignore errors
    }
  }
}
