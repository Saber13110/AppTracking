import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  logAction(action: string, details?: any): void {
    // For now we just log to the console. In the future this could send
    // the event to an external analytics endpoint.
    console.log('[Analytics]', action, details ?? '');
  }
}
