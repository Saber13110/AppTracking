import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TrackingService, TrackingInfo } from '../services/tracking.service';
import { environment } from '../../../../environments/environment';

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

  private loadTrackingInfo(identifier: string) {
    this.loading = true;
    this.error = null;

    this.trackingService.trackPackage(identifier).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.trackingInfo = response.data;
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
  }

  downloadProof() {
    if (this.trackingInfo) {
      const url = `${environment.apiUrl}/tracking/${this.trackingInfo.tracking_number}/proof`;
      window.open(url, '_blank');
    }
  }

  contactSupport() {
    window.location.href = '/support';
  }
}
