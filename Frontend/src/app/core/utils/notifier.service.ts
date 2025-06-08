import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotifierService {
  error(message: string): void {
    // Simple implementation showing browser alert; could be replaced with a better UI
    alert(message);
  }
}
