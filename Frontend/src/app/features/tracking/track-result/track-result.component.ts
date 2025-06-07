import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TrackingService, TrackingInfo } from '../services/tracking.service';

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
} 