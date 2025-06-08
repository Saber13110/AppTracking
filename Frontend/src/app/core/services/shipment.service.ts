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

@Injectable({
  providedIn: 'root'
})
export class ShipmentService {
  private baseUrl = `${environment.apiUrl}/colis`;

  constructor(private http: HttpClient) {}

  getShipments(): Observable<Shipment[]> {
    return this.http.get<Shipment[]>(this.baseUrl);
  }
}
