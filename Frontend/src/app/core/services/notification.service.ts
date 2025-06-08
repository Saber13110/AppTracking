import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
}

export interface NotificationPreferences {
  email_updates: boolean;
  addresses: string[];
  preferred_language: string;
  event_settings: { [key: string]: string[] };
  default_account?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private baseUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  getUnreadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.baseUrl}?unread_only=true`);
  }

  getUnreadCount(): Observable<number> {
    return this.getUnreadNotifications().pipe(
      map((notifications) => notifications.length),
      catchError(() => of(0))
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.post(`${this.baseUrl}/mark-all-read`, {});
  }

  getPreferences(): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.baseUrl}/preferences`);
  }

  updatePreferences(prefs: NotificationPreferences): Observable<NotificationPreferences> {
    return this.http.post<NotificationPreferences>(`${this.baseUrl}/preferences`, prefs);
  }
}
