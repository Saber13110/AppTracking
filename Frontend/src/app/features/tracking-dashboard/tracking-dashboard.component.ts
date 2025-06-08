import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackingService } from '../tracking/services/tracking.service';
import { Subscription } from 'rxjs';
import Chart from 'chart.js/auto';
import { MarkerClusterer } from '@googlemaps/markerclusterer';

@Component({
  selector: 'app-tracking-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tracking-dashboard.component.html',
  styleUrls: ['./tracking-dashboard.component.scss']
})
export class TrackingDashboardComponent implements OnInit, OnDestroy {
  map: google.maps.Map | null = null;
  markers: google.maps.Marker[] = [];
  cluster: MarkerClusterer | null = null;
  stats: any;
  private subs: Subscription[] = [];

  constructor(private trackingService: TrackingService) {}

  ngOnInit(): void {
    this.waitForGoogleMaps().then(() => {
      this.initializeMap();
      this.loadShipments();
      this.loadStats();
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.markers.forEach(m => m.setMap(null));
    if (this.cluster) { this.cluster.clearMarkers(); }
    this.map = null;
  }

  private initializeMap(): void {
    this.map = new window.google.maps.Map(
      document.getElementById('dashboard-map') as HTMLElement,
      { center: { lat: 0, lng: 0 }, zoom: 2 }
    );
  }

  private loadShipments(): void {
    const sub = this.trackingService.getActiveShipments().subscribe(data => {
      this.markers = data.map(item => new window.google.maps.Marker({
        position: { lat: item.lat, lng: item.lng },
        label: item.tracking_number
      }));
      if (this.cluster) {
        this.cluster.clearMarkers();
      }
      if (this.map) {
        this.cluster = new MarkerClusterer({ map: this.map, markers: this.markers });
      }
    });
    this.subs.push(sub);
  }

  private loadStats(): void {
    const sub = this.trackingService.getTrackingStats().subscribe(stats => {
      this.stats = stats;
      this.renderChart();
    });
    this.subs.push(sub);
  }

  private renderChart(): void {
    const ctx = (document.getElementById('status-chart') as HTMLCanvasElement).getContext('2d');
    if (!ctx || !this.stats) return;
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Delivered', 'In Transit', 'Exception'],
        datasets: [{
          data: [this.stats.delivered_trackings, this.stats.in_transit_trackings, this.stats.exception_trackings],
          backgroundColor: ['#4caf50', '#ffa726', '#ef5350']
        }]
      }
    });
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
