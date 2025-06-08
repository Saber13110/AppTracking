import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TrackingHistoryService {
  private storageKey = 'trackingHistory';
  private maxItems = 10;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getHistory(): string[] {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) as string[] : [];
  }

  addIdentifier(id: string, status?: string, note?: string, metaData?: any): void {
    const history = this.getHistory().filter(item => item !== id);
    history.unshift(id);
    if (history.length > this.maxItems) {
      history.pop();
    }
    localStorage.setItem(this.storageKey, JSON.stringify(history));

    const payload: any = { tracking_number: id };
    if (status !== undefined) payload.status = status;
    if (note !== undefined) payload.note = note;
    if (metaData !== undefined) payload.meta_data = metaData;

    this.http.post(`${environment.apiUrl}/history`, payload).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  removeIdentifier(id: string): void {
    const history = this.getHistory().filter(item => item !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(history));
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
        this.http.get<{ tracking_number: string }[]>(`${environment.apiUrl}/history`)
      );
      const serverNumbers = records.map(r => r.tracking_number);
      const merged = Array.from(new Set([...serverNumbers, ...this.getHistory()]));
      localStorage.setItem(this.storageKey, JSON.stringify(merged.slice(0, this.maxItems)));
    } catch {
      // ignore errors
    }
  }
}
