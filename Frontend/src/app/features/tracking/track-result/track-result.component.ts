import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TrackingService, TrackingInfo } from '../services/tracking.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { environment } from '../../../../environments/environment';

declare global {
  interface Window {
    google: any;
  }
}

@Component({
  selector: 'app-track-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './track-result.component.html',
  styleUrls: ['./track-result.component.scss']
})
export class TrackResultComponent implements OnInit, OnDestroy {
  trackingInfo: TrackingInfo | null = null;
  loading = true;
  error: string | null = null;

  map: google.maps.Map | null = null;
  markers: any[] = [];
  polyline: google.maps.Polyline | null = null;

  constructor(
    private route: ActivatedRoute,
    private trackingService: TrackingService,
    private analytics: AnalyticsService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const identifier = params['identifier'];
      if (identifier) {
        this.loadTrackingInfo(identifier);
      }
    });
  }

  private loadTrackingInfo(identifier: string) {
    this.loading = true;
    this.error = null;

    this.trackingService.trackPackage(identifier).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.trackingInfo = response.data;
          this.waitForGoogleMaps().then(() => this.initializeMap());
        } else {
          this.error = response.error || 'Impossible de récupérer les informations de suivi';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Une erreur est survenue lors de la récupération des informations';
        this.loading = false;
        console.error('Erreur de suivi:', err);
      }
    });
  }

  copyTracking() {
    if (this.trackingInfo?.tracking_number) {
      navigator.clipboard.writeText(this.trackingInfo.tracking_number);
      this.analytics.logAction('copy_tracking', this.trackingInfo.tracking_number);
    }
  }

  shareTracking() {
    if (navigator.share && this.trackingInfo) {
      navigator.share({
        title: 'Suivi de colis',
        text: `Suivi ${this.trackingInfo.tracking_number}`,
        url: window.location.href,
      });
    } else {
      this.copyTracking();
    }
    this.analytics.logAction('share_tracking', this.trackingInfo?.tracking_number);
  }

  downloadProof() {
    if (this.trackingInfo) {
      const url = `${environment.apiUrl}/tracking/${this.trackingInfo.tracking_number}/proof`;
      window.open(url, '_blank');
      this.analytics.logAction('download_proof', this.trackingInfo.tracking_number);
    }
  }

  contactSupport() {
    this.analytics.logAction('contact_support');
    window.location.href = '/support';
  }

  ngOnDestroy() {
    this.markers.forEach(m => m.setMap(null));
    if (this.polyline) {
      this.polyline.setMap(null);
    }
    this.map = null;
  }

  private getLatLng(location: any): google.maps.LatLngLiteral | null {
    const lat = location?.coordinates?.latitude;
    const lng = location?.coordinates?.longitude;
    if (lat != null && lng != null) {
      return { lat, lng };
    }
    return null;
  }

  private initializeMap() {
    if (!this.trackingInfo || typeof window.google === 'undefined') {
      return;
    }

    const origin = this.getLatLng(this.trackingInfo.origin);
    const destination = this.getLatLng(this.trackingInfo.destination);

    const path: google.maps.LatLngLiteral[] = [];
    if (origin) {
      path.push(origin);
    }

    let current: google.maps.LatLngLiteral | null = null;
    this.trackingInfo.tracking_history?.forEach(event => {
      const coord = this.getLatLng(event.location);
      if (coord) {
        path.push(coord);
        current = coord;
      }
    });

    if (destination) {
      path.push(destination);
    }

    const center = current || origin || destination || path[0] || { lat: 0, lng: 0 };

    const mapEl = document.getElementById('map') as HTMLElement;
    this.map = new window.google.maps.Map(mapEl, { center, zoom: 6 });

    if (origin) {
      this.markers.push(new window.google.maps.Marker({ position: origin, map: this.map, label: 'O' }));
    }

    if (destination) {
      this.markers.push(new window.google.maps.Marker({ position: destination, map: this.map, label: 'D' }));
    }

    if (current) {
      this.markers.push(new window.google.maps.Marker({ position: current, map: this.map, label: 'C' }));
    }

    if (path.length > 1) {
      this.polyline = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#FF6600',
        strokeOpacity: 1.0,
        strokeWeight: 2
      });
      this.polyline.setMap(this.map);

      const bounds = new window.google.maps.LatLngBounds();
      path.forEach(p => bounds.extend(p));
      this.map.fitBounds(bounds);
    }
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
}
