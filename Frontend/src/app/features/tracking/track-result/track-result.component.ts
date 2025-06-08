import { Component, OnInit, OnDestroy } from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TrackingService, TrackingInfo } from '../services/tracking.service';
import { TrackingHistoryService } from '../../../core/services/tracking-history.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { showNotification } from '../../../shared/services/notification.util';
import { environment } from '../../../../environments/environment';
import { Subscription } from 'rxjs';

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
  styleUrls: ['./track-result.component.scss'],
  animations: [
    trigger('timelineAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class TrackResultComponent implements OnInit, OnDestroy {
  trackingInfo: TrackingInfo | null = null;
  loading = true;
  refreshing = false;
  error: string | null = null;

  map: google.maps.Map | null = null;
  markers: any[] = [];
  polyline: google.maps.Polyline | null = null;
  proofUrl: SafeResourceUrl | null = null;
  private proofObjectUrl: string | null = null;
  private refreshIntervalId: any;
  private identifier: string | null = null;
  private paramsSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private trackingService: TrackingService,
    private analytics: AnalyticsService,
    private history: TrackingHistoryService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.paramsSub = this.route.params.subscribe(params => {
      const identifier = params['identifier'];
      if (identifier) {
        this.identifier = identifier;
        this.loadTrackingInfo(identifier);
        if (this.refreshIntervalId) {
          clearInterval(this.refreshIntervalId);
        }
        this.refreshIntervalId = setInterval(() => {
          if (this.identifier) {
            this.refreshing = true;
            this.loadTrackingInfo(this.identifier);
          }
        }, 30000);
      }
    });
  }

  private loadTrackingInfo(identifier: string) {
    if (!this.refreshing) {
      this.loading = true;
    }
    this.error = null;

    this.trackingService.trackPackage(identifier).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.trackingInfo = response.data;
          this.history.addIdentifier(identifier);
          this.waitForGoogleMaps().then(() => this.initializeMap());
          this.fetchProof();
        } else {
          this.error = response.error || 'Impossible de récupérer les informations de suivi';
          showNotification(this.error!, 'error');
        }
        this.loading = false;
        this.refreshing = false;
      },
      error: (err) => {
        this.error = 'Une erreur est survenue lors de la récupération des informations';
        this.loading = false;
        this.refreshing = false;
        console.error('Erreur de suivi:', err);
        showNotification(this.error!, 'error');
      }
    });
  }

  copyTracking() {
    if (this.trackingInfo?.tracking_number) {
      navigator.clipboard.writeText(this.trackingInfo.tracking_number);
      this.analytics.logAction('copy_tracking', this.trackingInfo.tracking_number);
      showNotification('Tracking number copied', 'success');
    }
  }

  shareTracking() {
    if (navigator.share && this.trackingInfo) {
      navigator.share({
        title: 'Suivi de colis',
        text: `Suivi ${this.trackingInfo.tracking_number}`,
        url: window.location.href,
      });
      showNotification('Share dialog opened', 'info');
    } else {
      navigator.clipboard.writeText(window.location.href);
      showNotification('Link copied', 'success');
    }
    this.analytics.logAction('share_tracking', this.trackingInfo?.tracking_number);
  }

  downloadProof() {
    if (!this.trackingInfo) {
      return;
    }

    this.analytics.logAction('download_proof', this.trackingInfo.tracking_number);

    this.trackingService.downloadProof(this.trackingInfo.tracking_number).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proof_${this.trackingInfo!.tracking_number}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        this.error = err.error?.error || 'Aucune preuve de livraison disponible';
        console.error('Erreur de preuve:', err);
        showNotification(this.error!, 'error');
      }
    });
  }

  fetchProof() {
    if (!this.trackingInfo) return;
    this.trackingService.downloadProof(this.trackingInfo.tracking_number).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        this.proofObjectUrl = url;
        this.proofUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      },
      error: () => {
        this.proofUrl = null;
      }
    });
  }

  closeProof() {
    if (this.proofUrl) {
      if (this.proofObjectUrl) {
        window.URL.revokeObjectURL(this.proofObjectUrl);
        this.proofObjectUrl = null;
      }
      this.proofUrl = null;
    }
  }

  printTracking() {
    window.print();
    showNotification('Printing...', 'info');
  }

  saveTracking() {
    if (this.trackingInfo?.tracking_number) {
      const key = 'savedTrackingNumbers';
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      if (!saved.includes(this.trackingInfo.tracking_number)) {
        saved.push(this.trackingInfo.tracking_number);
        localStorage.setItem(key, JSON.stringify(saved));
        showNotification('Tracking saved', 'success');
      }
    }
  }

  contactSupport() {
    this.analytics.logAction('contact_support');
    window.location.href = '/support';
  }

  ngOnDestroy() {
    if (this.paramsSub) {
      this.paramsSub.unsubscribe();
    }
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
    }
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
    const delivered = this.getLatLng(this.trackingInfo.delivery_details?.delivery_location);

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

    if (delivered) {
      path.push(delivered);
    }

    const center = current || delivered || origin || destination || path[0] || { lat: 0, lng: 0 };

    const mapEl = document.getElementById('map') as HTMLElement;
    this.map = new window.google.maps.Map(mapEl, { center, zoom: 6 });

    if (origin) {
      this.markers.push(new window.google.maps.Marker({ position: origin, map: this.map, label: 'O' }));
    }

    if (destination) {
      this.markers.push(new window.google.maps.Marker({ position: destination, map: this.map, label: 'D' }));
    }

    if (delivered) {
      this.markers.push(new window.google.maps.Marker({ position: delivered, map: this.map, label: 'X' }));
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
      this.polyline!.setMap(this.map!);

      const bounds = new window.google.maps.LatLngBounds();
      path.forEach(p => bounds.extend(p));
      this.map!.fitBounds(bounds);
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

  getItemClasses(event: any, index: number): string {
    const classes = ['timeline-item'];
    if (!this.trackingInfo) {
      return classes.join(' ');
    }
    if (index === this.trackingInfo.tracking_history.length - 1) {
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
}
