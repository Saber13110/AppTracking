import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarModule, CalendarEvent } from 'angular-calendar';
import { startOfDay } from 'date-fns';
import { ShipmentService, Shipment } from '../../core/services/shipment.service';

@Component({
  selector: 'app-shipments',
  standalone: true,
  imports: [CommonModule, FormsModule, CalendarModule],
  templateUrl: './shipments.component.html',
  styleUrls: ['./shipments.component.scss']
})
export class ShipmentsComponent implements OnInit {
  shipments: Shipment[] = [];
  filtered: Shipment[] = [];
  events: CalendarEvent[] = [];
  filterText = '';
  viewMode: 'list' | 'calendar' = 'list';
  viewDate: Date = new Date();

  constructor(private shipmentService: ShipmentService) {}

  ngOnInit() {
    this.loadShipments();
  }

  loadShipments() {
    this.shipmentService.getShipments().subscribe(sh => {
      this.shipments = sh;
      this.applyFilter();
    });
  }

  applyFilter() {
    const term = this.filterText.toLowerCase();
    this.filtered = this.shipments.filter(s =>
      (!term || s.description?.toLowerCase().includes(term) || s.status.toLowerCase().includes(term))
    ).sort((a, b) => {
      const da = a.estimated_delivery || a.created_at;
      const db = b.estimated_delivery || b.created_at;
      return da.localeCompare(db);
    });
    this.events = this.filtered
      .filter(s => !!s.estimated_delivery)
      .map(s => ({
        start: startOfDay(new Date(s.estimated_delivery!)),
        title: s.description || s.id
      }));
  }

  setView(mode: 'list' | 'calendar') {
    this.viewMode = mode;
  }
}
