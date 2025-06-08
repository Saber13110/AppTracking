import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { environment } from '../../../../environments/environment';
import { TrackingInfo, TrackingResponse } from '../models/tracking';

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private baseUrl = `${environment.apiUrl}/track`;

  constructor(private http: HttpClient) {}

  trackPackage(identifier: string, account?: string): Observable<TrackingResponse> {
    const url = account ? `${this.baseUrl}/${identifier}?account=${account}` : `${this.baseUrl}/${identifier}`;
    return this.http.get<TrackingResponse>(url);
  }

  trackNumber(trackingNumber: string, packageName?: string, account?: string): Observable<TrackingResponse> {
    const payload: any = { id: trackingNumber, description: packageName };
    if (account) payload.account = account;
    return this.http.post<TrackingResponse>(`${this.baseUrl}/create`, payload);
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

  trackMultiple(trackingNumbers: string[], account?: string): Observable<TrackingResponse[]> {
    const url = account ? `${this.baseUrl}/batch?account=${account}` : `${this.baseUrl}/batch`;
    return this.http.post<TrackingResponse[]>(url, trackingNumbers);
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
