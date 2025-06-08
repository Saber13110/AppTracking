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
  private favoritesKey = 'trackingFavorites';
  private nicknamesKey = 'trackingNicknames';
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
    const favs = this.getFavorites();
    favs.delete(id);
    localStorage.setItem(this.favoritesKey, JSON.stringify(Array.from(favs)));
    const names = this.getNicknames();
    delete names[id];
    localStorage.setItem(this.nicknamesKey, JSON.stringify(names));
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.favoritesKey);
    localStorage.removeItem(this.nicknamesKey);
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

  private getFavorites(): Set<string> {
    const raw = localStorage.getItem(this.favoritesKey);
    return new Set(raw ? JSON.parse(raw) as string[] : []);
  }

  isFavorite(id: string): boolean {
    return this.getFavorites().has(id);
  }

  setFavorite(id: string, value: boolean): void {
    const favs = this.getFavorites();
    if (value) {
      favs.add(id);
    } else {
      favs.delete(id);
    }
    localStorage.setItem(this.favoritesKey, JSON.stringify(Array.from(favs)));
    this.http.patch(`${environment.apiUrl}/history/${id}`, { favorite: value }).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  private getNicknames(): Record<string, string> {
    const raw = localStorage.getItem(this.nicknamesKey);
    return raw ? JSON.parse(raw) as Record<string, string> : {};
  }

  getNickname(id: string): string | null {
    return this.getNicknames()[id] || null;
  }

  setNickname(id: string, nickname: string): void {
    const names = this.getNicknames();
    names[id] = nickname;
    localStorage.setItem(this.nicknamesKey, JSON.stringify(names));
    this.http.patch(`${environment.apiUrl}/history/${id}`, { nickname }).subscribe({
      next: () => {},
      error: () => {}
    });
  }
}
