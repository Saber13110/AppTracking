import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TrackingService, TrackingInfo } from '../services/tracking.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { showNotification } from '../../../shared/services/notification.util';

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

  private refreshInterval: any;
  private map: google.maps.Map | null = null;
  private marker: google.maps.Marker | null = null;
  private identifier = '';

  constructor(
    private route: ActivatedRoute,
    private trackingService: TrackingService,
    private analytics: AnalyticsService
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
          this.waitForGoogleMaps().then(() => this.initializeMap());
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
    this.waitForGoogleMaps().then(() => this.initializeMap());
  }


  getItemClasses(event: any, index: number): string {
    const classes = ['timeline-item'];
    if (!this.trackingData?.tracking_history) {
      return classes.join(' ');
    }
    if (index === this.trackingData.tracking_history.length - 1) {
      classes.push('current');
    } else {
      classes.push('past');
    }

    const status = (event.status || '').toLowerCase();
    if (status.includes('delivered')) {
      classes.push('delivered');
    } else if (status.includes('exception')) {
      classes.push('exception');
    } else if (status.includes('transit')) {
      classes.push('in-transit');
    }
    return classes.join(' ');
  }

  private waitForGoogleMaps(): Promise<void> {
    return new Promise(resolve => {
      const check = () => {
        if (typeof window !== 'undefined' && (window as any).google && (window as any).google.maps) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  shareTracking(): void {
    if (navigator.share && this.trackingData) {
      navigator.share({
        title: 'Tracking',
        text: `Tracking ${this.trackingData.tracking_number}`,
        url: window.location.href
      });
      showNotification('Share dialog opened', 'info');
    } else if (this.trackingData?.tracking_number) {
      navigator.clipboard.writeText(this.trackingData.tracking_number);
      showNotification('Tracking number copied', 'success');
    }
    this.analytics.logAction('share_tracking', this.trackingData?.tracking_number);
  }

  printTracking(): void {
    window.print();
    this.analytics.logAction('print_tracking');
    showNotification('Printing...', 'info');
  }

  saveTracking(): void {
    if (this.trackingData?.tracking_number) {
      const key = 'savedTrackingNumbers';
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      if (!saved.includes(this.trackingData.tracking_number)) {
        saved.push(this.trackingData.tracking_number);
        localStorage.setItem(key, JSON.stringify(saved));
        showNotification('Tracking saved', 'success');
      }
      this.analytics.logAction('save_tracking', this.trackingData.tracking_number);
    }
  }

  openDialog(name: string): void {
    this.analytics.logAction('open_dialog', name);
    console.log('Opening dialog', name);
  }

  exportData(): void {
    this.analytics.logAction('export_data');
    console.log('Exporting tracking data');
  }
}
