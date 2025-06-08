import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TrackingService, TrackingInfo } from '../services/tracking.service';
import { ScheduleDeliveryDialogComponent } from '../schedule-delivery-dialog/schedule-delivery-dialog.component';
import { ChangeAddressDialogComponent } from '../change-address-dialog/change-address-dialog.component';
import { HoldLocationDialogComponent } from '../hold-location-dialog/hold-location-dialog.component';
import { DeliveryInstructionsDialogComponent } from '../delivery-instructions-dialog/delivery-instructions-dialog.component';

interface FedexTrackingInfo extends TrackingInfo {
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

@Component({
  selector: 'app-fedex-track-result',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './fedex-track-result.component.html',
  styleUrls: ['./fedex-track-result.component.scss']
})
export class FedexTrackResultComponent implements OnInit, OnDestroy {
  trackingData: FedexTrackingInfo | null = null;
  loading = true;
  error: string | null = null;

  private refreshInterval: any;
  private map: google.maps.Map | null = null;
  private marker: google.maps.Marker | null = null;
  private identifier = '';

  constructor(
    private route: ActivatedRoute,
    private trackingService: TrackingService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.identifier = params['identifier'];
      if (this.identifier) {
        this.loadData();
        this.refreshInterval = setInterval(() => this.updateLocation(), 30000);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.marker) {
      this.marker.setMap(null);
    }
    this.map = null;
  }

  private loadData(): void {
    this.loading = true;
    this.trackingService.trackPackage(this.identifier).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.trackingData = res.data as FedexTrackingInfo;
          this.initializeMap();
        } else {
          this.useMockData();
        }
        this.loading = false;
      },
      error: () => {
        this.useMockData();
        this.loading = false;
      }
    });
  }

  private updateLocation(): void {
    this.trackingService.trackPackage(this.identifier).subscribe({
      next: res => {
        const loc = (res.data as FedexTrackingInfo | undefined)?.currentLocation;
        if (loc && this.marker && this.map) {
          const position = { lat: loc.latitude, lng: loc.longitude };
          this.marker.setPosition(position);
          this.map.panTo(position);
        }
      },
      error: () => {}
    });
  }

  openScheduleDelivery(): void {
    this.dialog
      .open(ScheduleDeliveryDialogComponent)
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.snackBar.open('Delivery scheduled', 'Close', { duration: 3000 });
        }
      });
  }

  openChangeAddress(): void {
    this.dialog
      .open(ChangeAddressDialogComponent)
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.snackBar.open('Address change requested', 'Close', { duration: 3000 });
        }
      });
  }

  openHoldLocation(): void {
    this.dialog
      .open(HoldLocationDialogComponent)
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.snackBar.open('Hold request sent', 'Close', { duration: 3000 });
        }
      });
  }

  openDeliveryInstructions(): void {
    this.dialog
      .open(DeliveryInstructionsDialogComponent)
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.snackBar.open('Instructions added', 'Close', { duration: 3000 });
        }
      });
  }

  private initializeMap(): void {
    if (!this.trackingData?.currentLocation || typeof window.google === 'undefined') {
      return;
    }
    const coords = {
      lat: this.trackingData.currentLocation.latitude,
      lng: this.trackingData.currentLocation.longitude
    };
    const mapEl = document.getElementById('fedex-map') as HTMLElement;
    this.map = new window.google.maps.Map(mapEl, { center: coords, zoom: 8 });
    this.marker = new window.google.maps.Marker({ position: coords, map: this.map });
  }

  private useMockData(): void {
    this.error = 'API unavailable - using mock data';
    this.trackingData = {
      tracking_number: this.identifier,
      carrier: 'FedEx',
      status: { status: 'In transit', description: 'Mocked data', is_delivered: false },
      tracking_history: [],
      currentLocation: { latitude: 33.5731, longitude: -7.5898 }
    } as FedexTrackingInfo;
    this.initializeMap();
  }
}
