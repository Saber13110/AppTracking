import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Shipment {
  id: string;
  description?: string;
  status: string;
  estimated_delivery?: string;
  created_at: string;
}

export interface ShipmentCreate {
  id: string;
  description?: string;
}

export interface ShipmentUpdate {
  description?: string;
  status?: string;
  estimated_delivery?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ShipmentService {
  private baseUrl = `${environment.apiUrl}/colis`;

  constructor(private http: HttpClient) {}

  getShipments(): Observable<Shipment[]> {
    return this.http.get<Shipment[]>(this.baseUrl);
  }

  createShipment(data: ShipmentCreate): Observable<Shipment> {
    return this.http.post<Shipment>(this.baseUrl, data);
  }

  updateShipment(id: string, data: ShipmentUpdate): Observable<Shipment> {
    return this.http.put<Shipment>(`${this.baseUrl}/${id}`, data);
  }

  deleteShipment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getShipment(id: string): Observable<Shipment> {
    return this.http.get<Shipment>(`${this.baseUrl}/${id}`);
  }
}
