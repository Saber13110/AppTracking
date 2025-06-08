import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TrackingInfo } from '../models/tracking';

export interface TrackingResponse {
  success: boolean;
  data?: TrackingInfo;
  error?: string;
  metadata?: { [key: string]: any };
}

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private baseUrl = `${environment.apiUrl}/tracking`;

  constructor(private http: HttpClient) {}

  trackPackage(identifier: string): Observable<TrackingResponse> {
    return this.http.get<TrackingResponse>(`${this.baseUrl}/${identifier}`);
  }

  downloadProof(trackingNumber: string): Observable<Blob> {
    const url = `${this.baseUrl}/${trackingNumber}/proof`;
    return this.http.get(url, { responseType: 'blob' });
  }

  getBarcodeImage(value: string): Observable<Blob> {
    const url = `${environment.apiUrl}/colis/codebar-image/${value}`;
    return this.http.get(url, { responseType: 'blob' });
  }
}

export type { TrackingInfo } from '../models/tracking';
