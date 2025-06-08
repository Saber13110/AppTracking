import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TrackingInfo, TrackingResponse } from '../models/tracking';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  constructor(private http: HttpClient) {}

  trackPackage(id: string): Observable<TrackingResponse> {
    return this.http.get<TrackingResponse>(`${environment.apiUrl}/tracking/${id}`);
  }
}

export { TrackingInfo, TrackingResponse } from '../models/tracking';
