import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
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

  private handleRequest<T>(obs: Observable<T>): Observable<T> {
    return obs.pipe(
      catchError(err => {
        alert('Unable to fetch tracking information');
        return throwError(() => err);
      })
    );
  }

  trackPackage(identifier: string): Observable<TrackingResponse> {
    if (environment.simulateNetworkError) {
      return throwError(() => new Error('Simulated network error'));
    }
    return this.handleRequest(
      this.http.get<TrackingResponse>(`${this.baseUrl}/${identifier}`)
    );
  }

  trackNumber(trackingNumber: string, packageName?: string): Observable<TrackingResponse> {
    if (environment.simulateNetworkError) {
      return throwError(() => new Error('Simulated network error'));
    }
    return this.handleRequest(
      this.http.post<TrackingResponse>(`${this.baseUrl}/create`, {
        id: trackingNumber,
        description: packageName
      })
    );
  }

  trackReference(reference: string): Observable<TrackingResponse> {
    return this.trackPackage(reference);
  }

  trackTcn(tcn: string): Observable<TrackingResponse> {
    return this.trackPackage(tcn);
  }

  decodeBarcode(file: File): Observable<{ value: string }> {
    if (environment.simulateNetworkError) {
      return throwError(() => new Error('Simulated network error'));
    }
    const formData = new FormData();
    formData.append('file', file);
    return this.handleRequest(
      this.http.post<{ value: string }>(`${this.baseUrl}/decode-barcode`, formData)
    );
  }

  downloadExport(): Observable<Blob> {
    if (environment.simulateNetworkError) {
      return throwError(() => new Error('Simulated network error'));
    }
    return this.handleRequest(
      this.http.get(`${this.baseUrl}/export`, { responseType: 'blob' })
    );
  }

  downloadProof(trackingNumber: string): Observable<Blob> {
    if (environment.simulateNetworkError) {
      return throwError(() => new Error('Simulated network error'));
    }
    const url = `${this.baseUrl}/${trackingNumber}/proof`;
    return this.handleRequest(
      this.http.get(url, { responseType: 'blob' })
    );
  }

  getBarcodeImage(value: string): Observable<Blob> {
    if (environment.simulateNetworkError) {
      return throwError(() => new Error('Simulated network error'));
    }
    const url = `${environment.apiUrl}/colis/codebar-image/${value}`;
    return this.handleRequest(
      this.http.get(url, { responseType: 'blob' })
    );
  }

  trackByEmail(tracking_number: string, email: string): Observable<TrackingResponse> {
    if (environment.simulateNetworkError) {
      return throwError(() => new Error('Simulated network error'));
    }
    return this.handleRequest(
      this.http.post<TrackingResponse>(`${this.baseUrl}/email`, { tracking_number, email })
    );
  }
}

export type { TrackingInfo } from '../models/tracking';
