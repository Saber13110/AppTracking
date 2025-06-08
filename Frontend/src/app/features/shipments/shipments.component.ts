import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalendarModule, CalendarEvent } from 'angular-calendar';
import { startOfDay } from 'date-fns';
import { ShipmentService, Shipment } from '../../core/services/shipment.service';
import { NotificationService } from '../../core/services/notification.service';

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
  accounts: string[] = ['A001', 'A002'];
  selectedAccount = '';

  constructor(private shipmentService: ShipmentService, private notif: NotificationService) {}

  ngOnInit() {
    this.loadShipments();
    this.notif.getPreferences().subscribe(p => {
      this.selectedAccount = p.default_account || this.accounts[0];
    });
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

  updateAccount() {
    this.notif.updatePreferences({
      email_updates: true,
      addresses: [],
      preferred_language: 'en',
      event_settings: {},
      default_account: this.selectedAccount
    }).subscribe();
  }
}
