import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { environment } from '../../../../environments/environment';
import { TrackingInfo, TrackingResponse } from '../models/tracking';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private baseUrl = `${environment.apiUrl}/track`;

  constructor(private http: HttpClient) {}

  trackPackage(identifier: string): Observable<TrackingResponse> {
    return this.http.get<TrackingResponse>(`${this.baseUrl}/${identifier}`);
  }

  trackNumber(trackingNumber: string, packageName?: string): Observable<TrackingResponse> {
    return this.http.post<TrackingResponse>(`${this.baseUrl}/create`, {
      id: trackingNumber,
      description: packageName
    });
  }

  trackReference(reference: string): Observable<TrackingResponse> {
    return this.http.get<TrackingResponse>(`${this.baseUrl}/reference/${reference}`);
  }

  trackTcn(tcn: string): Observable<TrackingResponse> {
    return this.http.get<TrackingResponse>(`${this.baseUrl}/tcn/${tcn}`);
  }

  decodeBarcodeServer(file: File): Observable<{ barcode: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ barcode: string }>(`${this.baseUrl}/barcode/decode`, formData);
  }


  exportTracking(identifier: string, format: string): Observable<Blob> {
    const url = `${this.baseUrl}/${identifier}/export?format=${format}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  downloadProof(trackingNumber: string): Observable<Blob> {
    const url = `${this.baseUrl}/proof/${trackingNumber}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  getBarcodeImage(value: string): Observable<Blob> {
    const url = `${environment.apiUrl}/colis/codebar-image/${value}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  trackByEmail(tracking_number: string, email: string): Observable<TrackingResponse> {
    return this.http.post<TrackingResponse>(`${this.baseUrl}/email`, { tracking_number, email });
  }

  getActiveShipments(): Observable<any[]> {
    return this.http.get<{ success: boolean; data: any[] }>(`${this.baseUrl}/active`).pipe(
      map(res => res.data)
    );
  }

  getTrackingStats(): Observable<any> {
    return this.http.get<{ success: boolean; data: any }>(`${this.baseUrl}/stats`).pipe(
      map(res => res.data)
    );
  }

  decodeBarcodeClient(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const decoder = new BrowserMultiFormatReader();
          const result = await decoder.decodeFromImageUrl(reader.result as string);
          resolve(result.getText());
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
  }
}

export type { TrackingInfo, TrackingResponse } from '../models/tracking';
