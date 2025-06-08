import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TrackingService, TrackingInfo } from '../services/tracking.service';

interface FedexTrackingInfo extends TrackingInfo {
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

@Component({
  selector: 'app-fedex-track-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fedex-track-result.component.html',
  styleUrls: ['./fedex-track-result.component.scss']
})
export class FedexTrackResultComponent implements OnInit, OnDestroy {
  trackingData: FedexTrackingInfo | null = null;
  loading = true;
  error: string | null = null;

  steps = ['Shipment Info', 'In Transit', 'Delivered'];
  currentStep = 0;
  currentStatusClass = '';

  private refreshInterval: any;
  private map: google.maps.Map | null = null;
  private marker: google.maps.Marker | null = null;
  private identifier = '';

  constructor(private route: ActivatedRoute, private trackingService: TrackingService) {}

  private updateProgress(): void {
    if (!this.trackingData) {
      this.currentStep = 0;
      this.currentStatusClass = '';
      return;
    }

    const status = this.trackingData.status.status.toLowerCase();
    if (status.includes('delivered')) {
      this.currentStep = 2;
      this.currentStatusClass = 'delivered';
    } else if (status.includes('exception')) {
      this.currentStep = 1;
      this.currentStatusClass = 'exception';
    } else if (status.includes('transit')) {
      this.currentStep = 1;
      this.currentStatusClass = 'in-transit';
    } else {
      this.currentStep = 0;
      this.currentStatusClass = '';
    }
  }

  getStepClass(index: number): string {
    const classes = [] as string[];
    if (index < this.currentStep) {
      classes.push('completed');
    } else if (index === this.currentStep) {
      classes.push('current');
      if (this.currentStatusClass) {
        classes.push(this.currentStatusClass);
      }
    } else {
      classes.push('pending');
    }
    return classes.join(' ');
  }

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
          this.updateProgress();
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
        const status = (res.data as FedexTrackingInfo | undefined)?.status;
        if (loc && this.marker && this.map) {
          const position = { lat: loc.latitude, lng: loc.longitude };
          this.marker.setPosition(position);
          this.map.panTo(position);
        }
        if (status) {
          this.trackingData = { ...(this.trackingData as FedexTrackingInfo), status };
          this.updateProgress();
        }
      },
      error: () => {}
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
    this.updateProgress();
  }
}
