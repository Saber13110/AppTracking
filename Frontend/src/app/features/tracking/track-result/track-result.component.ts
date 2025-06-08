import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TrackingService, TrackingInfo } from '../services/tracking.service';
import { Location, TrackingEvent } from '../models/tracking';

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
export class TrackResultComponent implements OnInit {
  trackingInfo: TrackingInfo | null = null;
  loading = true;
  error: string | null = null;
  private map: any = null;
  private markers: any[] = [];
  private polyline: any = null;

  constructor(
    private route: ActivatedRoute,
    private trackingService: TrackingService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const identifier = params['identifier'];
      if (identifier) {
        this.loadTrackingInfo(identifier);
      }
    });
  }

  private waitForGoogleMaps(): Promise<void> {
    return new Promise(resolve => {
      const check = () => {
        if (typeof window !== 'undefined' && window.google && window.google.maps) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  private formatLocation(loc?: Location): string | null {
    if (!loc) return null;
    const parts = [loc.address, loc.city, loc.state, loc.postal_code, loc.country]
      .filter(p => !!p);
    return parts.length ? parts.join(', ') : null;
  }

  private geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    return new Promise(resolve => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const loc = results[0].geometry.location;
          resolve({ lat: loc.lat(), lng: loc.lng() });
        } else {
          resolve(null);
        }
      });
    });
  }

  private async initializeMap() {
    if (!this.trackingInfo) return;

    const originAddress = this.formatLocation(this.trackingInfo.origin);
    const destAddress = this.formatLocation(this.trackingInfo.destination);
    const lastEvent: TrackingEvent | undefined =
      this.trackingInfo.tracking_history?.[0];
    const currentAddress = this.formatLocation(lastEvent?.location);

    const coords = await Promise.all([
      originAddress ? this.geocodeAddress(originAddress) : Promise.resolve(null),
      destAddress ? this.geocodeAddress(destAddress) : Promise.resolve(null),
      currentAddress ? this.geocodeAddress(currentAddress) : Promise.resolve(null)
    ]);

    const valid = coords.filter(c => c) as { lat: number; lng: number }[];
    if (!valid.length) {
      return;
    }

    const mapEl = document.getElementById('map') as HTMLElement;
    this.map = new window.google.maps.Map(mapEl, {
      zoom: 4,
      center: valid[valid.length - 1]
    });

    const labels = ['O', 'D', 'C'];
    valid.forEach((coord, idx) => {
      const marker = new window.google.maps.Marker({ position: coord, map: this.map, label: labels[idx] });
      this.markers.push(marker);
    });

    this.polyline = new window.google.maps.Polyline({
      path: valid,
      strokeColor: '#4d148c',
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
    this.polyline.setMap(this.map);

    const bounds = new window.google.maps.LatLngBounds();
    valid.forEach(c => bounds.extend(c));
    this.map.fitBounds(bounds);
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

  getEventIcon(status: string): string {
    const normalized = status.toLowerCase();
    if (normalized.includes('deliver')) {
      return 'fa-check-circle';
    }
    if (normalized.includes('transit') || normalized.includes('depart')) {
      return 'fa-truck-moving';
    }
    if (normalized.includes('pickup')) {
      return 'fa-box';
    }
    return 'fa-circle';
  }
}
